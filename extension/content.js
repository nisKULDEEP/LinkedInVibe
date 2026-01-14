console.log("LinkedIn Scraper Loaded @ " + window.location.href);

// Check for auto-scrape flag on load
chrome.storage.local.get(['autoScrape', 'scrapedDataForGeneration'], (result) => {
  console.log("Storage Check Result:", result);
  
  // 1. If we have Scraped Data waiting -> We are on the Feed (presumably) -> START EDITOR FIRST FLOW
  if (result.scrapedDataForGeneration) {
      console.log("Found scraped data. Starting Editor-First workflow.");
      showOverlay("Found scraped data! Starting Magic Generation...");
      
      const data = result.scrapedDataForGeneration;
      // chrome.storage.local.remove(['scrapedDataForGeneration']); // DONT REMOVE YET - wait for success
      // Or remove it now but ensure we don't need it again. 
      // Better to remove it inside startEditorFirstFlow or keep it for retry. 
      // For now, let's keep it to prevent data loss if reload happens, but we must ensure we don't loop.
      // Actually, removing it here is safer to prevent loops, but we need to handle failures better.
      chrome.storage.local.remove(['scrapedDataForGeneration']); 
      
      startEditorFirstFlow(data);
      return;
  }

  // 2. Checking if we need to START scraping (Auto-Scrape Flag)
  if (result.autoScrape) {
    const currentUrl = window.location.href;
    
    // A. PROFILE PAGE (Step 1)
    // strict check to ensure we are on /in/username/ and NOT /recent-activity/
    if (currentUrl.includes("/in/") && !currentUrl.includes("/recent-activity/")) {
        console.log("Auto-scrape: Profile Page detected. Extracting Bio...");
        showOverlay("Extracting Profile Info...");
        
        // Wait for elements to load
        setTimeout(() => {
            // Check for toggle preference (defaults to true if missing)
            chrome.storage.local.get(['scrapeRecentPosts'], (prefs) => {
                const shouldScrapePosts = prefs.scrapeRecentPosts !== false; // Default true
                console.log("Scraping Preference: Posts =", shouldScrapePosts);

                const profileData = scrapeProfileData();
                console.log("Final Profile Data:", profileData);
                
                chrome.storage.local.set({ userProfile: profileData }, () => {
                    
                    if (shouldScrapePosts) {
                        updateOverlay("Profile extracted! Going to Activity...");
                        // Construct Activity URL
                        let activityUrl = currentUrl.replace(/\/$/, "") + "/recent-activity/all/";
                        window.location.href = activityUrl;
                    } else {
                        updateOverlay("Profile extracted! Skiping posts...");
                        console.log("Skipping post scraping. Redirecting to Feed...");
                        
                        // Prepare data for generation directly (without posts)
                        const generationData = [
                             // Format it as expected by background.js (usually array of posts, but we have none)
                             // Actually, based on background.js, it expects `scrapedData` which is usually the array of posts.
                             // But we need to pass profile data too. 
                             // Wait, look at logic: 
                             // background.js reads `userProfile` from storage independently.
                             // `scrapedDataForGeneration` is usually the POSTS array.
                        ];

                        chrome.storage.local.set({ scrapedDataForGeneration: generationData, autoScrape: false }, () => {
                             window.location.href = "https://www.linkedin.com/feed/";
                        });
                    }
                });
            });
        }, 1500); // Small delay for rendering
        return;
    }

    // B. ACTIVITY PAGE (Step 2)
    if (currentUrl.includes("/recent-activity/")) {
        console.log("Auto-scrape: Activity Page detected. Starting post scrape...");
        // chrome.storage.local.set({ autoScrape: false }); // Don't reset yet if we want to ensure completion? 
        // Actually we SHOULD reset it here or inside the scrape promise, 
        // BUT if we reset it here, we must ensure scrapePostsSafely finishes.
        // Let's reset it inside the success block of scrapePostsSafely just to be safe, 
        // OR reset it here and rely on the fact the script is running. 
        // Better: Reset it here to prevent infinite loops if reload happens.
        chrome.storage.local.set({ autoScrape: false }); 

        showOverlay("Scraping your posts...");
        
        scrapePostsSafely()
          .then(data => {
             console.log("Scrape complete. Redirecting to Feed...");
             updateOverlay("Scrape complete! Redirecting to Feed...");
             
             chrome.storage.local.set({ scrapedDataForGeneration: data }, () => {
                 window.location.href = "https://www.linkedin.com/feed/";
             });
          })
          .catch(err => {
              console.error("Auto-scrape failed", err);
              updateOverlay("Error: " + err.message, true);
          });
        return;
    }
  }
});

function scrapeProfileData() {
    try {
        const nameEl = document.querySelector('h1.text-heading-xlarge');
        const name = nameEl ? nameEl.innerText.trim() : "";
        
        const headlineEl = document.querySelector('div.text-body-medium');
        const headline = headlineEl ? headlineEl.innerText.trim() : "";
        
        // "About" section is tricky. It's usually in a section with id='about' 
        // but the text is in a sibling/child.
        // Strategy: specific selector for the text body in About card
        // Common selector: .display-flex .inline-show-more-text--is-collapsed (or not collapsed)
        // Or look for a section with header "About"
        
        let about = "";
        const headings = Array.from(document.querySelectorAll('h2 span[aria-hidden="true"]'));
        const aboutHeader = headings.find(h => h.innerText.includes("About"));
        
        if (aboutHeader) {
            // Traverse up to the section container
            const section = aboutHeader.closest('section');
            if (section) {
                // Find the text container
                const textDiv = section.querySelector('.inline-show-more-text, .pv-shared-text-with-see-more');
                if (textDiv) about = textDiv.innerText.trim();
            }
        }

        // Experience Section
        let experience = "";
        const expHeader = headings.find(h => h.innerText.includes("Experience"));
        if (expHeader) {
            console.log("✅ Experience Header Found");
            const expSection = expHeader.closest('section');
            if (expSection) {
                // Get list items (roles)
                // LinkedIn structure varies. Try generic list items first.
                const items = expSection.querySelectorAll('li.artdeco-list__item');
                console.log(`ℹ️ Found ${items.length} experience items potential`);

                if (items.length > 0) {
                     // Take top 3 roles
                    const topItems = Array.from(items).slice(0, 3);
                    experience = topItems.map((item, index) => {
                        // Extract Role and Company text only
                        // We clean up slightly to remove 'Show 1 more role' type noise or dates if messy
                        const text = item.innerText.split('\n')
                            .filter(line => line.trim().length > 3 && !line.includes("Show more"))
                            .join(' - ');
                        
                        console.log(`➡️ Extracted Role ${index+1}:`, text.substring(0, 50) + "...");
                        return text;
                    }).join('\n');
                } else {
                    console.warn("⚠️ Experience section found but no list items detected.");
                }
            }
        } else {
            console.warn("❌ Experience Header NOT Found");
        }

        console.log("📝 Final Experience Data Length:", experience.length);

        return { name, headline, about, experience };
    } catch (e) {
        console.warn("Profile scrape error", e);
        return { name: "", headline: "", about: "", experience: "" };
    }
}

async function startEditorFirstFlow(data) {
    // Phase 1: Open Editor immediately
    showOverlay("Opening Post Editor first...");
    const editorReady = await openPostModal();
    
    if (!editorReady) {
        updateOverlay("Failed to open editor. Aborting.", true);
        return;
    }

    // Phase 2: Start Generation in Background
    updateOverlay("Editor Ready. Generating content with Gemini...");
    
    chrome.runtime.sendMessage({action: "generate_post", data: data}, async (response) => {
        if (response.success) {
            updateOverlay("Post generated! Filling editor...");
            await fillPostEditor(response.text, response.imageBase64);
        } else {
            showErrorWithRetry("Generation Failed: " + response.error, () => {
                // Retry generation only, editor is likely still open or needs checking
                 updateOverlay("Retrying generation...");
                 // Recursive retry might need to re-verify editor, but simple re-send is okay for now
                 startEditorFirstFlow(data); 
            });
        }
    });
}


// --- UI Overlay Helper ---
function showOverlay(initialMessage) {
    removeOverlay(); // Clean up existing if any
    const overlay = document.createElement('div');
    overlay.id = 'li-scraper-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #0a66c2;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 9999;
        font-family: sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 600;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    `;
    
    const msgSpan = document.createElement('span');
    msgSpan.id = 'li-scraper-msg';
    msgSpan.textContent = initialMessage;
    overlay.appendChild(msgSpan);

    document.body.appendChild(overlay);
}

function updateOverlay(message, isError = false) {
    const overlay = document.getElementById('li-scraper-overlay');
    if (overlay) {
        const msgSpan = document.getElementById('li-scraper-msg');
        if (msgSpan) msgSpan.textContent = message;
        
        overlay.style.background = isError ? '#d11124' : '#0a66c2';
        
        // Remove any existing buttons (cleanup)
        const btn = document.getElementById('li-scraper-retry-btn');
        if (btn) btn.remove();
    } else {
        showOverlay(message);
        if (isError) updateOverlay(message, true);
    }
}

function showErrorWithRetry(message, retryCallback) {
    updateOverlay(message, true);
    const overlay = document.getElementById('li-scraper-overlay');
    if (overlay) {
        const btn = document.createElement('button');
        btn.id = 'li-scraper-retry-btn';
        btn.textContent = "Retry Generation";
        btn.style.cssText = `
            background: white;
            color: #d11124;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 5px;
        `;
        btn.onclick = () => {
            btn.textContent = "Retrying...";
            btn.disabled = true;
            retryCallback();
        };
        overlay.appendChild(btn);
    }
}

function removeOverlay() {
    const overlay = document.getElementById('li-scraper-overlay');
    if (overlay) overlay.remove();
}

// Check for pending post content (after redirect to feed) - LEGACY cleanup
chrome.storage.local.get(['pendingPost'], (result) => {
    if (result.pendingPost) chrome.storage.local.remove(['pendingPost']);
});

async function openPostModal() {
    try {
        const isOnFeed = window.location.href.includes('linkedin.com/feed');
        
        // Check for "Start a post" OR "Draft:" button
        const findStartOrDraftBtn = () => {
             const buttons = Array.from(document.querySelectorAll('button.artdeco-button'));
             // Priority: Draft button first (to clear it), then Start Post
             const draftBtn = buttons.find(b => b.innerText.includes('Draft:'));
             if (draftBtn) {
                 console.log("Found existing draft button.");
                 return draftBtn;
             }
             return buttons.find(b => b.innerText.includes('Start a post'));
        };

        let startBtn = findStartOrDraftBtn();
        
        if (!startBtn && isOnFeed) {
             console.log("On feed, waiting for button...");
             await new Promise(r => setTimeout(r, 2000)); 
             startBtn = findStartOrDraftBtn();
        }

        if (!startBtn) {
             updateOverlay("Error: 'Start Post' or 'Draft' button not found on Feed.", true);
             return false;
        }

        startBtn.click();
        updateOverlay("Waiting for editor to initialize...");
        
        // Wait for Modal Editor
        const editor = await waitForElement('.ql-editor');
        if (editor) {
            // Give the editor internal scripts a moment to initialize/settle
            await new Promise(r => setTimeout(r, 1500));
            editor.focus(); // Ensure focus is inside the editor
            return true;
        } else {
             updateOverlay("Editor not found. Check console.", true);
             return false;
        }

    } catch (e) {
        console.error(e);
        updateOverlay("Failed to open editor: " + e.message, true);
        return false;
    }
}

async function fillPostEditor(text, imageBase64) {
    try {
        // 1. Attach Image First (if provided)
        if (imageBase64) {
            updateOverlay("Attaching Image first...", false);
            // This will handle upload + clicking "Next"
            await attachImageToPost(imageBase64);
            
            // Allow UI to settle back to Text Editor
            await new Promise(r => setTimeout(r, 1500));
        }

        // 2. Insert Text
        const editor = await waitForElement('.ql-editor'); 
        if (editor) {
            editor.focus();
            
            // Clear existing content (crucial for drafts)
            editor.innerHTML = '<p><br></p>'; 
            
            // Insert New Text
            editor.innerHTML = `<p>${text}</p>`;
            editor.dispatchEvent(new Event('input', { bubbles: true })); // Trigger validation

            updateOverlay("Ready! Review and Post.", false);
            
            // Check for Auto-Pilot
            chrome.storage.local.get(['autoPilotPost'], (res) => {
                if (res.autoPilotPost) {
                    updateOverlay("🤖 Auto-Pilot: Posting in 5 seconds...", false);
                    setTimeout(() => {
                        const postBtn = document.querySelector('button.share-actions__primary-action');
                        if (postBtn && !postBtn.disabled) {
                            postBtn.click();
                            console.log("Auto-Pilot: Clicked Post!");
                            updateOverlay("✅ Posted!", false);
                        } else {
                            updateOverlay("Auto-Pilot Error: Post button not ready.", true);
                        }
                    }, 5000);
                }
            });

            setTimeout(removeOverlay, 4000);
            
            const overlay = document.getElementById('li-scraper-overlay');
            if(overlay) overlay.style.background = '#057642'; // Success Green

        } else {
             updateOverlay("Editor lost? Re-opening...", true);
        }
    } catch (e) {
        updateOverlay("Fill failed: " + e.message, true);
    }
}

async function attachImageToPost(base64Data) {
    try {
        updateOverlay("Processing image for upload...", false);

        // 1. Convert Base64 to Blob/File object
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], "linkedin_gen_image.png", { type: 'image/png' });

        // 2. Prepare DataTransfer
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // 3. Find Input - LinkedIn often puts it inside the modal or makes it visible after clicking "Add Media"
        // Try finding it directly first (sometimes it's just hidden)
        let fileInput = document.querySelector('input[type="file"]');

        if (!fileInput) {
            console.log("File input not found immediately. Triggering 'Add Media'...");
            updateOverlay("Opening Media Selector...");
            
            // Selector provided by user: button[aria-label="Add media"]
            const addMediaBtn = document.querySelector('button[aria-label="Add media"]');
            
            if (addMediaBtn) {
                addMediaBtn.click();
                // Wait for the input to potentially render
                await new Promise(r => setTimeout(r, 1000));
                fileInput = document.querySelector('input[type="file"]');
            } else {
                console.warn("'Add Media' button not found.");
            }
        }

        if (fileInput) {
             console.log("File input found!", fileInput);
             fileInput.files = dataTransfer.files;
             fileInput.dispatchEvent(new Event('change', { bubbles: true }));
             
             updateOverlay("Image Attached! Waiting for 'Next'...", false);
             
             // Wait for the "Next" button to appear (User instruction)
             await new Promise(r => setTimeout(r, 2000));
             
             const nextBtn = document.querySelector('button[aria-label="Next"]');
             if (nextBtn) {
                 console.log("Clicking Next button...");
                 nextBtn.click();
                 updateOverlay("Clicked Next...", false);
             } else {
                 console.warn("Next button not found. Maybe auto-proceeded?");
             }

        } else {
             throw new Error("Could not find file input element even after checking 'Add Media'.");
        }

    } catch (e) {
        console.error("Auto-attach failed", e);
        updateOverlay("Auto-attach failed. Downloading instead...", true);
        
        // Fallback: Download
        const a = document.createElement('a');
        a.href = `data:image/png;base64,${base64Data}`;
        a.download = "linkedin_post_image.png";
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    scrapePostsSafely()
      .then(data => sendResponse({success: true, data: data}))
      .catch(err => sendResponse({success: false, error: err.message}));
    return true; // Keep channel open
  }
  
  if (request.action === "status_update") {
      console.log("Status Update:", request.message);
      updateOverlay(request.message);
  }
});

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

async function scrapePostsSafely() {
  const MAX_POSTS = 10;
  const SCROLL_DELAY = 2000;
  const POST_SELECTOR = '.feed-shared-update-v2'; 
  // LinkedIn classes are obfuscated/change, but 'feed-shared-update-v2' is a common persistent hook. 
  // We might need fallback or more specific selectors.
  
  let postsData = [];
  let noNewPostsCount = 0;

  // Initial Scroll to trigger lazy loading if needed, and wait for initial load
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1000));

  while (postsData.length < MAX_POSTS) {
    // Activity feed often uses specific containers or just the shared update wrapper
    // We try to filter for the ones that look like posts (have text or media)
    const posts = document.querySelectorAll(POST_SELECTOR);
    
    // Convert to array and reverse to process top-down (query returns structure order)
    const extracted = Array.from(posts).map(post => extractPostData(post));
    
    // Filter duplicates based on unique content/timestamp combo (simple hash)
    // and ensure they are valid
    for (const post of extracted) {
      if (post.text && post.text.length > 5 && postsData.length < MAX_POSTS) {
         // Check for dupe in current set
         const isDupe = postsData.some(p => p.text === post.text && p.author === post.author);
         if (!isDupe) {
           postsData.push(post);
         }
      }
    }

    if (postsData.length >= MAX_POSTS) {
      break;
    }

    // Scroll down
    window.scrollBy(0, window.innerHeight);
    await new Promise(r => setTimeout(r, SCROLL_DELAY));
    
    // Guard against infinite loops if no new posts load
    if (posts.length === document.querySelectorAll(POST_SELECTOR).length) {
        noNewPostsCount++;
        if (noNewPostsCount > 3) break; // Stop after 3 scrolls with no new content
    } else {
        noNewPostsCount = 0;
    }
  }

  return postsData;
}

function extractPostData(postElement) {
  try {
    // Selectors
    // Author Name
    const authorSelector = '.update-components-actor__name';
    const authorEl = postElement.querySelector(authorSelector);
    // If not found, might be a re-share or different card type. Fallback to generic text.
    const author = authorEl ? authorEl.innerText.trim() : "Me/Unknown";

    // Content - This is the most critical part
    // The structure changes often. Common containers:
    const contentSelector = '.update-components-text span.break-words';
    // Sometimes text is split across spans.
    const contentEl = postElement.querySelector(contentSelector);
    
    let text = "";
    if (contentEl) {
        text = contentEl.innerText.trim();
    } else {
        // Fallback for different layouts
        const fallbackEl = postElement.querySelector('.feed-shared-update-v2__description');
        if (fallbackEl) text = fallbackEl.innerText.trim();
    }
    
    // Clean up "…see more"
    text = text.replace(/…see more/g, '').trim();

    // Stats
    const reactionEl = postElement.querySelector('.social-details-social-counts__reactions-count');
    const likes = reactionEl ? reactionEl.innerText.trim() : "0";

    const commentEl = postElement.querySelector('.social-details-social-counts__comments');
    const comments = commentEl ? commentEl.innerText.trim() : "0 comments";
    
    // Date/Time
    // The permalink usually contains the relative time, e.g. "1d • " or similar.
    const timeEl = postElement.querySelector('.update-components-actor__sub-description');
    const timestamp = timeEl ? timeEl.innerText.split('•')[0].trim() : "";

    return {
      author,
      text,
      likes,
      comments,
      timestamp,
      scrapedAt: new Date().toISOString()
    };
  } catch (e) {
    console.warn("Error extracting post", e);
    return {};
  }
}
