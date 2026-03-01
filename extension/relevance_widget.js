/**
 * Relevance Score Widget for LinkedIn Job Pages
 * Shows a floating icon on /jobs/view/ pages that lets users check
 * their match score and create tailored resumes.
 */

(function () {
    'use strict';

    // Only activate on job view pages
    function shouldActivate() {
        return window.location.href.includes('/jobs/view/') ||
            window.location.href.includes('/jobs/search/');
    }

    // Check if widget is enabled in settings before showing
    chrome.storage.local.get(['botSettings'], (res) => {
        const settings = res.botSettings || {};
        if (settings.showRelevanceWidget === false) {
            console.log('🎯 Relevance widget disabled in settings. Skipping observer.');
            return;
        }

        // Feature is enabled. Now we can set up the observers.
        if (!shouldActivate()) {
            // Re-check on URL changes (LinkedIn is SPA)
            let lastUrl = window.location.href;
            const urlObserver = new MutationObserver(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    if (shouldActivate()) {
                        setTimeout(initWidget, 1500);
                    } else {
                        removeWidget();
                    }
                }
            });
            urlObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            // Already on a valid page
            setTimeout(initWidget, 2000);
        }
    });

    function initWidget() {
        if (document.getElementById('lv-relevance-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'lv-relevance-widget';
        widget.innerHTML = `
            <div id="lv-rel-btn" title="Check Job Match Score">
                <span>🎯</span>
            </div>
            <div id="lv-rel-panel" style="display:none;">
                <div id="lv-rel-header">
                    <span>Job Match Analysis</span>
                    <span id="lv-rel-close" style="cursor:pointer;">✕</span>
                </div>
                <div id="lv-rel-body">
                    <div id="lv-rel-score" style="text-align:center; padding: 15px 0;">
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">Click to analyze your match with this job</div>
                        <button id="lv-rel-analyze" class="lv-rel-btn-primary">🧠 Analyze Match</button>
                    </div>
                    <div id="lv-rel-result" style="display:none;"></div>
                    <div id="lv-rel-actions" style="display:none;"></div>
                    <div id="lv-rel-loading" style="display:none; text-align:center; padding: 20px;">
                        <div class="lv-rel-spinner"></div>
                        <div id="lv-rel-loading-text" style="font-size: 11px; color: #666; margin-top: 8px;">Analyzing...</div>
                    </div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #lv-relevance-widget {
                position: fixed;
                left: 12px;
                top: 40%;
                z-index: 9999;
                font-family: 'Segoe UI', system-ui, sans-serif;
            }
            #lv-rel-btn {
                width: 44px; height: 44px;
                background: linear-gradient(135deg, #059669, #047857);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; font-size: 20px;
                box-shadow: 0 4px 14px rgba(5,150,105,0.4);
                transition: all 0.3s;
                border: 2px solid rgba(255,255,255,0.3);
            }
            #lv-rel-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(5,150,105,0.6);
            }
            #lv-rel-panel {
                position: absolute;
                left: 52px; top: -100px;
                width: 300px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                border: 1px solid #e0e0e0;
                overflow: hidden;
            }
            #lv-rel-header {
                background: linear-gradient(135deg, #059669, #047857);
                color: white;
                padding: 10px 14px;
                font-size: 13px; font-weight: 600;
                display: flex; justify-content: space-between; align-items: center;
            }
            #lv-rel-body { padding: 12px; }
            .lv-rel-btn-primary {
                background: linear-gradient(135deg, #059669, #047857);
                color: white; border: none; padding: 10px 20px;
                border-radius: 8px; font-size: 13px; font-weight: 600;
                cursor: pointer; transition: opacity 0.2s;
                width: 100%;
            }
            .lv-rel-btn-primary:hover { opacity: 0.9; }
            .lv-rel-btn-secondary {
                background: #f0fdf4; color: #059669;
                border: 1px solid #bbf7d0; padding: 8px 16px;
                border-radius: 8px; font-size: 12px; font-weight: 600;
                cursor: pointer; width: 100%; margin-top: 8px;
            }
            .lv-rel-spinner {
                width: 28px; height: 28px; margin: 0 auto;
                border: 3px solid #e5e7eb; border-top: 3px solid #059669;
                border-radius: 50%; animation: lv-rel-spin 0.8s linear infinite;
            }
            @keyframes lv-rel-spin { to { transform: rotate(360deg); } }
            .lv-score-ring {
                width: 80px; height: 80px; margin: 0 auto 10px;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-size: 28px; font-weight: 800; color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);

        // Events
        document.getElementById('lv-rel-btn').addEventListener('click', () => {
            const panel = document.getElementById('lv-rel-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('lv-rel-close').addEventListener('click', () => {
            document.getElementById('lv-rel-panel').style.display = 'none';
        });

        document.getElementById('lv-rel-analyze').addEventListener('click', analyzeMatch);
    }

    function removeWidget() {
        const w = document.getElementById('lv-relevance-widget');
        if (w) w.remove();
    }

    async function analyzeMatch() {
        const scoreDiv = document.getElementById('lv-rel-score');
        const resultDiv = document.getElementById('lv-rel-result');
        const actionsDiv = document.getElementById('lv-rel-actions');
        const loadingDiv = document.getElementById('lv-rel-loading');

        scoreDiv.style.display = 'none';
        loadingDiv.style.display = 'block';

        // Extract JD
        let jd = '';
        const descEl = document.querySelector('.jobs-description') ||
            document.querySelector('.jobs-description-content__text') ||
            document.querySelector('#job-details');
        if (descEl) jd = descEl.innerText;
        else jd = document.body.innerText.substring(0, 5000);

        // Extract job title and company
        const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
            document.querySelector('.jobs-unified-top-card__job-title') ||
            document.querySelector('h1');
        const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
            document.querySelector('.jobs-unified-top-card__company-name');

        const jobTitle = titleEl ? titleEl.innerText.trim() : '';
        const company = companyEl ? companyEl.innerText.trim() : '';

        document.getElementById('lv-rel-loading-text').textContent =
            `Analyzing match for ${jobTitle || 'this job'}...`;

        // AI Call via background
        const result = await new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: 'analyze_job_match',
                jobDescription: jd.substring(0, 5000),
                resumeContext: 'auto'  // background.js will use stored profile
            }, response => resolve(response));
        });

        loadingDiv.style.display = 'none';

        if (result && result.success) {
            const score = result.score || 0;
            const reason = result.reason || '';
            const color = score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626';
            const bgGrad = score >= 70
                ? 'linear-gradient(135deg, #059669, #047857)'
                : score >= 40
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #dc2626, #991b1b)';

            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="text-align:center;">
                    <div class="lv-score-ring" style="background: ${bgGrad};">${score}%</div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 10px;">${reason}</div>
                </div>
            `;

            actionsDiv.style.display = 'block';
            actionsDiv.innerHTML = `
                ${score < 70 ? `
                    <button id="lv-rel-tailor" class="lv-rel-btn-secondary">
                        📝 Create Tailored Resume to Improve Score
                    </button>
                    <div style="font-size: 10px; color: #666; text-align: center; margin-top: 4px;">
                        AI will optimize your resume for this specific job
                    </div>
                ` : `
                    <div style="text-align:center; color: #059669; font-weight: 600; padding: 8px;">
                        ✅ Great match! You're a strong candidate.
                    </div>
                `}
                <button id="lv-rel-recheck" class="lv-rel-btn-secondary" style="margin-top: 8px; background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe;">
                    🔄 Re-analyze
                </button>
            `;

            // Attach handlers
            document.getElementById('lv-rel-recheck')?.addEventListener('click', () => {
                resultDiv.style.display = 'none';
                actionsDiv.style.display = 'none';
                scoreDiv.style.display = 'block';
            });

            document.getElementById('lv-rel-tailor')?.addEventListener('click', async () => {
                actionsDiv.innerHTML = '<div style="text-align:center;padding:10px;"><div class="lv-rel-spinner"></div><div style="font-size:11px;margin-top:8px;">Creating tailored resume...</div></div>';

                const tailorResult = await new Promise(resolve => {
                    chrome.runtime.sendMessage({
                        action: 'create_tailored_resume',
                        jobDescription: jd.substring(0, 5000),
                        jobTitle: jobTitle,
                        company: company
                    }, response => resolve(response));
                });

                if (tailorResult && tailorResult.success) {
                    actionsDiv.innerHTML = `
                        <div style="text-align:center; padding: 8px;">
                            <div style="color: #059669; font-weight: 600;">✅ Tailored Resume Created!</div>
                            ${tailorResult.resumeDocUrl ? `
                                <a href="${tailorResult.resumeDocUrl}" target="_blank" 
                                   style="display:inline-block; margin-top: 8px; color: #0a66c2; font-weight: 600;">
                                    Open Google Doc ↗
                                </a>
                            ` : '<div style="font-size:11px; color:#666; margin-top:4px;">Configure Google Docs in settings for persistent docs.</div>'}
                        </div>
                    `;
                } else {
                    actionsDiv.innerHTML = '<div style="text-align:center;color:#dc2626;">Failed to create resume. Check settings.</div>';
                }
            });
        } else {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div style="text-align:center;color:#dc2626;padding:10px;">Analysis failed. Check API key.</div>';
        }
    }
})();
