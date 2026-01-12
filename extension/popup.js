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
  chrome.storage.local.get(['linkedinUsername', 'geminiApiKey', 'authToken'], (result) => {
    // Check if ALL exist
    if (result.linkedinUsername && result.geminiApiKey && result.authToken) {
      showMainMenu(result.linkedinUsername);
    } else {
      // Pre-fill what we have
      if (result.linkedinUsername) usernameInput.value = result.linkedinUsername;
      if (result.geminiApiKey) apiKeyInput.value = result.geminiApiKey;
      if (result.authToken) authTokenInput.value = result.authToken;
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
          chrome.tabs.create({ url: 'https://nisKULDEEP.github.io/LinkedInVibe/#/dashboard' });
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
    const token = authTokenInput.value.trim();

    if (!rawInput) { showError('Username required'); return; }
    if (!apiKey) { showError('Gemini Key required'); return; }
    if (!token) { showError('Access Token required'); return; }
    
    let cleanUser = rawInput;
    if (rawInput.includes('linkedin.com/in/')) {
        cleanUser = rawInput.split('linkedin.com/in/')[1].replace(/\/$/, '');
    }

    // Verify Token? Optional. For now just save.
    chrome.storage.local.set({ 
      linkedinUsername: cleanUser,
      geminiApiKey: apiKey,
      authToken: token,
      authMode: 'unified' 
    }, () => {
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
