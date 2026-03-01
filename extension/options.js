// ═══════════════════════════════════════════
// LinkedInVibe Settings — options.js
// Centralized settings management
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initModeSelector();
    initStrategySelector();
    restoreOptions();
    wireEvents();
    loadJobHistory();
});

// ─── Tab Navigation ───
function initTabNavigation() {
    const links = document.querySelectorAll('.sidebar a[data-tab]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');

            // Update active nav
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show panel
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('tab-' + tabId);
            if (panel) panel.classList.add('active');

            // Load history when switching to that tab
            if (tabId === 'history') loadJobHistory();
        });
    });
}

// ─── Apply Mode Card Selector ───
function initModeSelector() {
    const cards = document.querySelectorAll('.mode-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}

// ─── Strategy Card Selector ───
function initStrategySelector() {
    const cards = document.querySelectorAll('.strategy-card');
    const thresholdGroup = document.getElementById('thresholdGroup');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Show/hide threshold input
            const val = card.querySelector('input[name="strategy"]').value;
            if (thresholdGroup) {
                thresholdGroup.style.display = val === 'threshold' ? 'block' : 'none';
            }
        });
    });
}

// ─── Restore All Settings ───
function restoreOptions() {
    chrome.storage.local.get([
        'candidateProfile', 'botSettings',
        'geminiApiKey', 'learnedQuestions', 'aiModel'
    ], (result) => {
        const profile = result.candidateProfile || {};
        const settings = result.botSettings || {};

        // --- Profile Tab ---
        setInput('firstName', profile.firstName);
        setInput('lastName', profile.lastName);
        setInput('email', profile.email);
        setInput('phone', profile.phone);
        setInput('city', profile.city);
        setInput('linkedinLink', profile.linkedinLink);
        setInput('portfolioLink', profile.portfolioLink);
        setInput('githubLink', profile.githubLink || '');
        setInput('preferredRoles', (profile.preferredRoles || []).join(', '));
        setInput('experience', profile.experience || '');
        setInput('currentCtc', profile.currentCtc || '');
        setInput('desiredSalary', profile.desiredSalary || '');
        setInput('noticePeriodDays', profile.noticePeriodDays || '');
        setInput('requireVisa', profile.requireVisa || 'No');
        setInput('willingToRelocate', profile.willingToRelocate || 'Yes');

        // Removed old resumeBase64 loading

        // --- Bot Settings Tab ---
        const applyMode = settings.applyMode || 'easy_apply';
        const modeRadio = document.querySelector(`input[name="applyMode"][value="${applyMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
            modeRadio.closest('.mode-card')?.classList.add('selected');
        }

        const strategy = settings.strategy || 'standard';
        const stratRadio = document.querySelector(`input[name="strategy"][value="${strategy}"]`);
        if (stratRadio) {
            stratRadio.checked = true;
            document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('selected'));
            stratRadio.closest('.strategy-card')?.classList.add('selected');
        }
        if (strategy === 'threshold') {
            document.getElementById('thresholdGroup').style.display = 'block';
        }
        setInput('minMatchScore', settings.minMatchScore || 60);

        setInput('targetCountries', settings.targetCountries || '');
        setInput('targetCities', settings.targetCities || '');
        setCheckbox('workplaceRemote', settings.workplaceRemote);
        setCheckbox('workplaceOnsite', settings.workplaceOnsite);
        setCheckbox('workplaceHybrid', settings.workplaceHybrid);

        setInput('maxJobs', settings.maxJobs || 10);
        setInput('companyBlacklist', (settings.companyBlacklist || []).join(', '));
        setInput('titleBlacklist', (settings.titleBlacklist || []).join(', '));

        setCheckbox('autoApply', settings.autoApply);
        setCheckbox('showRelevanceWidget', settings.showRelevanceWidget !== false);
        setCheckbox('enableNotifications', settings.enableNotifications !== false);

        // --- Auto-Fill Tab ---
        setCheckbox('showAutofillWidget', settings.showAutofillWidget !== false);
        setCheckbox('autoFillOnExternalOpen', settings.autoFillOnExternalOpen !== false);

        // Learned count
        const learned = result.learnedQuestions || {};
        document.getElementById('learnedCount').textContent = `${Object.keys(learned).length} learned answers`;

        // --- Job History Tab ---
        setInput('baseResumeDocUrl', settings.baseResumeDocUrl);

        // --- Advanced Tab ---
        setInput('geminiApiKey', result.geminiApiKey || '');
        setInput('aiModel', result.aiModel || 'gemini-2.5-flash-lite');
        setCheckbox('enableTextEnhancer', settings.enableTextEnhancer !== false); // Default true
        setCheckbox('verboseLogging', settings.verboseLogging);
    });
}

function setInput(id, value) {
    if (value === undefined || value === null) return;
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setCheckbox(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
}

// ─── Wire Events ───
function wireEvents() {
    // Form submit
    document.getElementById('configForm').addEventListener('submit', saveOptions);
    document.getElementById('btnSaveTop')?.addEventListener('click', () => {
        document.getElementById('configForm').requestSubmit();
    });

    // Removed legacy file upload event listeners

    // Clear learned answers
    document.getElementById('btnClearLearned')?.addEventListener('click', () => {
        if (confirm('Clear all learned answers? The bot will forget all corrections.')) {
            chrome.storage.local.set({ learnedQuestions: {} }, () => {
                document.getElementById('learnedCount').textContent = '0 learned answers';
            });
        }
    });

    // Job History controls
    document.getElementById('historyDateFilter')?.addEventListener('change', loadJobHistory);
    document.getElementById('btnExportCsv')?.addEventListener('click', exportJobsCsv);
    document.getElementById('btnClearHistory')?.addEventListener('click', () => {
        if (confirm('⚠️ Clear all job history? This cannot be undone.')) {
            chrome.storage.local.set({ appliedJobs: {} }, () => loadJobHistory());
        }
    });

    // Export / Import settings
    document.getElementById('btnExportSettings')?.addEventListener('click', exportSettings);
    document.getElementById('btnImportSettings')?.addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile')?.addEventListener('change', importSettings);

    // Reset all
    document.getElementById('btnResetAll')?.addEventListener('click', () => {
        if (confirm('⚠️ This will reset ALL settings. This cannot be undone. Continue?')) {
            chrome.storage.local.clear(() => {
                alert('All settings cleared. Page will reload.');
                location.reload();
            });
        }
    });
}



// ─── URL Extractors ───
function extractDocId(url) {
    if (!url) return null;
    if (!url.includes('/')) return url;
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// ─── Job History ───
function loadJobHistory() {
    chrome.storage.local.get(['appliedJobs'], (res) => {
        const all = res.appliedJobs || {};
        const dates = Object.keys(all).sort().reverse();
        const filterEl = document.getElementById('historyDateFilter');
        const bodyEl = document.getElementById('historyBody');
        const countEl = document.getElementById('historyCount');
        if (!bodyEl) return;

        // Populate date filter
        if (filterEl) {
            const current = filterEl.value;
            filterEl.innerHTML = '<option value="all">All Dates</option>';
            dates.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d; opt.textContent = d;
                filterEl.appendChild(opt);
            });
            filterEl.value = current || 'all';
        }

        // Filter
        const selectedDate = filterEl?.value || 'all';
        const datesToShow = selectedDate === 'all' ? dates : [selectedDate];

        let rows = '';
        let totalCount = 0;
        datesToShow.forEach(date => {
            const jobs = all[date] || [];
            jobs.forEach(job => {
                totalCount++;
                const title = job.title || job.jobTitle || 'N/A';
                const company = job.company || 'N/A';
                const status = job.status || 'Applied';
                const ts = job.timestamp ? new Date(job.timestamp).toLocaleString() : date;
                const url = job.url || '#';
                rows += `<tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 6px 8px; color: #e2e8f0;"><a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: none;">${title}</a></td>
                    <td style="padding: 6px 8px; color: #94a3b8;">${company}</td>
                    <td style="padding: 6px 8px; color: ${status === 'Applied' ? '#4ade80' : '#94a3b8'};">${status}</td>
                    <td style="padding: 6px 8px; color: #64748b;">${ts}</td>
                </tr>`;
            });
        });

        bodyEl.innerHTML = rows || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">No applications yet</td></tr>';
        if (countEl) countEl.textContent = `${totalCount} application${totalCount !== 1 ? 's' : ''} total`;
    });
}

function exportJobsCsv() {
    chrome.storage.local.get(['appliedJobs'], (res) => {
        const all = res.appliedJobs || {};
        let csv = 'Date,Title,Company,URL,Status,Score,Timestamp\n';
        Object.keys(all).sort().forEach(date => {
            (all[date] || []).forEach(job => {
                const row = [
                    date,
                    `"${(job.title || job.jobTitle || '').replace(/"/g, '""')}"`,
                    `"${(job.company || '').replace(/"/g, '""')}"`,
                    job.url || '',
                    job.status || 'Applied',
                    job.score || '',
                    job.timestamp || ''
                ];
                csv += row.join(',') + '\n';
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkedinvibe-jobs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// ─── Save All Settings ───
function saveOptions(e) {
    e.preventDefault();
    const status = document.getElementById('saveStatus');
    status.textContent = "Saving...";
    status.style.color = "#94a3b8";

    const getVal = (name) => {
        const el = document.getElementById(name);
        return el ? el.value.trim() : '';
    };
    const getCheck = (name) => {
        const el = document.getElementById(name);
        return el ? el.checked : false;
    };
    const getRadio = (name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : null;
    };

    // Build profile
    const profile = {
        firstName: getVal('firstName'),
        lastName: getVal('lastName'),
        email: getVal('email'),
        phone: getVal('phone'),
        city: getVal('city'),
        linkedinLink: getVal('linkedinLink'),
        portfolioLink: getVal('portfolioLink'),
        githubLink: getVal('githubLink'),
        preferredRoles: getVal('preferredRoles').split(',').map(s => s.trim()).filter(Boolean),
        experience: getVal('experience'),
        currentCtc: getVal('currentCtc'),
        desiredSalary: getVal('desiredSalary'),
        noticePeriodDays: getVal('noticePeriodDays'),
        requireVisa: getVal('requireVisa'),
        willingToRelocate: getVal('willingToRelocate')
    };
    profile.fullName = `${profile.firstName} ${profile.lastName}`;

    // Build bot settings (includes base resume doc ID)
    const baseResumeUrl = getVal('baseResumeDocUrl');
    const settings = {
        applyMode: getRadio('applyMode') || 'easy_apply',
        strategy: getRadio('strategy') || 'standard',
        minMatchScore: parseInt(getVal('minMatchScore')) || 60,
        targetCountries: getVal('targetCountries'),
        targetCities: getVal('targetCities'),
        workplaceRemote: getCheck('workplaceRemote'),
        workplaceOnsite: getCheck('workplaceOnsite'),
        workplaceHybrid: getCheck('workplaceHybrid'),
        maxJobs: parseInt(getVal('maxJobs')) || 10,
        companyBlacklist: getVal('companyBlacklist').split(',').map(s => s.trim()).filter(Boolean),
        titleBlacklist: getVal('titleBlacklist').split(',').map(s => s.trim()).filter(Boolean),
        autoApply: getCheck('autoApply'),
        showRelevanceWidget: getCheck('showRelevanceWidget'),
        enableNotifications: getCheck('enableNotifications'),
        showAutofillWidget: getCheck('showAutofillWidget'),
        autoFillOnExternalOpen: getCheck('autoFillOnExternalOpen'),
        enableTextEnhancer: getCheck('enableTextEnhancer'),
        verboseLogging: getCheck('verboseLogging'),
        baseResumeDocUrl: baseResumeUrl,
        baseResumeDocId: extractDocId(baseResumeUrl)
    };

    const geminiApiKey = getVal('geminiApiKey');
    const aiModel = getVal('aiModel');

    chrome.storage.local.set({
        candidateProfile: profile,
        botSettings: settings,
        geminiApiKey: geminiApiKey,
        aiModel: aiModel
    }, () => {
        status.textContent = "✅ All settings saved!";
        status.style.color = "#4ade80";
        setTimeout(() => { status.textContent = ""; }, 3000);
    });
}

// ─── Export / Import ───
function exportSettings() {
    chrome.storage.local.get(null, (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkedinvibe-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            chrome.storage.local.set(data, () => {
                alert('Settings imported! Page will reload.');
                location.reload();
            });
        } catch (err) {
            alert('Invalid settings file: ' + err.message);
        }
    };
    reader.readAsText(file);
}
