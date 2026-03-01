/**
 * Universal Auto-Fill Content Script
 * Works on ANY job site — injected programmatically by background.js
 * Features:
 *   - Floating icon widget (left side)
 *   - AI-powered form analysis via Gemini
 *   - Multi-step form navigation
 *   - Account creation / CAPTCHA detection
 *   - Cross-tab user help popups
 *   - Learning from user corrections
 */

(function () {
    'use strict';

    // Prevent double injection
    if (window.__linkedinVibeAutofillInjected) return;
    window.__linkedinVibeAutofillInjected = true;

    console.log('🤖 LinkedInVibe Universal Auto-Fill loaded on:', window.location.href);

    function sanitizeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
                default: return m;
            }
        });
    }

    // ========================
    // 1. FLOATING WIDGET
    // ========================
    function createFloatingWidget() {
        if (document.getElementById('lv-autofill-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'lv-autofill-widget';
        widget.innerHTML = `
            <div id="lv-widget-btn" title="LinkedInVibe Auto-Fill">
                <span style="font-size: 22px;">🤖</span>
            </div>
            <div id="lv-widget-panel" style="display: none;">
                <div id="lv-panel-header">
                    <span>LinkedInVibe Auto-Fill</span>
                    <span id="lv-panel-close" style="cursor:pointer;opacity:0.7;">✕</span>
                </div>
                <div id="lv-panel-body">
                    <button id="lv-btn-autofill" class="lv-btn lv-btn-primary">✨ Auto-Fill This Form</button>
                    <button id="lv-btn-score" class="lv-btn lv-btn-secondary">📊 Check Relevance Score</button>
                    <div id="lv-status" style="display:none;"></div>
                    <div id="lv-score-card" style="display:none;"></div>
                    <div id="lv-unfilled-list" style="display:none;"></div>
                </div>
            </div>
        `;

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            #lv-autofill-widget {
                position: fixed;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 99999;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            }
            #lv-widget-btn {
                width: 48px; height: 48px;
                background: linear-gradient(135deg, #0a66c2, #004182);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(10,102,194,0.4);
                transition: all 0.3s ease;
                border: 2px solid rgba(255,255,255,0.3);
            }
            #lv-widget-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 24px rgba(10,102,194,0.6);
            }
            #lv-widget-panel {
                position: absolute;
                left: 56px; top: -120px;
                width: 280px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                border: 1px solid #e0e0e0;
                overflow: hidden;
            }
            #lv-panel-header {
                background: linear-gradient(135deg, #0a66c2, #004182);
                color: white;
                padding: 10px 14px;
                font-size: 13px; font-weight: 600;
                display: flex; justify-content: space-between; align-items: center;
            }
            #lv-panel-body {
                padding: 12px;
            }
            .lv-btn {
                width: 100%; padding: 10px; margin-bottom: 8px;
                border-radius: 8px; border: none;
                font-size: 13px; font-weight: 600;
                cursor: pointer; transition: all 0.2s;
            }
            .lv-btn-primary {
                background: linear-gradient(135deg, #0a66c2, #004182);
                color: white;
            }
            .lv-btn-primary:hover { opacity: 0.9; }
            .lv-btn-secondary {
                background: #f0f9ff; color: #0a66c2;
                border: 1px solid #bae6fd;
            }
            .lv-btn-secondary:hover { background: #e0f2fe; }
            #lv-status {
                font-size: 12px; padding: 8px; margin-top: 4px;
                border-radius: 6px; text-align: center;
            }
            #lv-score-card {
                margin-top: 8px; padding: 10px;
                border-radius: 8px; border: 1px solid #e5e7eb;
                font-size: 12px;
            }
            #lv-unfilled-list {
                margin-top: 8px; padding: 10px;
                background: #fff7ed; border: 1px solid #fed7aa;
                border-radius: 8px; font-size: 12px;
            }
            .lv-spinner {
                display: inline-block; width: 14px; height: 14px;
                border: 2px solid #ccc; border-top: 2px solid #0a66c2;
                border-radius: 50%; animation: lv-spin 0.8s linear infinite;
            }
            @keyframes lv-spin { to { transform: rotate(360deg); } }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);

        // Event handlers
        document.getElementById('lv-widget-btn').addEventListener('click', () => {
            const panel = document.getElementById('lv-widget-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('lv-panel-close').addEventListener('click', () => {
            document.getElementById('lv-widget-panel').style.display = 'none';
        });

        document.getElementById('lv-btn-autofill').addEventListener('click', () => {
            startAutoFill();
        });

        document.getElementById('lv-btn-score').addEventListener('click', () => {
            checkRelevanceScore();
        });
    }

    // ========================
    // 2. HTML SANITIZER
    // ========================
    function sanitizePageHTML() {
        // Clone the body and strip unnecessary elements
        const clone = document.body.cloneNode(true);

        // Remove scripts, styles, hidden elements, images, svgs, iframes
        const removeSelectors = [
            'script', 'style', 'link', 'meta', 'noscript',
            'svg', 'img', 'video', 'audio', 'canvas', 'iframe',
            '[style*="display: none"]', '[style*="display:none"]',
            '[hidden]', '[aria-hidden="true"]',
            'header', 'footer', 'nav'
        ];
        removeSelectors.forEach(sel => {
            clone.querySelectorAll(sel).forEach(el => el.remove());
        });

        // Focus on form-relevant content
        const forms = clone.querySelectorAll('form, [role="form"]');
        if (forms.length > 0) {
            // Extract just form content
            let formHtml = '';
            forms.forEach(f => { formHtml += f.outerHTML; });
            return formHtml.substring(0, 15000); // Limit for API call
        }

        // If no forms found, look for input-heavy sections
        const inputs = clone.querySelectorAll('input, select, textarea, [role="textbox"]');
        if (inputs.length > 2) {
            // Find the common ancestor
            let relevantHtml = '';
            inputs.forEach(input => {
                const parent = input.closest('div, section, main, article') || input.parentElement;
                if (parent) relevantHtml += parent.outerHTML + '\n';
            });
            return relevantHtml.substring(0, 15000);
        }

        // Fallback: return trimmed body
        return clone.innerHTML.substring(0, 10000);
    }

    // ========================
    // 3. PAGE TYPE DETECTION
    // ========================
    function detectPageType() {
        const html = document.body.innerText.toLowerCase();
        const url = window.location.href.toLowerCase();

        // CAPTCHA detection
        const captchaSelectors = [
            'iframe[src*="recaptcha"]', 'iframe[src*="hcaptcha"]',
            '.g-recaptcha', '.h-captcha', '#captcha',
            'iframe[src*="captcha"]'
        ];
        for (const sel of captchaSelectors) {
            if (document.querySelector(sel)) return 'captcha';
        }

        // Login page detection
        const loginKeywords = ['sign in', 'log in', 'login', 'sign-in'];
        const passwordFields = document.querySelectorAll('input[type="password"]');
        if (passwordFields.length > 0 && loginKeywords.some(k => html.includes(k))) {
            return 'login_required';
        }

        // Account creation detection
        const signupKeywords = ['create account', 'sign up', 'register', 'create an account', 'join'];
        if (passwordFields.length > 0 && signupKeywords.some(k => html.includes(k))) {
            return 'account_creation';
        }

        // Success/Thank you page
        const successKeywords = ['thank you', 'application submitted', 'successfully submitted', 'application received'];
        if (successKeywords.some(k => html.includes(k))) {
            return 'success';
        }

        // Application form
        const formInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="password"]), select, textarea');
        if (formInputs.length >= 2) {
            return 'application_form';
        }

        return 'unknown';
    }

    // ========================
    // 4. STATUS UI HELPERS
    // ========================
    function showStatus(text, type = 'info') {
        const el = document.getElementById('lv-status');
        if (!el) return;
        const colors = {
            info: '#eff6ff; color: #1e40af; border: 1px solid #bfdbfe',
            success: '#f0fdf4; color: #166534; border: 1px solid #bbf7d0',
            error: '#fef2f2; color: #991b1b; border: 1px solid #fecaca',
            loading: '#f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe'
        };
        el.style.display = 'block';
        el.style.cssText += `background: ${colors[type] || colors.info}; padding: 8px; border-radius: 6px; font-size: 12px; margin-top: 4px;`;
        const safeText = sanitizeHTML(text);
        el.innerHTML = type === 'loading'
            ? `<span class="lv-spinner"></span> ${safeText}`
            : safeText;
    }

    // ========================
    // 5. AUTO-FILL FLOW
    // ========================
    async function startAutoFill() {
        showStatus('Analyzing page...', 'loading');

        // Step 1: Detect page type
        const pageType = detectPageType();
        console.log('🤖 Page type:', pageType);

        if (pageType === 'captcha') {
            showStatus('⚠️ CAPTCHA detected! Please solve it manually.', 'error');
            notifyUserHelp('CAPTCHA detected on this page. Please solve it manually.');
            return;
        }

        if (pageType === 'login_required') {
            showStatus('🔐 Login required. Please sign in first.', 'error');
            notifyUserHelp('This site requires login. Please sign in manually.');
            return;
        }

        if (pageType === 'account_creation') {
            showStatus('👤 Account creation needed. Please create an account first.', 'error');
            notifyUserHelp('This site requires account creation. Please sign up manually.');
            return;
        }

        if (pageType === 'success') {
            showStatus('✅ Application appears to be submitted!', 'success');
            return;
        }

        // Step 2: Sanitize HTML
        showStatus('Extracting form structure...', 'loading');
        const sanitizedHtml = sanitizePageHTML();

        // Step 3: Get user profile
        const profile = await new Promise(r =>
            chrome.storage.local.get(['candidateProfile', 'externalJobContext'], res => r(res))
        );

        const jobContext = profile.externalJobContext || {};

        // Step 4: Send to AI for analysis
        showStatus('🧠 AI analyzing form fields...', 'loading');

        const mapping = await new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: 'analyze_form_with_gemini',
                formContext: {
                    html: sanitizedHtml,
                    url: window.location.href,
                    pageType: pageType,
                    jobTitle: jobContext.jobTitle || '',
                    company: jobContext.company || '',
                    jobDescription: jobContext.jobDescription || ''
                },
                modelName: 'gemini-2.5-flash-lite'
            }, response => {
                if (response && response.success) resolve(response.mapping);
                else {
                    console.error('AI analysis failed:', response?.error);
                    resolve(null);
                }
            });
        });

        if (!mapping || !mapping.fields || mapping.fields.length === 0) {
            showStatus('Could not identify form fields. Try manual fill.', 'error');
            return;
        }

        // Step 5: Apply field values
        showStatus(`Filling ${mapping.fields.length} fields...`, 'loading');
        const results = await applyFieldMapping(mapping.fields, profile);

        // Step 6: Report results
        const filled = results.filter(r => r.filled).length;
        const unfilled = results.filter(r => !r.filled);

        if (unfilled.length === 0) {
            showStatus(`✅ All ${filled} fields filled successfully!`, 'success');
        } else {
            showStatus(`Filled ${filled}/${results.length} fields. ${unfilled.length} need your attention.`, 'error');
            showUnfilledFields(unfilled);

            // Notify via cross-tab if needed
            if (unfilled.length > 0) {
                chrome.runtime.sendMessage({
                    action: 'bot_needs_help',
                    tabId: null, // background.js will use sender.tab.id
                    unfilledFields: unfilled.map(f => f.label),
                    jobTitle: jobContext.jobTitle || 'Unknown',
                    company: jobContext.company || 'Unknown'
                });
            }
        }

        // Step 7: Start learning from user corrections
        attachLearningListeners();

        // Step 8: Look for submit/next button and suggest
        const nextAction = mapping.nextAction || detectNextAction();
        if (nextAction === 'submit') {
            showStatus(`✅ ${filled} fields filled. Ready to submit!`, 'success');
        } else if (nextAction === 'next_page') {
            showStatus(`✅ ${filled} fields filled. Click 'Next' to continue.`, 'info');
        }
    }

    // ========================
    // 6. APPLY FIELD MAPPING
    // ========================
    async function applyFieldMapping(fields, profile) {
        const results = [];

        for (const field of fields) {
            try {
                const element = findElement(field.selector, field.label);
                if (!element) {
                    results.push({ label: field.label, filled: false, reason: 'Element not found' });
                    continue;
                }

                // Skip password fields (security)
                if (element.type === 'password') {
                    results.push({ label: field.label, filled: false, reason: 'Password field (skipped for security)' });
                    continue;
                }

                // Handle file uploads (Resumes/CVs)
                if (element.type === 'file') {
                    const isResumeField = field.label.toLowerCase().includes('resume') || field.label.toLowerCase().includes('cv');
                    if (isResumeField && profile._resumeBase64 && profile._resumeFilename) {
                        try {
                            const byteCharacters = atob(profile._resumeBase64);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });

                            const file = new File([blob], profile._resumeFilename, { type: 'application/pdf' });
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);

                            element.files = dataTransfer.files;
                            element.dispatchEvent(new Event('change', { bubbles: true }));

                            results.push({ label: field.label, filled: true, value: profile._resumeFilename });

                            // Prevent uploading the same resume locally to multiple file inputs
                            profile._resumeBase64 = null;
                            continue;
                        } catch (err) {
                            console.error("Error uploading file in universal autofill:", err);
                        }
                    }
                    results.push({ label: field.label, filled: false, reason: 'File upload (manual)' });
                    continue;
                }

                // Skip already filled fields
                if (element.value && element.value.trim().length > 0 && element.type !== 'checkbox') {
                    results.push({ label: field.label, filled: true, reason: 'Already filled' });
                    continue;
                }

                await setFieldValue(element, field.value);
                results.push({ label: field.label, filled: true });
            } catch (e) {
                results.push({ label: field.label, filled: false, reason: e.message });
            }
        }

        return results;
    }

    function findElement(selector, label) {
        // Try selector first
        if (selector) {
            const el = document.querySelector(selector);
            if (el) return el;
        }

        // Fallback: find by label text
        if (label) {
            const labelLower = label.toLowerCase();

            // Check all labels
            const labels = document.querySelectorAll('label');
            for (const lab of labels) {
                if (lab.innerText.toLowerCase().includes(labelLower)) {
                    const forId = lab.getAttribute('for');
                    if (forId) {
                        const input = document.getElementById(forId);
                        if (input) return input;
                    }
                    // Check for input inside label
                    const input = lab.querySelector('input, select, textarea');
                    if (input) return input;
                }
            }

            // Check aria-labels
            const ariaInputs = document.querySelectorAll(`[aria-label*="${labelLower}" i]`);
            if (ariaInputs.length > 0) return ariaInputs[0];

            // Check placeholder
            const placeholderInputs = document.querySelectorAll(`[placeholder*="${labelLower}" i]`);
            if (placeholderInputs.length > 0) return placeholderInputs[0];

            // Check name attribute
            const nameInputs = document.querySelectorAll(`[name*="${labelLower}" i]`);
            if (nameInputs.length > 0) return nameInputs[0];
        }

        return null;
    }

    async function setFieldValue(element, value) {
        if (!value) return;
        const val = String(value);

        if (element.tagName === 'SELECT') {
            const opts = Array.from(element.options);
            const idx = opts.findIndex(o =>
                o.text.toLowerCase().includes(val.toLowerCase()) ||
                o.value.toLowerCase().includes(val.toLowerCase())
            );
            if (idx >= 0) element.selectedIndex = idx;
            else if (opts.length > 1) element.selectedIndex = 1;
        } else if (element.type === 'checkbox') {
            const shouldCheck = ['yes', 'true', '1', 'agree'].includes(val.toLowerCase());
            if (shouldCheck && !element.checked) element.click();
        } else if (element.type === 'radio') {
            if (!element.checked) element.click();
        } else {
            // Text, textarea, email, tel, number, etc.
            element.value = val;
            element.focus();
        }

        // Trigger events for framework-based forms (React, Angular, etc.)
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        // Also trigger React synthetic events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeInputValueSetter && element.tagName === 'INPUT') {
            nativeInputValueSetter.call(element, val);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await new Promise(r => setTimeout(r, 150));
    }

    // ========================
    // 7. UNFILLED FIELDS UI
    // ========================
    function showUnfilledFields(unfilled) {
        const el = document.getElementById('lv-unfilled-list');
        if (!el) return;
        el.style.display = 'block';
        el.innerHTML = `
            <div style="font-weight:600; margin-bottom: 6px;">⚠️ Needs your attention:</div>
            ${unfilled.map(f => `
                <div style="margin-bottom: 4px; padding: 4px 0; border-bottom: 1px solid #fde68a;">
                    <strong>${sanitizeHTML(f.label)}</strong><br>
                    <span style="color: #92400e; font-size: 11px;">${sanitizeHTML(f.reason)}</span>
                </div>
            `).join('')}
        `;
    }

    // ========================
    // 8. RELEVANCE SCORE
    // ========================
    async function checkRelevanceScore() {
        showStatus('Extracting job description...', 'loading');

        // Try to get JD from page
        let jd = '';
        const jdSelectors = [
            '.job-description', '.jd-description', '#job-description',
            '[data-testid="job-description"]', '.description__text',
            '.posting-requirements', '.jobDescriptionContent',
            'article', '.content-area', 'main'
        ];
        for (const sel of jdSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 100) {
                jd = el.innerText;
                break;
            }
        }

        // Fallback: just use page body text
        if (!jd) {
            jd = document.body.innerText.substring(0, 5000);
        }

        // Also check storage for external job context
        const stored = await new Promise(r =>
            chrome.storage.local.get(['externalJobContext'], res => r(res))
        );
        if (stored.externalJobContext?.jobDescription) {
            jd = stored.externalJobContext.jobDescription + '\n\n' + jd;
        }

        showStatus('🧠 AI calculating match score...', 'loading');

        const result = await new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: 'check_job_match_score',
                jobDescription: jd.substring(0, 5000)
            }, response => resolve(response));
        });

        const scoreCard = document.getElementById('lv-score-card');
        if (result && result.success) {
            const score = result.score || 0;
            const color = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';
            scoreCard.style.display = 'block';
            scoreCard.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: ${color};">${score}%</div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 8px;">Match Score</div>
                    ${score < 70 ? `
                        <button id="lv-btn-improve" class="lv-btn lv-btn-secondary" style="font-size: 11px; padding: 6px;">
                            📝 Create Tailored Resume to Improve Score
                        </button>
                    ` : `
                        <div style="color: #16a34a; font-weight: 600;">✅ Good match! Proceed with application.</div>
                    `}
                </div>
            `;

            if (score < 70) {
                document.getElementById('lv-btn-improve')?.addEventListener('click', () => {
                    createTailoredResume(jd);
                });
            }
            showStatus(`Match score: ${score}%`, score >= 70 ? 'success' : 'info');
        } else {
            showStatus('Could not calculate score.', 'error');
        }
    }

    async function createTailoredResume(jd) {
        showStatus('🤖 Creating tailored resume...', 'loading');

        const stored = await new Promise(r =>
            chrome.storage.local.get(['externalJobContext'], res => r(res))
        );
        const ctx = stored.externalJobContext || {};

        const result = await new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: 'create_tailored_resume',
                jobDescription: jd.substring(0, 5000),
                jobTitle: ctx.jobTitle || document.title,
                company: ctx.company || ''
            }, response => resolve(response));
        });

        if (result && result.success && result.resumeDocUrl) {
            showStatus(`✅ Tailored resume created! <a href="${result.resumeDocUrl}" target="_blank" style="color:#0a66c2;">Open Doc ↗</a>`, 'success');
        } else if (result && result.success) {
            showStatus('✅ Resume tailored (no Google Doc created — configure in settings).', 'success');
        } else {
            showStatus('Failed to create tailored resume.', 'error');
        }
    }

    // ========================
    // 9. DETECT NEXT ACTION
    // ========================
    function detectNextAction() {
        const buttons = document.querySelectorAll('button, input[type="submit"]');
        for (const btn of buttons) {
            const text = (btn.innerText || btn.value || '').toLowerCase();
            if (text.includes('submit') || text.includes('apply')) return 'submit';
            if (text.includes('next') || text.includes('continue')) return 'next_page';
        }
        return 'unknown';
    }

    // ========================
    // 10. CROSS-TAB NOTIFICATION
    // ========================
    function notifyUserHelp(message) {
        chrome.runtime.sendMessage({
            action: 'bot_needs_help',
            unfilledFields: [message],
            jobTitle: document.title,
            company: window.location.hostname
        });
    }

    // ========================
    // 11. LEARNING FROM USER
    // ========================
    function attachLearningListeners() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const label = getFieldLabel(e.target);
                const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

                if (label && val) {
                    chrome.storage.local.get(['learnedQuestions'], (res) => {
                        const learned = res.learnedQuestions || {};
                        learned[label.toLowerCase()] = val;
                        chrome.storage.local.set({ learnedQuestions: learned });
                        console.log(`🧠 Learned: "${label}" = "${val}"`);
                    });
                }
            });
        });
    }

    function getFieldLabel(element) {
        // Check for label
        if (element.id) {
            const lab = document.querySelector(`label[for="${element.id}"]`);
            if (lab) return lab.innerText.trim();
        }
        if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
        if (element.placeholder) return element.placeholder;
        if (element.name) return element.name;

        // Check parent label
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.innerText.trim();

        return '';
    }

    // ========================
    // 12. MULTI-STEP NAVIGATION
    // ========================
    let stepCount = 0;
    const MAX_STEPS = 10;

    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            // Check if significant DOM changes occurred (new form page)
            let significantChange = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 3) {
                    significantChange = true;
                    break;
                }
            }

            if (significantChange && stepCount < MAX_STEPS) {
                // Debounce
                clearTimeout(window.__lvMutationTimeout);
                window.__lvMutationTimeout = setTimeout(() => {
                    const pageType = detectPageType();
                    if (pageType === 'success') {
                        console.log('🎉 Application submitted successfully!');
                        showStatus('✅ Application submitted!', 'success');
                        observer.disconnect();
                    } else if (pageType === 'application_form') {
                        stepCount++;
                        console.log(`📄 New form step detected (${stepCount}/${MAX_STEPS})`);
                        // Auto re-fill if we were auto-filling
                        if (window.__lvAutoMode) {
                            startAutoFill();
                        }
                    }
                }, 1500);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ========================
    // 13. INITIALIZATION
    // ========================
    function init() {
        // Check if page has forms or inputs 
        const hasInteractiveElements = document.querySelectorAll(
            'input:not([type="hidden"]), select, textarea'
        ).length >= 1;

        if (hasInteractiveElements || window.location.href.includes('apply') || window.location.href.includes('career')) {
            createFloatingWidget();
            setupMutationObserver();
        }

        // Check if we were invoked automatically by the bot
        chrome.storage.local.get(['externalJobContext'], (res) => {
            if (res.externalJobContext && res.externalJobContext.tabId) {
                // Check if this is the right tab
                console.log('🤖 Auto-fill mode: external job context found');
                window.__lvAutoMode = true;
                // Auto-start filling after a brief delay
                setTimeout(() => startAutoFill(), 2000);
            }
        });
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
