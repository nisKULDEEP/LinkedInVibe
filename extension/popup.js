document.addEventListener('DOMContentLoaded', () => {
const mainMenuDiv = document.getElementById('mainMenu');
  const onboardingDiv = document.getElementById('onboarding');
  const actionAreaDiv = document.getElementById('actionArea');
  const menuFooter = document.getElementById('menuFooter');
  const statusDiv = document.getElementById('status');
  
  // Buttons
  const usernameInput = document.getElementById('usernameInput');
  const saveUserBtn = document.getElementById('saveUserBtn');
  const autoScrapeBtn = document.getElementById('autoScrapeBtn');
  const btnInstantPost = document.getElementById('btnInstantPost');
  const btnSmartScheduler = document.getElementById('btnSmartScheduler');
  const backToMenuBtn = document.getElementById('backToMenu');
  
  // Inputs
  const apiKeyInput = document.getElementById('apiKeyInput');
  const authTokenInput = document.getElementById('authTokenInput');
  // The following elements are no longer needed for mode selection
  //  // Load configured user and keys
  // --- Draft Saving Logic ---
  const saveDraft = (key, value) => {
    chrome.storage.local.set({ [key]: value });
  };

  usernameInput.addEventListener('input', (e) => saveDraft('draft_username', e.target.value));
  apiKeyInput.addEventListener('input', (e) => saveDraft('draft_geminiApiKey', e.target.value));
  authTokenInput.addEventListener('input', (e) => saveDraft('draft_authToken', e.target.value));

  // Determine State on Load
  chrome.storage.local.get([
    'linkedinUsername', 'geminiApiKey', 'authToken', 
    'draft_username', 'draft_geminiApiKey', 'draft_authToken'
  ], (result) => {
    // Check if ALL confirmed credentials exist -> Main Menu
    if (result.linkedinUsername && result.geminiApiKey && result.authToken) {
      showMainMenu(result.linkedinUsername);
    } else {
      // Restore Drafts or Partial Confirmed
      if (result.draft_username || result.linkedinUsername) {
        usernameInput.value = result.draft_username || result.linkedinUsername;
      }
      if (result.draft_geminiApiKey || result.geminiApiKey) {
        apiKeyInput.value = result.draft_geminiApiKey || result.geminiApiKey;
      }
      if (result.draft_authToken || result.authToken) {
        authTokenInput.value = result.draft_authToken || result.authToken;
      }
      showOnboarding();
    }
  });

  // --- Navigation & UI ---

  function showMainMenu(username) {
      mainMenuDiv.style.display = 'block';
      menuFooter.style.display = 'block';
      onboardingDiv.style.display = 'none';
      actionAreaDiv.style.display = 'none';
      
      const userDisplay = document.getElementById('menuUserDisplay');
      if (userDisplay) userDisplay.textContent = username;
      
      statusDiv.textContent = "";
  }
  
  function showOnboarding() {
      mainMenuDiv.style.display = 'none';
      menuFooter.style.display = 'none';
      onboardingDiv.style.display = 'block';
      actionAreaDiv.style.display = 'none';
      statusDiv.textContent = "Setup required";
  }

  function showActionArea() {
      // "Instant Post" Sub-page
      mainMenuDiv.style.display = 'none';
      menuFooter.style.display = 'none';
      onboardingDiv.style.display = 'none';
      actionAreaDiv.style.display = 'block';
      statusDiv.textContent = "Ready to create magic...";
  }

  // --- Event Listeners ---

  // 1. Menu Interactions
  if (btnInstantPost) {
      btnInstantPost.addEventListener('click', () => {
          showActionArea();
      });
  }

  if (btnSmartScheduler) {
      btnSmartScheduler.addEventListener('click', () => {
          // Open Dashboard in new tab
          chrome.tabs.create({ url: 'https://nisKULDEEP.github.io/LinkedInVibe/#/dashboard?tab=scheduler' });
      });
  }
  
  if (backToMenuBtn) {
      backToMenuBtn.addEventListener('click', () => {
          // We need username for the menu, fetch it again or store it globally
          chrome.storage.local.get(['linkedinUsername'], (res) => {
             showMainMenu(res.linkedinUsername || 'User');
          });
      });
  }

  // 2. Setup Logic
  // modeByokBtn.addEventListener('click', () => setMode('byok')); // No longer needed
  // modeProBtn.addEventListener('click', () => setMode('pro')); // No longer needed

  // function setMode(mode) { // No longer needed
  //     currentMode = mode;
  //     if (mode === 'byok') {
  //         modeByokBtn.style.background = '#fff';
  //         modeByokBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  //         modeProBtn.style.background = 'transparent';
  //         modeProBtn.style.boxShadow = 'none';
  //         byokFields.style.display = 'block';
  //         proFields.style.display = 'none';
  //     } else {
  //         modeProBtn.style.background = '#fff';
  //         modeProBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  //         modeByokBtn.style.background = 'transparent';
  //         modeByokBtn.style.boxShadow = 'none';
  //         proFields.style.display = 'block';
  //         byokFields.style.display = 'none';
  //     }
  // }

  // Unified Auth Flow: All 3 fields required
  saveUserBtn.addEventListener('click', () => {
    const rawInput = usernameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const tokenInput = authTokenInput.value.trim();

    if (!rawInput) { showError('Username required'); return; }
    if (!apiKey) { showError('Gemini Key required'); return; }
    if (!tokenInput) { showError('Tokens JSON required'); return; }
    
    // Parse JSON tokens
    let accessToken, refreshToken;
    try {
        const parsed = JSON.parse(tokenInput);
        accessToken = parsed.access_token;
        refreshToken = parsed.refresh_token;
        if (!accessToken || !refreshToken) {
            throw new Error('Missing tokens');
        }
    } catch (e) {
        showError('Invalid JSON. Copy from Dashboard again.');
        return;
    }
    
    let cleanUser = rawInput;
    if (rawInput.includes('linkedin.com/in/')) {
        cleanUser = rawInput.split('linkedin.com/in/')[1].replace(/\/$/, '');
    }

    // Save both tokens
    chrome.storage.local.set({ 
      linkedinUsername: cleanUser,
      geminiApiKey: apiKey,
      authToken: accessToken,
      refreshToken: refreshToken,
      authMode: 'unified' 
    }, () => {
      // Clear drafts on success
      chrome.storage.local.remove(['draft_username', 'draft_geminiApiKey', 'draft_authToken']);
      showMainMenu(cleanUser);
    });
  });

  // 3. Footer Actions
  const changeUserLink = document.getElementById('changeUser');
  const resetKeyLink = document.getElementById('resetKey');

  changeUserLink.addEventListener('click', (e) => {
    e.preventDefault();
    showOnboarding();
  });

  resetKeyLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.storage.local.remove(['geminiApiKey', 'authToken'], () => {
        apiKeyInput.value = ''; 
        authTokenInput.value = '';
        showOnboarding();
        statusDiv.textContent = 'Credentials reset.';
    });
  });
  
  function showError(msg) {
      statusDiv.textContent = msg;
      statusDiv.style.color = 'red';
  }

  // --- Generation Logic (Only triggered from Action Area) ---
  const scheduleSelect = document.getElementById('scheduleDelay');
  const customTimeInput = document.getElementById('customTimeInput');
  
  scheduleSelect.addEventListener('change', () => {
     if(scheduleSelect.value === 'custom') {
         customTimeInput.style.display = 'block';
         customTimeInput.focus();
     } else {
         customTimeInput.style.display = 'none';
     }
  });

  autoScrapeBtn.addEventListener('click', () => {
        // ... (Keep existing generation Logic) ...
        chrome.storage.local.get(['linkedinUsername'], (result) => {
            const savedUser = result.linkedinUsername;
            if (!savedUser) return;
            
            const customTopic = document.getElementById('customTopic').value.trim();
            const selectValue = scheduleSelect.value;
            let delayMinutes = 0;
            
            if (selectValue === 'custom') {
                const timeStr = customTimeInput.value;
                if (!timeStr) {
                    showError("Please set a time."); return;
                }
                const [hours, mins] = timeStr.split(':').map(Number);
                const now = new Date();
                const target = new Date();
                target.setHours(hours, mins, 0, 0);
                if (target <= now) target.setDate(target.getDate() + 1);
                
                delayMinutes = Math.round((target - now) / 60000);
            } else {
                delayMinutes = parseInt(selectValue, 10);
            }
            
            chrome.storage.local.set({ customTopic: customTopic });

            if (delayMinutes > 0) {
                statusDiv.textContent = `Scheduled in ${delayMinutes} min...`;
                chrome.runtime.sendMessage({ 
                    action: "schedule_post", 
                    minutes: delayMinutes,
                    username: savedUser
                }, (response) => {
                    if(response && response.success) {
                        statusDiv.textContent = `✅ Scheduled! Closing...`;
                        setTimeout(() => window.close(), 1500);
                    } else {
                        statusDiv.textContent = 'Scheduling failed.';
                    }
                });
                return;
            }

            // Immediate Post
            const targetUrl = `https://www.linkedin.com/in/${savedUser}/`;
            chrome.storage.local.set({ autoScrape: true }, () => {
                statusDiv.textContent = 'Starting Magic Flow...';
                chrome.tabs.query({ url: "*://www.linkedin.com/*" }, (tabs) => {
                    const exactTab = tabs.find(t => t.url.includes(targetUrl));
                    const anyLiTab = tabs.find(t => t.url.includes("linkedin.com"));
                    const tabToReuse = exactTab || anyLiTab;

                    if (tabToReuse) {
                        chrome.tabs.update(tabToReuse.id, { url: targetUrl, active: true }, () => {
                             chrome.tabs.reload(tabToReuse.id); 
                             window.close();
                        });
                    } else {
                        chrome.tabs.create({ url: targetUrl }, () => {
                             window.close();
                        });
                    }
                });
            });
        });
  });
});
