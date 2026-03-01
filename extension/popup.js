document.addEventListener('DOMContentLoaded', () => {
  // ─── Elements ───
  const sections = {
    onboarding: document.getElementById('onboarding'),
    mainMenu: document.getElementById('mainMenu'),
    jobHelper: document.getElementById('jobHelperMenu'),
    botDashboard: document.getElementById('botDashboardMenu'),
    actionArea: document.getElementById('actionArea')
  };

  const $ = id => document.getElementById(id);

  const usernameInput = $('usernameInput');
  const apiKeyInput = $('apiKeyInput');
  const saveUserBtn = $('saveUserBtn');
  const tokenStatusDiv = $('tokenStatus');
  const dashboardInstructions = $('dashboardInstructions');
  const connectError = $('connectError');
  const headerUser = $('headerUser');

  // ─── Navigation ───
  function showSection(name) {
    Object.values(sections).forEach(s => s.classList.remove('active'));
    if (sections[name]) sections[name].classList.add('active');
  }

  function showMainMenu(username) {
    showSection('mainMenu');
    if (headerUser) headerUser.textContent = username || '';
  }

  // ─── Draft Saving ───
  usernameInput?.addEventListener('input', e => chrome.storage.local.set({ draft_username: e.target.value }));
  apiKeyInput?.addEventListener('input', e => chrome.storage.local.set({ draft_geminiApiKey: e.target.value }));

  // ─── Token Status (Disabled - BYOK Only) ───
  function updateTokenStatus() {
    if (saveUserBtn) { saveUserBtn.disabled = false; saveUserBtn.style.opacity = '1'; }
  }
  updateTokenStatus();

  // ─── Connect & Start ───
  saveUserBtn?.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!username) { showError("Enter your LinkedIn username."); usernameInput.focus(); return; }
    if (!apiKey) { showError("Enter your Gemini API Key."); apiKeyInput.focus(); return; }

    saveUserBtn.textContent = "Saving... ⏳";
    saveUserBtn.disabled = true;

    chrome.storage.local.set({
      linkedinUsername: username,
      geminiApiKey: apiKey,
      authMode: 'byok', // Force BYOK
      draft_username: null,
      draft_geminiApiKey: null
    }, () => {
      saveUserBtn.textContent = "Connect & Start 🚀";
      saveUserBtn.disabled = false;
      showMainMenu(username);
    });
  });

  function showError(msg) {
    if (connectError) { connectError.textContent = "❌ " + msg; connectError.style.display = 'block'; }
  }

  // ─── Determine State on Load ───
  chrome.storage.local.get([
    'linkedinUsername', 'geminiApiKey', 'authToken',
    'draft_username', 'draft_geminiApiKey'
  ], res => {
    if (res.linkedinUsername && res.geminiApiKey && res.authToken) {
      showMainMenu(res.linkedinUsername);
    } else {
      if (res.draft_username || res.linkedinUsername) usernameInput.value = res.draft_username || res.linkedinUsername;
      if (res.draft_geminiApiKey || res.geminiApiKey) apiKeyInput.value = res.draft_geminiApiKey || res.geminiApiKey;
      showSection('onboarding');
    }
  });

  // ═══ MAIN MENU BUTTONS ═══

  // Auto Fill Application
  $('btnJobHelper')?.addEventListener('click', () => showSection('jobHelper'));

  // AI Post Generator
  $('btnInstantPost')?.addEventListener('click', () => showSection('actionArea'));

  // Bot Applier
  $('btnBotApplier')?.addEventListener('click', () => {
    showSection('botDashboard');
    chrome.storage.local.get(['botActive', 'dailyApplicationCount', 'minMatchScore', 'enableAiQuestions', 'appStrategy', 'atsData'], res => {
      updateBotUI(res.botActive);
      if ($('statAppliedCount')) $('statAppliedCount').textContent = res.dailyApplicationCount || 0;
      if ($('minMatchScore')) $('minMatchScore').value = res.minMatchScore || 70;
      if ($('enableAiQuestions')) $('enableAiQuestions').checked = res.enableAiQuestions || false;
      updateStrategyUI(res.appStrategy || 'standard');
      if (res.atsData) updateAtsUI(res.atsData.score, res.atsData.feedback);
    });
  });

  // ═══ BACK BUTTONS ═══

  $('backFromJobMenu')?.addEventListener('click', () => {
    chrome.storage.local.get(['linkedinUsername'], r => showMainMenu(r.linkedinUsername || 'User'));
  });

  $('backFromBotMenu')?.addEventListener('click', () => {
    chrome.storage.local.get(['linkedinUsername'], r => showMainMenu(r.linkedinUsername || 'User'));
  });

  $('backToMenu')?.addEventListener('click', () => {
    chrome.storage.local.get(['linkedinUsername'], r => showMainMenu(r.linkedinUsername || 'User'));
  });

  // ═══ JOB HELPER BUTTONS ═══

  // Local Fill
  $('btnFillForm')?.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fill_form" }, response => {
          if (chrome.runtime.lastError) {
            $('status').textContent = "⚠️ Not on a LinkedIn job page";
          } else {
            $('status').textContent = "✅ Form filled!";
          }
        });
      }
    });
  });

  // AI Smart Fill
  $('btnAiFill')?.addEventListener('click', () => {
    const agentStatus = $('agentStatus');
    const agentStep = $('agentStep');
    if (agentStatus) agentStatus.style.display = 'block';
    if (agentStep) agentStep.textContent = 'Analyzing form...';

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        const model = $('aiModelSelect')?.value || 'gemini-2.0-flash-exp';
        chrome.tabs.sendMessage(tabs[0].id, { action: "ai_fill_form", modelName: model }, response => {
          if (chrome.runtime.lastError) {
            if (agentStep) agentStep.textContent = '⚠️ Not on a job page';
          } else if (response?.success) {
            if (agentStep) agentStep.textContent = '✅ AI fill complete!';
          } else {
            if (agentStep) agentStep.textContent = '❌ ' + (response?.error || 'Failed');
          }
          setTimeout(() => { if (agentStatus) agentStatus.style.display = 'none'; }, 3000);
        });
      }
    });
  });

  // Edit Profile → Options page
  $('btnEditProfile')?.addEventListener('click', () => chrome.tabs.create({ url: 'options.html' }));

  // ═══ FOOTER BUTTONS ═══

  $('btnSettings')?.addEventListener('click', () => chrome.tabs.create({ url: 'options.html' }));

  $('changeUser')?.addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: 'options.html' });
  });

  $('resetKey')?.addEventListener('click', e => {
    e.preventDefault();
    if (confirm('Reset all settings? You will need to set up again.')) {
      chrome.storage.local.clear(() => location.reload());
    }
  });

  $('reportBug')?.addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/nisKULDEEP/LinkedInVibe/issues/new' });
  });

  // ═══ POST GENERATOR ═══

  $('autoScrapeBtn')?.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "auto_scrape_and_generate" }, response => {
          if (chrome.runtime.lastError) {
            const statusEl = $('status');
            statusEl.innerHTML = '<a href="#" id="openLinkedInLnk" style="color:#ef4444;text-decoration:none;font-weight:600;display:block;text-align:center;padding:8px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;">⚠️ Open LinkedIn first (Click Here)</a>';
            statusEl.style.display = 'block';

            setTimeout(() => {
              const lnk = document.getElementById('openLinkedInLnk');
              if (lnk) {
                lnk.addEventListener('click', (e) => {
                  e.preventDefault();
                  chrome.tabs.create({ url: 'https://www.linkedin.com/feed/' });
                });
              }
            }, 50);
          }
        });
      }
    });
  });

  $('scheduleDelay')?.addEventListener('change', e => {
    const custom = $('customTimeInput');
    if (custom) custom.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  $('linkOpenScheduler')?.addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://nisKULDEEP.github.io/LinkedInVibe/#/dashboard?tab=scheduler' });
  });

  // ═══ BOT STRATEGY ═══

  function updateStrategyUI(strategy) {
    const thresh = $('thresholdConfig');
    if (strategy === 'threshold') {
      if ($('strategy_threshold')) $('strategy_threshold').checked = true;
      if (thresh) thresh.style.display = 'block';
    } else if (strategy === 'tailor') {
      if ($('strategy_tailor')) $('strategy_tailor').checked = true;
      if (thresh) thresh.style.display = 'none';
    } else {
      if ($('strategy_standard')) $('strategy_standard').checked = true;
      if (thresh) thresh.style.display = 'none';
    }
  }

  $('strategy_standard')?.addEventListener('change', function () {
    if (this.checked) { updateStrategyUI('standard'); chrome.storage.local.set({ appStrategy: 'standard' }); }
  });
  $('strategy_threshold')?.addEventListener('change', function () {
    if (this.checked) { updateStrategyUI('threshold'); chrome.storage.local.set({ appStrategy: 'threshold' }); }
  });
  $('strategy_tailor')?.addEventListener('change', function () {
    if (this.checked) { updateStrategyUI('tailor'); chrome.storage.local.set({ appStrategy: 'tailor' }); }
  });

  $('minMatchScore')?.addEventListener('change', function () {
    chrome.storage.local.set({ minMatchScore: this.value });
  });
  $('enableAiQuestions')?.addEventListener('change', function () {
    chrome.storage.local.set({ enableAiQuestions: this.checked });
  });

  // ═══ ATS ═══

  $('linkUpdateResume')?.addEventListener('click', e => { e.preventDefault(); chrome.tabs.create({ url: 'options.html' }); });

  $('btnRefreshAts')?.addEventListener('click', e => {
    e.preventDefault();
    if ($('atsScoreCircle')) $('atsScoreCircle').textContent = '...';
    if ($('atsFeedback')) $('atsFeedback').style.display = 'none';

    chrome.runtime.sendMessage({ action: "analyze_ats_score" }, response => {
      if (response?.success) {
        updateAtsUI(response.score, response.feedback);
        chrome.storage.local.set({ atsData: { score: response.score, feedback: response.feedback, timestamp: Date.now() } });
      } else {
        if ($('atsScoreCircle')) $('atsScoreCircle').textContent = '?';
        if ($('atsFeedback')) { $('atsFeedback').style.display = 'block'; $('atsFeedback').textContent = "Error: " + (response?.error || "Failed"); }
      }
    });
  });

  function updateAtsUI(score, feedback) {
    const circle = $('atsScoreCircle');
    if (circle) {
      circle.textContent = score;
      const color = score >= 80 ? '#059669' : score >= 60 ? '#eab308' : '#dc2626';
      circle.style.borderColor = color;
      circle.style.color = color;
    }
    if ($('atsFeedback') && feedback) {
      $('atsFeedback').style.display = 'block';
      $('atsFeedback').textContent = feedback;
    }
  }

  // ═══ BOT START / STOP ═══

  $('btnBotSettings')?.addEventListener('click', () => chrome.tabs.create({ url: 'options.html' }));

  function validateProfileForBot() {
    return new Promise(resolve => {
      chrome.storage.local.get(['candidateProfile', 'botSettings'], res => {
        const missing = [];
        const d = res.candidateProfile || {};
        const settings = res.botSettings || {};
        ['firstName', 'lastName', 'email', 'phone'].forEach(k => {
          if (!d[k] || d[k].trim() === '') missing.push(k);
        });
        // Validate that a Google Doc resume is linked
        const hasResume = settings.baseResumeDocId;
        if (!hasResume) missing.push('Resume');
        if (!d.preferredRoles || d.preferredRoles.length === 0) missing.push('Job Titles');
        resolve({ valid: missing.length === 0, missing });
      });
    });
  }

  $('btnStartBot')?.addEventListener('click', async () => {
    const v = await validateProfileForBot();
    if (!v.valid) {
      alert(`⚠️ Complete your profile first!\n\nMissing: ${v.missing.join(', ')}`);
      chrome.tabs.create({ url: 'options.html' });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "start_bot" }, response => {
          if (chrome.runtime.lastError) {
            chrome.storage.local.set({ botActive: true });
            updateBotUI(true);
            if (tabs[0].url?.includes("/jobs/search")) {
              chrome.tabs.reload(tabs[0].id);
            } else {
              chrome.tabs.update(tabs[0].id, { url: "https://www.linkedin.com/jobs/search/" });
            }
          } else {
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

  $('btnStopBot')?.addEventListener('click', () => {
    chrome.storage.local.set({ botActive: false });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stop_bot" }, () => {
          if (chrome.runtime.lastError) console.log("Bot tab not reachable");
        });
      }
    });
    updateBotUI(false);
  });

  function updateBotUI(active) {
    const start = $('btnStartBot');
    const stop = $('btnStopBot');
    const text = $('botStatusText');
    if (active) {
      if (text) { text.textContent = "Running... 🏃‍♂️"; text.style.color = "#059669"; }
      if (start) start.style.display = 'none';
      if (stop) stop.style.display = 'inline-block';
    } else {
      if (text) { text.textContent = "Idle - Ready"; text.style.color = "#4b5563"; }
      if (start) start.style.display = 'inline-block';
      if (stop) stop.style.display = 'none';
      if ($('statAction')) $('statAction').textContent = "Idle";
    }
  }

  // ═══ Stats updates from content script ═══
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "update_bot_stats") {
      if ($('statAppliedCount')) $('statAppliedCount').textContent = request.count;
      if ($('statAction')) $('statAction').textContent = "Applied!";
    }
  });
});
