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

  if (request.action === "test_scheduler") {
      console.log("🧪 Manual scheduler test triggered...");
      checkAndExecuteSchedule().then(() => {
          sendResponse({ success: true });
      });
      return true;
  }

  // Handle tokens from Dashboard bridge
  if (request.action === "save_tokens") {
      console.log("🔑 Receiving tokens from Dashboard...");
      chrome.storage.local.set({
          authToken: request.accessToken,
          refreshToken: request.refreshToken,
          linkedinUsername: request.username || ''
      }, () => {
          console.log("✅ Tokens saved from Dashboard!");
          sendResponse({ success: true });
      });
      return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("🚀 Extension Installed/Updated - Creating scheduler alarm...");
    chrome.alarms.create("scheduler_poll", { periodInMinutes: 5 });
});

// Ensure alarm exists on startup (in case extension was reloaded)
chrome.runtime.onStartup.addListener(async () => {
    console.log("🔄 Extension Startup - Verifying scheduler alarm...");
    const alarms = await chrome.alarms.getAll();
    const hasScheduler = alarms.some(a => a.name === "scheduler_poll");
    
    if (!hasScheduler) {
        console.log("⚠️ Scheduler alarm missing - Creating now...");
        chrome.alarms.create("scheduler_poll", { periodInMinutes: 5 });
    } else {
        console.log("✅ Scheduler alarm exists:", alarms.find(a => a.name === "scheduler_poll"));
    }
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

// Token refresh via Backend (No Supabase Creds in Extension)
async function refreshAccessToken(refreshToken) {
    try {
        console.log("🔑 Calling Backend refresh endpoint...");
        // Use production URL
        const BACKEND_URL = 'https://linkedinvibe.onrender.com/api/refresh-token'; 
        
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        const data = await response.json();
        
        if (data.success && data.access_token) {
            // Store the new tokens
            await chrome.storage.local.set({
                authToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken // Use new or fallback to old
            });
            console.log("✅ New tokens saved to storage.");
            return data.access_token;
        } else {
            console.error("❌ Refresh failed:", data.error);
            return null;
        }
    } catch (e) {
        console.error("❌ Refresh Network Error:", e);
        return null;
    }
}

async function checkAndExecuteSchedule() {
    console.log(`🕒 Polling Scheduler at ${new Date().toLocaleTimeString()}...`);
    const result = await chrome.storage.local.get(['authToken', 'refreshToken', 'linkedinUsername', 'failedRetries']);
    let authToken = result.authToken;
    const refreshToken = result.refreshToken;
    const linkedinUsername = result.linkedinUsername;
    const failedRetries = result.failedRetries || {}; // { postId: retryCount }
    
    if (!authToken || !linkedinUsername) {
        console.log("⚠️ Polling skipped: Missing Token or Username.");
        return;
    }

    try {
        // Use Live Backend for Scheduler
        const BACKEND_URL = 'https://linkedinvibe.onrender.com/api/schedule';
        console.log(`📡 Fetching schedule from ${BACKEND_URL}`);
        
        let response = await fetch(BACKEND_URL, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let data = await response.json();
        
        // Auto-refresh on 401
        if (response.status === 401 || data.error === 'Invalid Token') {
            console.log("🔄 Token expired - attempting refresh...");
            
            if (!refreshToken) {
                console.error("❌ No refresh token available. User must re-authenticate.");
                return;
            }
            
            const newToken = await refreshAccessToken(refreshToken);
            if (newToken) {
                authToken = newToken;
                // Retry the request
                console.log("✅ Token refreshed! Retrying request...");
                response = await fetch(BACKEND_URL, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                data = await response.json();
            } else {
                console.error("❌ Token refresh failed. User must re-authenticate.");
                return;
            }
        }
        
        // Enhanced error logging
        if (!data.success) {
            console.error("❌ Schedule API Failed:", {
                error: data.error || "Unknown error",
                message: data.message || "No message",
                statusCode: response.status
            });
            return;
        }
        
        console.log("📊 Schedule Response: Success", `(${data.schedule ? data.schedule.length : 0} total posts)`);
        
        if (data.success && data.schedule) {
            const now = new Date();
            
            // Log all posts with their details
            console.log("📋 All scheduled posts:");
            data.schedule.forEach((p, idx) => {
                const scheduledTime = new Date(p.scheduled_time);
                const isPast = scheduledTime <= now;
                const retries = failedRetries[p.id] || 0;
                console.log(`  ${idx + 1}. ID: ${p.id}, Topic: "${p.topic?.substring(0, 30)}...", Status: ${p.status}, Auto-Post: ${p.auto_post}, Time: ${scheduledTime.toLocaleString()}, ${isPast ? '✅ Past due' : '⏳ Future'}${retries > 0 ? `, Retries: ${retries}/3` : ''}`);
            });
            
            // Process ALL pending posts that are due (auto_post only affects whether we auto-click Post)
            const duePosts = data.schedule.filter(p => 
                p.status === 'pending' && 
                new Date(p.scheduled_time) <= now
            ).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)); // Oldest first

            console.log(`🔎 Found ${duePosts.length} pending posts due.`);

            for (const post of duePosts) {
                const scheduledTime = new Date(post.scheduled_time);
                const diffHours = (now - scheduledTime) / (1000 * 60 * 60);
                const postRetries = failedRetries[post.id] || 0;

                if (diffHours > 24) {
                    // Mark as Failed (Missed Window)
                    console.log(`❌ Post ${post.id} is ${Math.round(diffHours)}h overdue. Marking failed.`);
                    await markPostStatus(post.id, 'failed', authToken);
                } else {
                    // Valid Post - Execute with retry logic
                    console.log(`✅ Found due post ${post.id} scheduled for ${scheduledTime.toLocaleTimeString()}. Executing... (Attempt ${postRetries + 1}/3)`);
                    
                    const success = await executeAutoPilotWithRetry(post, authToken, linkedinUsername);
                    
                    if (!success) {
                        // Increment retry count
                        failedRetries[post.id] = postRetries + 1;
                        await chrome.storage.local.set({ failedRetries });
                        
                        if (failedRetries[post.id] >= 3) {
                            console.error(`💀 Post ${post.id} failed 3 times. Marking as permanently FAILED.`);
                            await markPostStatus(post.id, 'failed', authToken);
                            delete failedRetries[post.id];
                            await chrome.storage.local.set({ failedRetries });
                        } else {
                            console.warn(`⚠️ Post ${post.id} failed. Will retry (${failedRetries[post.id]}/3).`);
                        }
                    } else {
                        // Clear retry count on success
                        if (failedRetries[post.id]) {
                            delete failedRetries[post.id];
                            await chrome.storage.local.set({ failedRetries });
                        }
                    }
                    
                    return; // Stop after triggering one
                }
            }
        }
    } catch (e) {
        console.error("🔥 Polling Error:", e.message || e, e.stack);
    }
}

// Wrapper for retry logic - returns true on success, false on failure
async function executeAutoPilotWithRetry(post, token, username) {
    try {
        await executeAutoPilot(post, token, username);
        return true; // If no error thrown, consider it a success (tab opened)
    } catch (e) {
        console.error(`❌ executeAutoPilot error for post ${post.id}:`, e.message || e);
        return false;
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
        const BACKEND_URL = 'https://linkedinvibe.onrender.com/api'; 
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
        const BACKEND_URL = 'https://linkedinvibe.onrender.com/api'; 
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
    // -------- USER PROFILE CONTEXT --------
    let profileContext = "";
    if (userProfile) {
        profileContext = `
USER PROFILE CONTEXT:
- Name: ${userProfile.name || "N/A"}
- Headline: ${userProfile.headline || "N/A"}
- Experience Summary: ${userProfile.experience || "N/A"}
- About (excerpt): ${userProfile.about ? userProfile.about.substring(0, 600) : "N/A"}
`;
    }

    // -------- RECENT POSTS CONTEXT --------
    const postsContext = (scrapedPosts || [])
        .slice(0, 10)
        .map((p, i) => `Post ${i + 1}: "${p.text}"`)
        .join("\n");

    // -------- TOPIC STRATEGY --------
    let topicInstruction = `
TOPIC SELECTION & NOVELTY RULES (CRITICAL):

1. Analyze the last 10 posts and IDENTIFY:
   - Dominant category:
     (LLD / HLD / DSA / Backend / Frontend / Infra)
   - Problems or questions already covered.

2. You MUST select a NEW problem or question.
   - Do NOT reuse the same system.
   - Do NOT rephrase an old topic.

3. The new topic must be:
   - In the SAME category (audience continuity)
   - A NATURAL NEXT STEP in difficulty or scope.

Examples:
- LLD → Parking Lot done → Splitwise / BookMyShow
- HLD → News Feed done → Uber Dispatch / Search
- DSA → Binary Search done → Monotonic Stack

Think like a Staff Engineer planning a SERIES:
“What should the audience learn NEXT?”
`;

    if (customTopic && customTopic.trim().length > 0) {
        topicInstruction = `
CRITICAL TOPIC OVERRIDE:
- The post MUST be about this exact topic:
  "${customTopic}"
- Ignore novelty rules.
- ONLY mimic tone and depth.
`;
    }

    // -------- SYSTEM PROMPT --------
    return `
You are a Staff-level Software Engineer writing high-signal LinkedIn posts
for engineers preparing for interviews or building scalable systems.

Your goal is NOT to explain everything.
Your goal is to teach ONE reusable idea clearly and completely.

${topicInstruction}

==============================
CRITICAL RULE 1 — DEFINE LEARNING
==============================
Before writing, internally define ONE learning sentence:

“After reading this post, the reader should be able to say:
<ONE clear technical insight>”

Examples:
- “Pre-aggregating state beats recomputation at scale.”
- “Queues serialize concurrency; locks fight it.”
- “Most LLD failures come from shared mutable state.”

EVERY paragraph must reinforce this sentence.
If it doesn’t, REMOVE it.

==============================
CRITICAL RULE 2 — HOOK PSYCHOLOGY
==============================
LinkedIn shows only the FIRST TWO LINES.

The hook MUST:
- Create a curiosity gap BEFORE revealing the answer
- Use social or interview framing

The FIRST LINE MUST include one of:
- “Most engineers…”
- “Most candidates…”
- “Interviewers reject…”
- “Everyone does X, but…”

AVOID starting with conclusions.
DO NOT give the answer in line 1.

BAD:
- “If you recompute balances, your design is broken.”

GOOD:
- “Most Splitwise HLD answers fail before scalability even starts.”
- “Interviewers reject Splitwise designs for one silent reason.”

==============================
CRITICAL RULE 3 — CONTENT DEPTH
==============================
The post MUST feel complete.

LENGTH REQUIREMENTS:
- Minimum: 700 characters
- Ideal: 900–1100 characters
- Hard max: 1300 characters (including hashtags)

If under 700 chars:
- Expand WHY naive approach fails
- Clarify the mechanism
- Expand the example slightly

DO NOT add:
- New ideas
- Extra tradeoffs
- Unrelated optimizations

==============================
POST STRUCTURE (MANDATORY)
==============================

1️⃣ HOOK (1–2 lines)
- Psychological, curiosity-driven

2️⃣ WHY NAIVE APPROACH FAILS (3–4 lines)
- Name the common approach
- Explain exactly where it breaks

3️⃣ WHAT ACTUALLY WORKS (4–5 lines)
- Explain the correct approach
- Focus on HOW state is managed
- Contrast with naive approach

4️⃣ MICRO EXAMPLE
- 4–6 numbered steps
- Show state change clearly

5️⃣ INTERVIEW TAKEAWAY
- ONE quotable sentence
- Reusable verbatim

6️⃣ CTA (EASY)
- Simple question
- Answerable in one sentence

GOOD CTAs:
- “Have you seen this in interviews?”
- “Have you designed something like this?”
- “Did you use aggregation or recomputation?”

==============================
STYLE RULES
==============================
- Short paragraphs
- **Bold** only core insight
- _Italic_ only consequences
- Max 1 emoji
- Confident, opinionated tone

==============================
HASHTAGS
==============================
- 8–10 relevant technical hashtags

==============================
OUTPUT
==============================
Return ONLY the final LinkedIn post text.

==============================
CONTEXT
==============================

${profileContext}

RECENT POSTS (STYLE ONLY):
${postsContext}
`;
}


// Helper to send status updates to content script
function sendStatus(tabId, message) {
    if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: "status_update", message: message }).catch(() => {});
    }
}

async function generateImagePrompt(apiKey, postText) {
    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const imagePromptTemplate = `
You are a Staff-level Software Engineer creating a TEACHING IMAGE.

This image must ADD understanding beyond the text.
If the image does not teach, it has failed.

INPUT POST:
"${postText.substring(0, 1200)}"

================================
STEP 1 — DEFINE THE LEARNING
================================
Extract ONE explicit learning sentence from the post.

Examples:
- “Pre-aggregated state beats recomputation at scale.”
- “Locks fail because concurrent writes mutate shared state.”
- “Queues work because writes are serialized before mutation.”

DO NOT proceed until this sentence is clear.

================================
STEP 2 — IMAGE STRUCTURE
================================
Choose ONE structure that best PROVES the learning:

A) Side-by-side comparison
   LEFT = What breaks
   RIGHT = What works

B) Step-by-step flow
   Numbered sequence showing failure → fix

C) State transition
   BEFORE → DURING → AFTER

Choose ONLY ONE structure.

================================
STEP 3 — IMAGE CONTENT (MANDATORY)
================================
The image MUST include:

1️⃣ TITLE (Top)
- Clear, bold statement
Examples:
- “Why Balance Recalculation Fails at Scale”
- “Aggregation Beats Recalculation”

2️⃣ VISUAL PROOF (Center)
- Arrows, order, state changes
- Highlight where naive approach fails
- Highlight why correct approach works

3️⃣ MECHANISM LABELS (3–4 max)
Examples:
- “Repeated Reads”
- “Exploding Queries”
- “Pre-Aggregated State”
- “Write-Time Computation”

4️⃣ CONCLUSION STRIP (Bottom)
One short sentence reinforcing learning:
Examples:
- “Maintain state. Don’t recompute it.”
- “Shift cost to writes for fast reads.”

================================
STYLE (SECONDARY TO MEANING)
================================
- Clean, structured
- Limited colors (2–3)
- No chaos, no mascots
- No decorative art

================================
BRANDING
================================
Small footer:
“LinkedInVibe | TheVectorCamp”

================================
OUTPUT FORMAT
================================
Return ONE precise image-generation prompt.
Do NOT explain.
`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: imagePromptTemplate }] }]
        })
    });

    const data = await response.json();

    return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Teaching diagram explaining one software engineering insight with title, comparison, and conclusion."
    );
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
