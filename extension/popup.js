document.addEventListener('DOMContentLoaded', () => {
  const mainMenuDiv = document.getElementById('mainMenu');
  const onboardingDiv = document.getElementById('onboarding');
  const actionAreaDiv = document.getElementById('actionArea');
  const jobHelperMenuDiv = document.getElementById('jobHelperMenu');
  const menuFooter = document.getElementById('menuFooter');
  const statusDiv = document.getElementById('status');

  // Buttons
  const usernameInput = document.getElementById('usernameInput');
  const saveUserBtn = document.getElementById('saveUserBtn');
  const autoScrapeBtn = document.getElementById('autoScrapeBtn');
  const btnInstantPost = document.getElementById('btnInstantPost');
  const btnSmartScheduler = document.getElementById('btnSmartScheduler');
  const btnJobHelper = document.getElementById('btnJobHelper');
  const backToMenuBtn = document.getElementById('backToMenu');
  const backFromJobMenuBtn = document.getElementById('backFromJobMenu');

  const btnFillForm = document.getElementById('btnFillForm');
  const btnEditProfile = document.getElementById('btnEditProfile');

  // Inputs
  const apiKeyInput = document.getElementById('apiKeyInput');
  // The following elements are no longer needed for mode selection
  //  // Load configured user and keys
  // --- Draft Saving Logic ---
  const saveDraft = (key, value) => {
    chrome.storage.local.set({ [key]: value });
  };

  usernameInput.addEventListener('input', (e) => saveDraft('draft_username', e.target.value));
  apiKeyInput.addEventListener('input', (e) => saveDraft('draft_geminiApiKey', e.target.value));

  // Token Status UI Elements
  const tokenStatusDiv = document.getElementById('tokenStatus');
  const dashboardInstructions = document.getElementById('dashboardInstructions');
  const connectError = document.getElementById('connectError');

  // Check and update token status
  function updateTokenStatus() {
    chrome.storage.local.get(['authToken', 'refreshToken'], (result) => {
      const hasTokens = result.authToken && result.refreshToken;

      if (hasTokens) {
        // Tokens received!
        tokenStatusDiv.style.display = 'block';
        tokenStatusDiv.style.background = '#dcfce7';
        tokenStatusDiv.style.border = '1px solid #86efac';
        tokenStatusDiv.innerHTML = '<span style="color: #16a34a; font-weight: 600;">✅ Dashboard Connected!</span>';
        dashboardInstructions.style.display = 'none';
        saveUserBtn.disabled = false;
        saveUserBtn.style.opacity = '1';
        saveUserBtn.style.cursor = 'pointer';
        connectError.style.display = 'none';
      } else {
        // No tokens yet
        tokenStatusDiv.style.display = 'block';
        tokenStatusDiv.style.background = '#fef9c3';
        tokenStatusDiv.style.border = '1px solid #fde047';
        tokenStatusDiv.innerHTML = '<span style="color: #ca8a04;">⏳ Waiting for Dashboard connection...</span>';
        dashboardInstructions.style.display = 'block';
        saveUserBtn.disabled = true;
        saveUserBtn.style.opacity = '0.5';
        saveUserBtn.style.cursor = 'not-allowed';
      }
    });
  }

  // Initial check and periodic refresh (in case user sends tokens while popup is open)
  updateTokenStatus();
  setInterval(updateTokenStatus, 2000);

  // Determine State on Load
  chrome.storage.local.get([
    'linkedinUsername', 'geminiApiKey', 'authToken',
    'draft_username', 'draft_geminiApiKey'
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
      showOnboarding();
    }
  });

  // --- Navigation & UI ---

  function showMainMenu(username) {
    mainMenuDiv.style.display = 'block';
    menuFooter.style.display = 'block';
    onboardingDiv.style.display = 'none';
    actionAreaDiv.style.display = 'none';
    jobHelperMenuDiv.style.display = 'none';

    const userDisplay = document.getElementById('menuUserDisplay');
    if (userDisplay) userDisplay.textContent = username;

    statusDiv.textContent = "";
  }

  function showOnboarding() {
    mainMenuDiv.style.display = 'none';
    menuFooter.style.display = 'none';
    onboardingDiv.style.display = 'block';
    actionAreaDiv.style.display = 'none';
    jobHelperMenuDiv.style.display = 'none';
    statusDiv.textContent = "Setup required";
  }

  function showActionArea() {
    // "Instant Post" Sub-page
    mainMenuDiv.style.display = 'none';
    menuFooter.style.display = 'none';
    onboardingDiv.style.display = 'none';
    actionAreaDiv.style.display = 'block';
    jobHelperMenuDiv.style.display = 'none';
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

  // --- Job Helper Listeners ---
  const btnAiFill = document.getElementById('btnAiFill');
  const aiModelSelect = document.getElementById('aiModelSelect');

  // Agent Status UI
  const agentStatusDiv = document.getElementById('agentStatus');
  const agentStep = document.getElementById('agentStep');
  const agentDetail = document.getElementById('agentDetail');

  function updateAgentStatus(step, detail) {
    agentStatusDiv.style.display = 'block';
    agentStep.textContent = step;
    agentDetail.textContent = detail;
  }

  // Model Selection Persistence
  if (aiModelSelect) {
    chrome.storage.local.get(['selectedAiModel'], (res) => {
      if (res.selectedAiModel) {
        aiModelSelect.value = res.selectedAiModel;
      }
    });

    aiModelSelect.addEventListener('change', () => {
      chrome.storage.local.set({ selectedAiModel: aiModelSelect.value });
    });
  }

  if (btnJobHelper) {
    btnJobHelper.addEventListener('click', () => {
      mainMenuDiv.style.display = 'none';
      menuFooter.style.display = 'none';
      jobHelperMenuDiv.style.display = 'block';
      // statusDiv.textContent = 'Ready to assist...';
    });
  }

  if (backFromJobMenuBtn) {
    backFromJobMenuBtn.addEventListener('click', () => {
      chrome.storage.local.get(['linkedinUsername'], (res) => {
        showMainMenu(res.linkedinUsername || 'User');
      });
    });
  }

  if (btnEditProfile) {
    console.log("✅ Edit Profile Button Found");
    btnEditProfile.addEventListener('click', () => {
      console.log("🖱️ Edit Profile Clicked");
      try {
        if (chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage((e) => {
            if (chrome.runtime.lastError) {
              console.error("openOptionsPage failed:", chrome.runtime.lastError);
              chrome.tabs.create({ url: 'options.html' });
            }
          });
        } else {
          chrome.tabs.create({ url: 'options.html' });
        }
      } catch (e) {
        console.error("Error opening options:", e);
        chrome.tabs.create({ url: 'options.html' });
      }
    });
  } else {
    console.error("❌ Edit Profile Button NOT FOUND in DOM");
  }

  // --- 1. LOCAL FILL ---
  if (btnFillForm) {
    btnFillForm.addEventListener('click', () => {
      statusDiv.textContent = 'Injecting Local Magic...';

      chrome.storage.local.get(['resumeFile'], (result) => {
        const resumeFile = result.resumeFile || null;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['autofill.js']
            }, () => {
              // Trigger Local Mode with Resume Data
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "fill_form_local",
                resume: resumeFile
              });
              window.close();
            });
          }
        });
      });
    });
  }

  // --- 2. AI SMART FILL ---
  if (btnAiFill) {
    btnAiFill.addEventListener('click', () => {
      updateAgentStatus("Thinking...", "Initializing Gemini Agent");

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          // Inject script first
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['autofill.js']
          }, () => {
            updateAgentStatus("Reading Form...", "Scanning page structure");

            // A. Ask Content Script to Scan Form
            chrome.tabs.sendMessage(tabs[0].id, { action: "scan_form_for_ai" }, (response) => {
              if (!response || !response.formContext) {
                updateAgentStatus("Error", "Could not read form data.");
                return;
              }

              updateAgentStatus("Consulting AI...", "Mapping your profile to this form");

              // Get selected model
              const selectedModel = aiModelSelect ? aiModelSelect.value : 'gemini-1.5-flash';

              // B. Send to Background to Call Gemini
              chrome.runtime.sendMessage({
                action: "analyze_form_with_gemini",
                formContext: response.formContext,
                modelName: selectedModel
              }, (aiResponse) => {
                if (aiResponse && aiResponse.success && aiResponse.mapping) {
                  updateAgentStatus("Filling Fields...", "Applying AI intelligence");

                  // C. Apply AI Results
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: "apply_ai_mapping",
                    mapping: aiResponse.mapping
                  });

                  setTimeout(() => window.close(), 2000);
                } else {
                  updateAgentStatus("AI Error", aiResponse?.error || "Gemini unavailable.");
                }
              });
            });
          });
        }
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

  // Simplified Auth Flow: Username + API Key only. Tokens come from Dashboard via bridge.
  saveUserBtn.addEventListener('click', () => {
    const rawInput = usernameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!rawInput) { showError('Username required'); return; }
    if (!apiKey) { showError('Gemini Key required'); return; }

    let cleanUser = rawInput;
    if (rawInput.includes('linkedin.com/in/')) {
      cleanUser = rawInput.split('linkedin.com/in/')[1].replace(/\/$/, '');
    }

    // Check if tokens were sent from Dashboard
    chrome.storage.local.get(['authToken', 'refreshToken'], (result) => {
      if (!result.authToken || !result.refreshToken) {
        showError('Open Dashboard & click "Send to Extension" first!');
        return;
      }

      // Save username and API key (tokens already saved by bridge)
      chrome.storage.local.set({
        linkedinUsername: cleanUser,
        geminiApiKey: apiKey,
        authMode: 'unified'
      }, () => {
        // Clear drafts on success
        chrome.storage.local.remove(['draft_username', 'draft_geminiApiKey', 'draft_authToken']);
        showMainMenu(cleanUser);
      });
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
    chrome.storage.local.remove(['geminiApiKey', 'authToken', 'refreshToken'], () => {
      apiKeyInput.value = '';
      showOnboarding();
      statusDiv.textContent = 'Credentials reset. Connect Dashboard again.';
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
    if (scheduleSelect.value === 'custom') {
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
          if (response && response.success) {
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


  // --- BOT APPLIER UI HANDLERS ---
  const btnBotApplier = document.getElementById('btnBotApplier');
  const botDashboardMenu = document.getElementById('botDashboardMenu');
  const backFromBotMenu = document.getElementById('backFromBotMenu');
  const btnStartBot = document.getElementById('btnStartBot');
  const btnStopBot = document.getElementById('btnStopBot');
  const btnBotSettings = document.getElementById('btnBotSettings');
  const botStatusText = document.getElementById('botStatusText');
  const statAppliedCount = document.getElementById('statAppliedCount');
  const statAction = document.getElementById('statAction');

  if (btnBotApplier) {
    btnBotApplier.addEventListener('click', () => {
      mainMenuDiv.style.display = 'none';
      botDashboardMenu.style.display = 'block';
      // Check status on open
      chrome.storage.local.get(['botActive', 'dailyApplicationCount'], (res) => {
        updateBotUI(res.botActive);
        if (statAppliedCount) statAppliedCount.textContent = res.dailyApplicationCount || 0;
      });
    });
  }

  if (backFromBotMenu) {
    backFromBotMenu.addEventListener('click', () => {
      mainMenuDiv.style.display = 'block';
      botDashboardMenu.style.display = 'none';
    });
  }

  if (btnBotSettings) {
    btnBotSettings.addEventListener('click', () => {
      chrome.tabs.create({ url: 'options.html' });
    });
  }

  // --- Profile Validation Before Bot Start ---
  function validateProfileForBot() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['candidateProfile', 'resumeFile'], (result) => {
        const missingFields = [];
        const data = result.candidateProfile || {};

        // Check basic required fields
        const requiredFields = [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' }
        ];

        requiredFields.forEach(field => {
          if (!data[field.key] || data[field.key].trim() === '') {
            missingFields.push(field.label);
          }
        });

        // Check resume (either link or file)
        if ((!data.resumeLink || data.resumeLink.trim() === '') && !result.resumeFile) {
          missingFields.push('Resume');
        }

        // Check job titles (stored as preferredRoles)
        if (!data.preferredRoles || data.preferredRoles.length === 0) {
          missingFields.push('Preferred Job Titles');
        }

        if (missingFields.length > 0) {
          resolve({ valid: false, missing: missingFields });
        } else {
          resolve({ valid: true, missing: [] });
        }
      });
    });
  }

  if (btnStartBot) {
    btnStartBot.addEventListener('click', async () => {
      // First, validate profile
      const validation = await validateProfileForBot();

      if (!validation.valid) {
        // Show alert and redirect to options
        const missingList = validation.missing.join(', ');
        alert(`⚠️ Please complete your profile first!\n\nMissing: ${missingList}\n\nYou'll be redirected to the settings page.`);
        chrome.tabs.create({ url: 'options.html' });
        return;
      }

      // Profile is valid, proceed with bot start
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "start_bot" }, (response) => {
            if (chrome.runtime.lastError) {
              console.log("ℹ️ Bot script not ready. Reloading page...");

              chrome.storage.local.set({ botActive: true });
              updateBotUI(true);

              if (tabs[0].url.includes("/jobs/search")) {
                chrome.tabs.reload(tabs[0].id);
              } else {
                chrome.tabs.update(tabs[0].id, { url: "https://www.linkedin.com/jobs/search/" });
              }
            } else {
              console.log("🚀 Bot started successfully!");
              updateBotUI(true);
            }
          });
        } else {
          chrome.tabs.create({ url: "https://www.linkedin.com/jobs/search/" }, () => {
            chrome.storage.local.set({ botActive: true });
            updateBotUI(true);
          });
        }
      });
    });
  }

  if (btnStopBot) {
    btnStopBot.addEventListener('click', () => {
      chrome.storage.local.set({ botActive: false });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "stop_bot" }, (response) => {
            // Suppress "Receiving end does not exist" error
            // If the content script isn't there, we don't care because we already set botActive = false in storage
            if (chrome.runtime.lastError) {
              console.log("Note: Bot script not reachable (tab closed or not loaded).");
            }
          });
        }
      });
      updateBotUI(false);
    });
  }

  function updateBotUI(isActive) {
    if (isActive) {
      botStatusText.textContent = "Running... 🏃‍♂️";
      botStatusText.style.color = "#059669";
      btnStartBot.style.display = 'none';
      btnStopBot.style.display = 'inline-block';
    } else {
      botStatusText.textContent = "Idle - Ready";
      botStatusText.style.color = "#4b5563";
      btnStartBot.style.display = 'inline-block';
      btnStopBot.style.display = 'none';
      statAction.textContent = "Waiting...";
    }
  }

  // Listen for stats updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "update_bot_stats") {
      if (statAppliedCount) statAppliedCount.textContent = request.count;
      if (statAction) statAction.textContent = "Applied to job!";
    }
  });

});
