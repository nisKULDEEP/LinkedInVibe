chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_data") {
    handleDownload(request.data, sendResponse);
    return true; 
  }
  
  if (request.action === "generate_post") {
    generatePost(request.data, sender, sendResponse);
    return true; 
  }

  if (request.action === "schedule_post") {
      const { minutes, username } = request;
      chrome.alarms.create("scheduled_post_alarm", { delayInMinutes: minutes });
      chrome.storage.local.set({ scheduledUser: username });
      sendResponse({ success: true });
      return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("scheduler_poll", { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "scheduled_post_alarm") {
        // ... (Existing logic for simple one-off timer) ...
        console.log("Alarm fired! Starting scheduled post flow...");
        chrome.storage.local.get(['scheduledUser'], (result) => {
            if (result.scheduledUser) {
                const targetUrl = `https://www.linkedin.com/in/${result.scheduledUser}/`;
                chrome.storage.local.set({ autoScrape: true }, () => {
                     chrome.tabs.create({ url: targetUrl });
                });
            }
        });
    } else if (alarm.name === "scheduler_poll") {
        checkAndExecuteSchedule();
    }
});

async function checkAndExecuteSchedule() {
    const { authToken, linkedinUsername } = await chrome.storage.local.get(['authToken', 'linkedinUsername']);
    if (!authToken || !linkedinUsername) return;

    try {
        const response = await fetch('http://localhost:3000/api/schedule', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.schedule) {
            const now = new Date();
            const duePosts = data.schedule.filter(p => 
                p.status === 'pending' && 
                p.auto_post === true && 
                new Date(p.scheduled_time) <= now
            ).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)); // Oldest first

            for (const post of duePosts) {
                const scheduledTime = new Date(post.scheduled_time);
                const diffHours = (now - scheduledTime) / (1000 * 60 * 60);

                if (diffHours > 24) {
                    // Mark as Failed (Missed Window)
                    console.log(`❌ Post ${post.id} is ${Math.round(diffHours)}h overdue. Marking failed.`);
                    await markPostStatus(post.id, 'failed', authToken);
                } else {
                    // Valid Post - Execute ONLY ONE per poll cycle (5 mins) to avoid spam
                    console.log(`✅ Found due post ${post.id}. Executing...`);
                    executeAutoPilot(post, authToken, linkedinUsername);
                    return; // Stop after triggering one
                }
            }
        }
    } catch (e) {
        console.error("Polling Error:", e);
    }
}

async function executeAutoPilot(post, token, username) {
    // 1. Generate Content (using the topic from DB)
    // We reuse logic but override the 'customTopic'
    
    // First, mark as 'processing' or just do it.
    // Ideally we lock it so next poll doesn't pick it up? 
    // For now, let's rely on it being fast or just taking the first one.

    try {
        // Scrape or just Generate? To mimic style we technically need to scrape first...
        // But for fully background auto-pilot, we might want to skip scraping if we have cached posts?
        // Or we just open the tab and do the whole flow.
        
        // Let's Open the Tab and Trigger the Flow, but passing the specific TOPIC.
        
        // We save the 'activeScheduledPost' to storage so content script knows what to do?
        // Actually, the current flow relies on Popup triggering 'generate_post'.
        // We need to automate that trigger.
        
        // STRATEGY:
        // 1. Storage: set { autoPilotPost: post (object) }
        // 2. Open LinkedIn.
        // 3. Content Script loads -> checks 'autoScrape' (existing) OR 'autoPilotPost'.
        // 4. If 'autoPilotPost', it scrapes posts -> sends 'generate_post' message to background.
        // 5. Background sees 'autoPilotPost' in storage -> uses THAT topic instead of UI topic.
        // 6. Background generates -> sends back text.
        // 7. Content Script pastes text -> Clicks Post (if we implement that, currently it just pastes).
        
        // Let's implement Step 1 & 2 here.
        
        await chrome.storage.local.set({ 
            autoPilotPost: post,
            autoScrape: true // Re-use the existing scrape trigger
        });
        
        const targetUrl = `https://www.linkedin.com/in/${username}/`;
        chrome.tabs.create({ url: targetUrl });
        
        // After success, we need to mark it as 'posted'. 
        // This will be tricky because the flow is async across content script.
        // We might need a new listener for "post_pasted" or similar?
        
        // For MVP: We assume if we generated successfully, we mark as posted.
        
    } catch (e) {
        console.error("AutoPilot Failed", e);
    }
}

// Helper to update status
async function markPostStatus(postId, status, token) {
     try {
        const BACKEND_URL = 'http://localhost:3000/api'; 
        await fetch(`${BACKEND_URL}/schedule/${postId}/complete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: status })
        });
     } catch (e) {
         console.error("Failed to update status", e);
     }
}

function handleDownload(data, sendResponse) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `linkedin_posts_${timestamp}.json`;
  
  const jsonStr = JSON.stringify(data, null, 2);
  const blobUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(jsonStr)))}`;

  chrome.downloads.download({
    url: blobUrl,
    filename: filename,
    saveAs: false
  }, (downloadId) => {
    sendResponse({success: true, downloadId: downloadId});
  });
}

// Main Entry Point for Generation
async function generatePost(scrapedPosts, sender, sendResponse) {
  try {
    const { authMode, geminiApiKey, authToken, userProfile, customTopic, autoPilotPost } = await chrome.storage.local.get(['authMode', 'geminiApiKey', 'authToken', 'userProfile', 'customTopic', 'autoPilotPost']);
    
    // Default to BYOK if not set
    const mode = authMode || 'byok';
    
    // Determine Topic (AutoPilot overrides CustomTopic)
    let finalTopic = customTopic;
    if (autoPilotPost) {
        finalTopic = autoPilotPost.topic;
        console.log("🤖 AutoPilot Active: Using scheduled topic:", finalTopic);
    }

    // 1. Construct the Prompt (Shared Logic)
    const systemPrompt = constructSystemPrompt(scrapedPosts, userProfile, finalTopic);

    // 2. Route Request
    let generatedText = "";
    
    if (mode === 'pro') {
        if (!authToken) {
            sendResponse({ success: false, error: "Link your Pro account in the popup first." });
            return;
        }
        sendStatus(sender.tab.id, "Generating with Pro Cloud...");
        generatedText = await generatePostWithBackend(systemPrompt, "", authToken);
        
    } else {
        // BYOK Mode
        if (!geminiApiKey) {
            sendResponse({ success: false, error: "API Key not found. Please set it in the extension popup." });
            return;
        }
        sendStatus(sender.tab.id, "Generating with your Gemini Key...");
        generatedText = await generatePostWithGeminiDirect(systemPrompt, geminiApiKey);
    }

    // 3. Post-Process Text (Markdown -> Unicode)
    const formattedText = convertMarkdownToUnicode(generatedText);
    console.log("Text generated:", formattedText.substring(0, 50));
    
    // 4. Generate Image (Only locally for BYOK for now, or backend if Pro?)
    // Decision: For now, let's keep Image Gen LOCAL for BYOK. 
    // Ideally backend should handle image gen too for Pro, but let's reuse local logic for simplicity unless user requested full cloud.
    // Actually user said "how extention will know that this person has bought the plan".
    // If Pro, we should probably generate image on backend too to protect prompts/keys? 
    // But for this MVP, let's keep image gen client-side using the SAME method if possible?
    // Wait, if Pro mode, user might NOT have a Gemini Key. 
    // So Image Gen MUST go through Backend if Pro.
    
    let imageBase64 = null;
    
    if (mode === 'pro') {
        // TODO: Implement Backend Image Gen Endpoint. 
        // For now, we return text only or mock it.
        // OR: We send a second request to backend for image.
        sendStatus(sender.tab.id, "Text ready! (Image gen requires local key for now in MVP)");
        // Temporarily skip image for Pro until backend supports it
    } else {
        // BYOK - Use Local Key
        sendStatus(sender.tab.id, "Text ready! Creating image...");
        try {
            const imagePrompt = await generateImagePrompt(geminiApiKey, formattedText);
            imageBase64 = await generateImageWithGemini(geminiApiKey, imagePrompt);
        } catch (e) {
            console.error("Image Gen Failed", e);
            sendStatus(sender.tab.id, "Image gen failed, using text only.");
        }
    }

    sendResponse({ success: true, text: formattedText, imageBase64: imageBase64 });

    // Handle AutoPilot Completion
    if (autoPilotPost && authToken) {
        const BACKEND_URL = 'http://localhost:3000/api'; 
        fetch(`${BACKEND_URL}/schedule/${autoPilotPost.id}/complete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'posted' })
        }).then(() => {
            console.log("✅ Scheduled post marked as complete.");
            chrome.storage.local.remove(['autoPilotPost']);
        });
    }

  } catch (error) {
    console.error("Generation Error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// --- Strategies ---

async function generatePostWithBackend(systemPrompt, userMessage, token) {
    // Current Backend runs on localhost:3000
    // In production, change this URL
    const BACKEND_URL = 'http://localhost:3000/api/generate'; 
    
    const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ systemPrompt, userMessage })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
        throw new Error(data.error || "Backend request failed");
    }
    
    return data.text;
}

async function generatePostWithGeminiDirect(systemPrompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.candidates[0].content.parts[0].text;
}

function constructSystemPrompt(scrapedPosts, userProfile, customTopic) {
    // Construct Context
    let profileContext = "";
    if (userProfile) {
        profileContext = `
        USER PROFILE CONTEXT:
        - Name: ${userProfile.name}
        - Headline: ${userProfile.headline}
        - Experience: ${userProfile.experience}
        - About: ${userProfile.about.substring(0, 500)}...
        `;
    }

    // Determine Topic Strategy
    let topicInstruction = "3. The topic should be relevant to the user's niche (based on recent posts) but UNIQUE (do not copy exact topics).";
    if (customTopic && customTopic.length > 0) {
        topicInstruction = `3. **CRITICAL: The post MUST be about this specific custom topic:** "${customTopic}". Ignore topics from recent posts, only mimic the STYLE.`;
    }

    // Construct Prompt
    const postsContext = (scrapedPosts || []).map(p => `- ${p.text} (Likes: ${p.likes})`).join('\n');
    return `You are an expert LinkedIn content creator who writes highly engaging, viral posts for professional and tech audiences.
    
    Your task:
    1. Analyze the style and tone of the USER'S RECENT POSTS provided below.
    2. Incorporate the USER PROFILE CONTEXT to ensure the post is relevant to their specific role and background.
    ${topicInstruction}
    4. Generate a new LinkedIn post that matches this style but adheres to the following strict formatting rules.
    
    ${profileContext}

    Formatting & Style Rules:
    1. Use **bold** for key terms, stats, and section headers.
    2. Use _italic_ for emphasis or nuance.
    3. Use ✅, 🚀, 💡, 🔥, or 🎯 sparingly (max 1 per paragraph/section) for visual breaks.
    4. Keep paragraphs short (1–2 lines each) for scannability.
    5. Where relevant, include bullet points (•) or numbered lists (e.g., 1️⃣).
    6. End with an engaging CTA (ask a question or invite discussion).
    7. **CRITICAL LENGTH RULE:** The output MUST be strictly under 1,500 characters (including hashtags). If you exceed this, the post will fail. Aim for 1,200 characters.
    8. **Hook:** The first 200 characters must be extremely compelling to hook the reader and make them click "See more".
    9. Must be in English.
    10. **Conciseness:** Cut fluff. Do not write long intros. Get straight to the value.

    USER'S RECENT POSTS (Mimic this style):
    ${postsContext}
    
    OUTPUT:
    Return ONLY the post content.`;
}

// Helper to send status updates to content script
function sendStatus(tabId, message) {
    if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: "status_update", message: message }).catch(() => {});
    }
}

// --- Image Helpers ---
async function generateImagePrompt(apiKey, postText) {
     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
     
     const imagePromptTemplate = `You are an AI that converts LinkedIn post content into a highly detailed **Orthographic Blueprint / Technical Schematic** image prompt.

Input Content: 
"${postText.substring(0, 1500)}..."

**Step 1: Extract Key Concepts**
Identify the top 3 items (technical terms, tools, or insights) from the text.
(Example: "System Design, Scalability, Load Balancers")

**Step 2: Generate Image Prompt**
Create a prompt for a **Technical Orthographic Blueprint** that visually deconstructs these concepts. Think "Engineering Schematic" or "Architecture Plan".

**Type-Specific Instructions:**
- **Tech/Coding:** A complex system architecture diagram in blueprint style. White lines on technical blue background. Features: Server nodes, database cylinders, data flow arrows, API endpoints, grid lines, and dimensional measurements.
- **Career/Productivity:** A "Success Algorithm" flowchart or "Career Trajectory" schematic. Logic gates, decision trees, and process blocks.
- **General:** An exploded view or cross-section technical drawing of the main theme.

**General Rules:**
- **Style:** Orthographic Blueprint. Flat 2D technical drawing. Monospaced technical fonts for labels.
- **Aesthetic:** Deep Blueprint Blue background (#004182) with White/Cyan lines. High precision.
- **Details:** Include grid lines, measurement arrows, scale bars, and technical callouts (e.g., "FIG 1.0", "SCALE 1:1").
- **Branding:** Bottom footer must have a thin white line. Text: "LinkedInVibe | @LinkedInVibe".

Output Format:
"A technical orthographic blueprint of [Main Subject]. [Visual details: grid lines, measurements, schematic nodes for 'Key Concept 1, 2, 3']. Style: Blueprint, white lines on deep blue. Footer: 'LinkedInVibe' branding."`;

     const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: imagePromptTemplate }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Anime sketch style tech illustration";
}

async function generateImageWithGemini(apiKey, imagePrompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{ parts: [{ text: imagePrompt }] }],
        generationConfig: {
           responseModalities: ["IMAGE"] 
        } 
    };
    
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    // Extract Base64
    const b64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    
    if (!b64) {
        console.warn("No base64 image found. Full response:", JSON.stringify(data));
        throw new Error("Model returned no image data.");
    }
    return b64;
}

function convertMarkdownToUnicode(text) {
  // Maps for conversion
  // Bold (Serif Bold)
  const toBold = (str) => {
    const boldMap = {
      'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
      'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
      '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return str.split('').map(char => boldMap[char] || char).join('');
  };

  // Replace **bold** with Unicode Bold
  text = text.replace(/\*\*(.*?)\*\*/g, (match, p1) => toBold(p1));
  
  // Remove Italic markers (*) without changing font, as user disliked the specific italic unicode style
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  return text;
}
