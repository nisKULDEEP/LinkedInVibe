// Load configuration
importScripts('config.js');

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

            // Notify user visually since the web UI might not update
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'LinkedInVibe Connected!',
                message: 'Your account has been successfully linked. You can now use Pro features.'
            });

            sendResponse({ success: true });
        });
        return true;
    }

    // --- AI FORM FILLING ---
    if (request.action === "analyze_form_with_gemini") {
        const { formContext, modelName } = request;
        chrome.storage.local.get(['geminiApiKey', 'candidateProfile'], (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }
            if (!res.candidateProfile) {
                sendResponse({ success: false, error: "No Profile Data" });
                return;
            }

            analyzeFormWithGemini(res.geminiApiKey, res.candidateProfile, formContext, modelName)
                .then(mapping => sendResponse({ success: true, mapping }))
                .catch(err => sendResponse({ success: false, error: err.message }));
        });
        return true;
    }

    // --- BOT AI QUESTION ANSWERING ---
    if (request.action === "bot_ask_ai") {
        const { questions, jobDescription, profile } = request; // Use passed profile or fetch from storage

        chrome.storage.local.get(['geminiApiKey', 'candidateProfile'], (res) => {
            const apiKey = res.geminiApiKey;
            const userProfile = profile || res.candidateProfile;

            if (!apiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }

            // Reuse analyzeFormWithGemini but with JD context
            analyzeFormWithGemini(apiKey, userProfile, questions, "gemini-2.5-flash-lite", jobDescription)
                .then(answers => sendResponse({ success: true, answers }))
                .catch(err => sendResponse({ success: false, error: err.message }));
        });
        return true;
    }
    // --- RESUME MATCHING ---
    if (request.action === "analyze_job_match") {
        const { jobDescription, resumeContext } = request;
        chrome.storage.local.get(['geminiApiKey'], async (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }

            const prompt = `
            Act as a Hiring Manager. Compare the Candidate Resume with the Job Description.
            
            JOB DESCRIPTION:
            ${jobDescription.substring(0, 5000)}

            CANDIDATE RESUME/PROFILE:
            ${typeof resumeContext === 'string' ? resumeContext.substring(0, 3000) : JSON.stringify(resumeContext).substring(0, 3000)}

            TASK:
            1. Rate the match from 0 to 100.
            2. Be strict but fair.
            3. Return JSON ONLY: { "score": number, "reason": "short explanation" }
            `;

            try {
                const text = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                const clean = text.replace(/```json|```/g, '').trim();
                const json = JSON.parse(clean);
                sendResponse({ success: true, score: json.score, reason: json.reason });
            } catch (e) {
                console.error("Match Analysis Failed", e);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true; // Async response
    }

    // --- SMART TEXT ENHANCER ---
    if (request.action === "enhance_text") {
        const { text } = request;
        chrome.storage.local.get(['geminiApiKey', 'userProfile'], async (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "API Key missing. Set it in the extension." });
                return;
            }

            const prompt = `
            You are a professional LinkedIn ghostwriter and communication expert.
            Enhance the following text that the user is typing into a LinkedIn text box (e.g. a post or a comment).
            Make it sound professional, engaging, and typo-free, but keep the original intent and tone.
            Do NOT add hashtags unless they are already present or completely relevant.
            Do NOT enclose your response in quotes. Reply ONLY with the enhanced text, nothing else.

            User's Context/Profile: ${res.userProfile ? res.userProfile.headline : "No context"}
            
            Original Text: "${text}"
            `;

            try {
                const enhancedText = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                sendResponse({ success: true, text: enhancedText.trim() });
            } catch (e) {
                console.error("Text Enhancement Failed", e);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true; // Async response
    }

    // --- AI QUESTION ANSWERING ---
    if (request.action === "ask_ai_question") {
        const { question, inputType, options, userContext } = request;
        chrome.storage.local.get(['geminiApiKey'], async (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }

            const profileStr = JSON.stringify(userContext?.profile || {}).substring(0, 3000);
            const resumeStr = (userContext?.resumeText || "").substring(0, 4000);

            const prompt = `
            You are an AI assistant filling out a job application form on behalf of a candidate.
            Answer the following question based on the candidate's profile and resume.

            QUESTION: "${question}"
            INPUT TYPE: ${inputType}
            ${options && options.length ? `OPTIONS: ${options.join(' | ')}` : "FREE TEXT (no options)"}

            CANDIDATE PROFILE:
            ${profileStr}

            CANDIDATE RESUME:
            ${resumeStr}

            RULES:
            1. Answer TRUTHFULLY based on the candidate's real experience from profile and resume.
            2. If it asks about years of experience with a specific technology, check the resume for when they first used it. If not mentioned at all, answer "0".
            3. If it asks "Have you completed [education level]?" — check the resume for education section.
            4. If OPTIONS are provided, you MUST return one of the options EXACTLY as written.
            5. For Yes/No questions: answer "Yes" if the resume/profile supports it, otherwise "No".
            6. For numeric fields (years of experience, salary, etc.), return ONLY a number.
            7. Return ONLY the answer value. No quotes, no explanation, no extra text.
            `;

            try {
                const answer = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                console.log(`AI Answer for "${question}": `, answer);
                sendResponse({ success: true, answer: answer.trim() });
            } catch (e) {
                console.error("AI Question Failed", e);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true;
    }

    // --- ATS RESUME ANALYSIS ---
    if (request.action === "analyze_ats_score") {
        chrome.storage.local.get(['geminiApiKey', 'candidateProfile'], async (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }

            const profile = res.candidateProfile || {};
            const profileText = JSON.stringify(profile);

            const prompt = `
            Act as an Expert ATS(Applicant Tracking System) Auditor.
            Analyze this Candidate Profile and Resume Data.

            CANDIDATE DATA:
            ${profileText.substring(0, 5000)}

            TASK:
            1. Calculate an ATS Compatibility Score(0 - 100) based on completeness, keyword density for general tech roles, and clarity.
            2. Provide 1 short sentence of critical feedback.
            
            OUTPUT JSON ONLY:
            { "score": number, "feedback": "string" }
            `;

            try {
                const text = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                const json = JSON.parse(clean);
                sendResponse({ success: true, score: json.score, feedback: json.feedback });
            } catch (e) {
                console.error("ATS Analysis Failed", e);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true;
    }

    // --- RESUME TAILORING AGENT ---
    if (request.action === "tailor_resume") {
        const { jobDescription } = request;
        chrome.storage.local.get(['geminiApiKey', 'candidateProfile'], async (res) => {
            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: "No API Key" });
                return;
            }

            const profile = res.candidateProfile || {};
            const profileText = JSON.stringify(profile);

            const prompt = `
            Act as a Professional Resume Writer.
            Tailor the Candidate Profile to match the Job Description(JD).

            JOB DESCRIPTION:
            ${jobDescription.substring(0, 5000)}

            CANDIDATE PROFILE:
            ${profileText.substring(0, 5000)}

            RULES:
            1. Optimize 'linkedinHeadline', 'linkedinSummary', 'experience', and 'coverLetter' to target JD keywords.
            2. STRICT TRUTH: Do NOT invent skills.If JD asks for ".NET" and candidate has no C# /.NET, do NOT add it.
            3. INFERENCE ALLOWED: If JD asks for "Kubernetes" and candidate has "Backend Systems/Docker", you MAY add Kubernetes if it implies familiarity.
            4. Keep output JSON structure identical to input(only updated fields).
            
            OUTPUT JSON ONLY:
            {
                "linkedinHeadline": "...",
                    "linkedinSummary": "...",
                        "coverLetter": "...",
                            "experience": "..."
            }
            `;

            try {
                const text = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                const tailoredFields = JSON.parse(clean);

                // Merge with original to keep other fields (name, phone etc) safely
                const tailoredProfile = { ...profile, ...tailoredFields };

                sendResponse({ success: true, tailoredProfile: tailoredProfile });
            } catch (e) {
                console.error("Tailoring Failed", e);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true;
    }

    // --- JOB MATCH SCORING ---
    if (request.action === "check_job_match_score") {
        const { jobDescription } = request;
        chrome.storage.local.get(['geminiApiKey', 'candidateProfile'], async (res) => {
            if (!res.geminiApiKey) { sendResponse({ success: false, score: 0 }); return; }

            const profile = JSON.stringify(res.candidateProfile || {});
            const prompt = `
            Rate the match between this Candidate and Job Description(0 - 100).
                JD: ${jobDescription.substring(0, 3000)}
            CANDIDATE: ${profile.substring(0, 3000)}
            OUTPUT JSON: { "score": number }
            `;

            try {
                const text = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);
                const json = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
                sendResponse({ success: true, score: json.score });
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        });
        return true;
    }

    // --- LOG APPLICATION (LOCAL STORAGE) ---
    if (request.action === "log_application") {
        const { rowData } = request;
        const dateKey = new Date().toISOString().split('T')[0]; // e.g. "2026-02-28"
        chrome.storage.local.get(['appliedJobs'], (res) => {
            const all = res.appliedJobs || {};
            if (!all[dateKey]) all[dateKey] = [];
            all[dateKey].push({
                ...rowData,
                timestamp: new Date().toISOString()
            });
            chrome.storage.local.set({ appliedJobs: all }, () => {
                console.log('📊 Application logged locally! (' + dateKey + ')');
                sendResponse({ success: true });
            });
        });
        return true;
    }

    // --- CREATE TAILORED RESUME (LOCAL DOWNLOAD) ---
    if (request.action === "create_tailored_resume") {
        const { jobDescription, jobTitle, company } = request;
        chrome.storage.local.get(['geminiApiKey', 'candidateProfile', 'botSettings'], async (res) => {
            const profile = res.candidateProfile || {};
            const settings = res.botSettings || {};

            if (!res.geminiApiKey) {
                sendResponse({ success: false, error: 'No Gemini API Key' });
                return;
            }

            try {
                // Step 1: Get base resume content
                let baseResumeText = JSON.stringify(profile, null, 2);
                const baseDocId = settings.baseResumeDocId;

                if (baseDocId) {
                    try {
                        // Read from PUBLIC Google Doc export URL (FREE, no API key)
                        const exportUrl = `https://docs.google.com/document/d/${baseDocId}/export?format=txt`;
                        const resp = await fetch(exportUrl);
                        if (resp.ok) {
                            baseResumeText = await resp.text();
                            console.log('📄 Loaded base resume from public Google Doc');
                        } else {
                            console.warn('📄 Doc not public or not found, using profile data');
                        }
                    } catch (e) {
                        console.warn('📄 Could not fetch doc:', e.message);
                    }
                }

                // Step 2: AI tailor the resume
                const prompt = `
                Act as a Professional Resume Writer and ATS Optimization Expert.
                Tailor this resume for the following job.

                JOB TITLE: ${jobTitle || 'N/A'}
                COMPANY: ${company || 'N/A'}
                JOB DESCRIPTION:
                ${(jobDescription || '').substring(0, 5000)}

                BASE RESUME:
                ${baseResumeText.substring(0, 5000)}

                STRICT RULES:
                1. NEVER FABRICATE: Do NOT add skills, tools, or experiences that are not in the base resume.
                   - Example: If the job asks for Angular but the candidate knows React.js, do NOT add Angular.
                2. ADJACENT SKILLS ONLY: You MAY add closely related skills that a developer could realistically learn in 1 week, IF the base resume shows strong related experience.
                   - OK: React developer → add Next.js, Redux Toolkit (same ecosystem)
                   - OK: Python developer → add FastAPI if they know Flask (same language)
                   - NOT OK: React developer → add Angular, Vue.js (different frameworks)
                   - NOT OK: Java developer → add Go, Rust (different languages)
                3. Reorder and emphasize existing skills that match the JD.
                4. Optimize bullet points to use action verbs and quantifiable achievements that align with the JD.
                5. Include a tailored "Professional Summary" section at the top.
                6. Keep the same job history and education — only adjust descriptions for relevance.
                7. Output as clean, well-structured HTML with inline CSS.
                8. Use a professional single-column layout. NO markdown code fences in output.
                9. Use professional fonts (Arial/Segoe UI), proper headings (h1, h2), and bullet points.
                10. Do NOT include a cover letter. Focus only on the resume.
                `;

                let tailoredContent = await generatePostWithGeminiDirect(prompt, res.geminiApiKey);

                // Strip markdown code fences if Gemini wrapped the HTML in ```html...```
                tailoredContent = tailoredContent.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

                // Step 3: Download as styled HTML file locally (named for easy identification)
                const safeTitle = (jobTitle || 'Job').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
                const safeCompany = (company || 'Company').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
                const filename = `Resume_${safeCompany}_${safeTitle}_${Date.now()}.html`;

                // Wrap in a complete HTML document with print-ready CSS
                const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resume - ${jobTitle} @ ${company}</title><style>@page{size:A4;margin:15mm}body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#222;line-height:1.6;font-size:13px}h1{color:#0a66c2;border-bottom:2px solid #0a66c2;padding-bottom:8px;font-size:22px}h2{color:#004182;margin-top:18px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:4px}h3{font-size:14px;margin-top:12px}ul{padding-left:20px}li{margin-bottom:4px}a{color:#0a66c2}@media print{body{margin:0;padding:15px;font-size:12px}}</style></head><body>${tailoredContent}</body></html>`;

                // Convert to PDF via backend
                let finalDataUrl = "";
                let finalFilename = filename.replace('.html', '.pdf');
                let pdfBase64 = null;

                try {
                    console.log('📄 Calling backend to render PDF...');
                    const pdfResponse = await fetch('http://localhost:3000/api/generate-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ html: htmlDoc, filename: finalFilename })
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        if (pdfData.success && pdfData.pdf) {
                            pdfBase64 = pdfData.pdf;
                            finalDataUrl = `data:application/pdf;base64,${pdfData.pdf}`;
                            console.log('📄 Successfully generated PDF via backend');
                        } else {
                            throw new Error('Backend returned success: false');
                        }
                    } else {
                        throw new Error(`HTTP error! status: ${pdfResponse.status}`);
                    }
                } catch (err) {
                    console.error('📄 Backend PDF generation failed, falling back to HTML blob:', err);
                    finalFilename = filename; // Keep .html extension
                    const blob = new Blob([htmlDoc], { type: 'text/html' });
                    // Convert chunk to data URL synchronously via FileReader
                    finalDataUrl = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onloadend = () => r(reader.result);
                        reader.readAsDataURL(blob);
                    });
                }

                // Trigger download
                chrome.downloads.download({
                    url: finalDataUrl,
                    filename: finalFilename,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('📄 Download failed:', chrome.runtime.lastError.message);
                    } else {
                        console.log('📄 Tailored resume saved! Download ID:', downloadId);
                    }
                });

                // Step 4: Also produce tailored profile fields for form filling
                const tailoredProfile = { ...profile };
                tailoredProfile.coverLetter = tailoredContent;

                sendResponse({
                    success: true,
                    tailoredProfile,
                    resumeFilename: finalFilename,
                    resumeBase64: pdfBase64, // Send the base64 back for auto-upload
                    tailoredContent
                });
            } catch (e) {
                console.error('📄 Resume tailoring failed:', e.message);
                sendResponse({ success: false, error: e.message });
            }
        });
        return true;
    }

    // --- NOTIFICATIONS ---
    if (request.action === "notify_user") {
        const { title, message } = request;
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: title || 'LinkedInVibe Bot',
            message: message || 'Attention required!'
        });
        return true;
    }

    // --- BOT NEEDS HELP (CROSS-TAB) ---
    if (request.action === "bot_needs_help") {
        const { tabId, unfilledFields, jobTitle, company } = request;

        // Store help request
        chrome.storage.local.set({ pendingHelpRequest: { tabId, unfilledFields, jobTitle, company, timestamp: Date.now() } });

        // Create system notification
        chrome.notifications.create('bot-help-' + Date.now(), {
            type: 'basic',
            iconUrl: 'icon.png',
            title: '🤖 Bot Needs Help!',
            message: `Can\'t auto-fill ${unfilledFields.length} field(s) for ${jobTitle || 'a job'} at ${company || 'a company'}. Click to assist.`,
            priority: 2,
            requireInteraction: true
        });

        // Switch to bot tab on notification click
        chrome.notifications.onClicked.addListener(function helpClickHandler(notifId) {
            if (notifId.startsWith('bot-help-') && tabId) {
                chrome.tabs.update(tabId, { active: true });
                chrome.notifications.onClicked.removeListener(helpClickHandler);
            }
        });

        sendResponse({ success: true });
        return true;
    }

    // --- OPEN EXTERNAL JOB PAGE ---
    if (request.action === "open_external_job") {
        const { url, jobTitle, company, jobDescription } = request;

        chrome.tabs.create({ url, active: false }, (tab) => {
            // Store context for the new tab
            chrome.storage.local.set({
                externalJobContext: {
                    tabId: tab.id,
                    jobTitle,
                    company,
                    jobDescription,
                    url,
                    timestamp: Date.now()
                }
            });

            // Wait for page to load, then inject universal autofill
            chrome.tabs.onUpdated.addListener(function tabLoadHandler(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(tabLoadHandler);

                    // Inject the universal autofill script
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['universal_autofill.js']
                    }).then(() => {
                        console.log('🌐 Universal autofill injected on external job page');
                    }).catch(e => {
                        console.error('🌐 Failed to inject autofill:', e.message);
                    });
                }
            });

            sendResponse({ success: true, tabId: tab.id });
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

// Supabase config loaded from config.js

async function refreshAccessToken(refreshToken) {
    if (!navigator.onLine) {
        console.warn("⚠️ Token refresh skipped: Application is offline.");
        return { token: null, errorType: 'network' };
    }

    try {
        console.log("🔑 Calling Supabase refresh endpoint...");
        // Ensure no double slashes if variable changes
        const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Token refresh HTTP error: ${response.status}`, errText);
            // 4xx errors usually mean the token is invalid/revoked -> Auth Error
            // 5xx errors -> Server Error (Network-like)
            if (response.status >= 400 && response.status < 500) {
                return { token: null, errorType: 'auth' };
            } else {
                return { token: null, errorType: 'network' };
            }
        }

        const data = await response.json();

        if (data.access_token && data.refresh_token) {
            // Store the new tokens
            await chrome.storage.local.set({
                authToken: data.access_token,
                refreshToken: data.refresh_token
            });
            console.log("✅ New tokens saved to storage.");
            return { token: data.access_token, errorType: null };
        } else {
            console.error("❌ Refresh response missing tokens:", data);
            return { token: null, errorType: 'auth' }; // Unexpected structure, treat as auth fail
        }
    } catch (e) {
        // Check if it's a "Failed to fetch" which often implies Network Error or CORS
        if (e.message.includes("Failed to fetch")) {
            console.warn("⚠️ Token refresh failed (Network/Server unreachable). Will retry.");
            return { token: null, errorType: 'network' };
        }

        console.error("❌ Token refresh unexpected error:", e);
        return { token: null, errorType: 'network' }; // unknown error, safe to retry?
    }
}

async function checkAndExecuteSchedule() {
    if (!navigator.onLine) {
        console.log("⚠️ Polling skipped because browser is offline.");
        return;
    }

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

            const refreshResult = await refreshAccessToken(refreshToken);

            if (refreshResult.token) {
                authToken = refreshResult.token;
                // Retry the request
                console.log("✅ Token refreshed! Retrying request...");
                response = await fetch(BACKEND_URL, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                data = await response.json();
            } else if (refreshResult.errorType === 'network') {
                console.warn("⚠️ Token refresh failed due to network. Skipping this poll.");
                return;
            } else {
                console.error("❌ Token refresh failed (Invalid Refresh Token). User must re-authenticate.");
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
        if (e.message.includes("Failed to fetch")) {
            console.warn("⚠️ Network/Server unreachable during poll (Failed to fetch). Will retry next cycle.");
        } else {
            console.error("🔥 Polling Error:", e.message || e, e.stack);
        }
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
        sendResponse({ success: true, downloadId: downloadId });
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
        // Force BYOK Mode for now
        if (!geminiApiKey) {
            sendResponse({ success: false, error: "API Key not found. Please set it in the extension popup." });
            return;
        }
        sendStatus(sender.tab.id, "Generating with your Gemini Key...");
        let generatedText = await generatePostWithGeminiDirect(systemPrompt, geminiApiKey);
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

        // Force BYOK - Use Local Key
        sendStatus(sender.tab.id, "Text ready! Creating image...");
        try {
            imageBase64 = await generateTemplatedImage(geminiApiKey, formattedText);
        } catch (e) {
            console.error("Image Gen Failed", e);
            sendStatus(sender.tab.id, "Image gen failed, using text only.");
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
    // Use deployed backend, fallback to localhost for dev
    const BACKEND_URL = 'https://linkedinvibe.onrender.com/api/generate';

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
        .map((p, i) => `Post ${i + 1}: "${p.text}" (Likes: ${p.likes || 0})`)
        .join("\n");

    // -------- TOPIC STRATEGY --------
    let topicInstruction = `
TOPIC SELECTION RULE:
- Infer the user's technical niche from recent posts.
- Select EXACTLY ONE core system-design concept.
- The post must go deep on this single idea.
- Do NOT list multiple components or cover the whole system.
`;

    if (customTopic && customTopic.trim().length > 0) {
        topicInstruction = `
CRITICAL TOPIC OVERRIDE:
- The post MUST be about this exact topic:
  "${customTopic}"
- Ignore topics from recent posts.
- You may ONLY mimic tone and structure from recent posts.
`;
    }

    // -------- SYSTEM PROMPT --------
    return `
You are a Staff-level Software Engineer and technical educator who writes viral LinkedIn posts that teach ONE deep system-design insight clearly and memorably.

Your goal is NOT to summarize systems.
Your goal is to upgrade the reader’s mental model.

==============================
YOUR TASK
==============================
1. Analyze the USER'S RECENT POSTS to understand tone, depth, and formatting.
2. Use USER PROFILE CONTEXT to match seniority and domain language.
${topicInstruction}
3. Choose ONE insight that:
   - Appears in real-world large-scale systems
   - Is commonly misunderstood in interviews
   - Has a clear tradeoff (latency, cost, memory, compute, complexity)

==============================
MANDATORY POST STRUCTURE
==============================
Follow this structure EXACTLY:

1️⃣ HOOK (1–2 lines)
- Must trigger curiosity or mild controversy
- Should force "See more"

2️⃣ CONTEXT (2–3 lines)
- Briefly define the real problem at scale
- No generic definitions

3️⃣ CORE INSIGHT (MAIN BODY)
- Explain ONE mechanism deeply
- Explicitly answer:
  • Why this approach exists
  • Why the obvious alternative fails at scale
  - Use cause → effect reasoning

4️⃣ CONCRETE EXAMPLE
- Use numbered steps, a mini flow, or a short scenario
- Keep it tangible and practical

5️⃣ CLOSING INSIGHT
- A sharp takeaway that upgrades understanding
- Something the reader can recall in interviews

6️⃣ CTA
- Ask a technical question that invites discussion

==============================
STRICT RULES (NON-NEGOTIABLE)
==============================
- Do NOT dump components (no laundry lists).
- Do NOT explain the entire system.
- Depth over breadth.
- Assume the reader is an engineer.
- No fluff, no motivational filler.
- No buzzword stacking.

==============================
FORMATTING RULES
==============================
- **Bold** only key ideas or tradeoffs.
- _Italic_ only to highlight consequences or constraints.
- Max 1 emoji per section.
- Short paragraphs (1–2 lines).
- Bullet points ONLY for logic or flows.

==============================
LENGTH & VIRALITY CONSTRAINTS
==============================
- Max length: 1,400 characters INCLUDING hashtags.
- First 2 lines must hook immediately.
- Optimize for saves and thoughtful comments.

==============================
LANGUAGE
==============================
- English only
- Confident, precise, opinionated
- Clear technical reasoning

==============================
HASHTAGS
==============================
- Add 5–8 relevant technical hashtags at the end
- Examples: #SystemDesign #BackendEngineering #Scalability #HLD

==============================
CONTEXT INPUTS
==============================

${profileContext}

USER'S RECENT POSTS (STYLE REFERENCE ONLY):
${postsContext}

==============================
OUTPUT
==============================
Return ONLY the final LinkedIn post text.
`;
}


// Helper to send status updates to content script
function sendStatus(tabId, message) {
    if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: "status_update", message: message }).catch(() => { });
    }
}

// --- Image Helpers ---

async function generateTemplatedImage(apiKey, postText) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const prompt = `You are an AI that converts a LinkedIn system-design post into a short, punchy programmatic image overlay.

INPUT POST:
"${postText.substring(0, 1200)}"

AVAILABLE TEMPLATES:
- "floral_productivity_card": Best for deep, thoughtful, or high-value concepts. 

TASK:
1. Extract short, punchy phrases that fit into the following text zones for the selected template.
2. The "main_headline" should be the core insight (max 35 chars).
3. The "eyebrow_pill" should be a category or tag (max 15 chars).
4. The "top_left_tag" and "footer_left" should be branding or contextual info (max 20 chars).

OUTPUT FORMAT:
Return ONLY a valid JSON object. No markdown, no explanations.
Example:
{
  "template_id": "floral_productivity_card",
  "text_data": {
    "top_left_tag": "SYSTEM DESIGN",
    "eyebrow_pill": "ARCHITECTURE",
    "main_headline": "FANOUT ON WRITE",
    "footer_left": "LINKEDINVIBE"
  }
}
`;

    // 1. Get JSON from Gemini
    let extractRes;
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        extractRes = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to extract image template JSON from Gemini", e);
        throw new Error("Local AI failed to extract image metadata.");
    }

    // 2. Render Image via Backend
    const RENDER_URL = 'http://localhost:3000/api/render-image'; // Local fallback or user config ideal here

    try {
        const renderResponse = await fetch(RENDER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(extractRes)
        });

        const renderData = await renderResponse.json();
        if (!renderData.success) throw new Error(renderData.error || "Backend rendering failed");

        const base64Data = renderData.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        return base64Data;

    } catch (e) {
        console.error("Backend Image Render Failed", e);
        throw new Error("Failed to render image on backend.");
    }
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

// --- AI Helper Functions ---

// --- AI Helper Functions ---

async function analyzeFormWithGemini(apiKey, profile, formContext, modelName = "gemini-2.5-flash-lite", jobDescription = "") {
    if (!modelName) modelName = "gemini-2.5-flash-lite";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Detect if formContext is HTML-based (universal autofill) or structured JSON (LinkedIn modal)
    const isHtmlMode = formContext && typeof formContext === 'object' && formContext.html;

    let systemPrompt;

    if (isHtmlMode) {
        // UNIVERSAL AUTOFILL MODE: AI analyzes raw HTML
        systemPrompt = `
        You are an intelligent job application form-filling assistant.
        Your task is to analyze the HTML of a job application page and determine what fields to fill.

        CANDIDATE PROFILE:
        ${JSON.stringify(profile, null, 2)}

        ${formContext.jobDescription ? `JOB BEING APPLIED FOR:
        Title: ${formContext.jobTitle || 'N/A'}
        Company: ${formContext.company || 'N/A'}
        Description: ${formContext.jobDescription.substring(0, 2000)}
        ` : ''}

        PAGE HTML (sanitized form content):
        ${formContext.html.substring(0, 12000)}

        PAGE URL: ${formContext.url || 'N/A'}
        PAGE TYPE: ${formContext.pageType || 'unknown'}

        INSTRUCTIONS:
        1. Identify ALL fillable form fields (input, select, textarea) in the HTML.
        2. For each field, determine the best value from the CANDIDATE PROFILE.
        3. Use smart inference:
           - "First Name" → use profile firstName
           - "Email" → use profile email
           - "Years of Experience" → use profile experience
           - Select/dropdown fields → return the EXACT option text to select
           - Checkboxes (T&C, agreements) → set to true/agree
           - Radio buttons → return the best matching option text
           - Cover letter / "Why do you want this job?" → generate a brief personalized answer
           - If a field cannot be filled from profile → set value to null
        4. Do NOT fill password fields.
        5. For file upload fields (resume/CV), set value to "FILE_UPLOAD_REQUIRED".

        OUTPUT FORMAT (JSON ONLY, no markdown):
        {
            "fields": [
                { "selector": "CSS selector for the element", "label": "human-readable field label", "value": "value to fill", "confidence": 0.0-1.0 }
            ],
            "nextAction": "submit" | "next_page" | "need_help" | "unknown",
            "pageAssessment": "brief description of what this page is"
        }

        IMPORTANT: Return ONLY raw JSON. No markdown, no code blocks.
        `;
    } else {
        // LEGACY MODE: Structured form fields from LinkedIn modal
        systemPrompt = `
        You are an intelligent form-filling assistant. 
        Your task is to map a user's CANDIDATE PROFILE to a list of FORM FIELDS from a job application.

        CANDIDATE PROFILE:
        ${JSON.stringify(profile, null, 2)}

        JOB DESCRIPTION CONTEXT:
        ${jobDescription ? jobDescription.substring(0, 1000) : "N/A"}

        FORM FIELDS TO FILL (JSON):
        ${JSON.stringify(formContext, null, 2)}
        
        INSTRUCTIONS:
        1. For each item in "FORM FIELDS", determine the best value from "CANDIDATE PROFILE".
        2. Use smart inference:
           - If form asks "Years of Experience" (id: v_123) and profile has "5", map "v_123": "5".
           - If form asks "Why do you want this job?" and profile has generic "Additional Info", adapt it if possible or just use it.
           - If form asks "Gender" (Select) and profile says "Male", return "Male" (the exact text to select).
           - If form asks for something NOT in profile (e.g., "Are you a veteran?"), infer "No" if not stated, or leave blank/null if unsafe to guess.
           - If field is hidden or irrelevant, ignore it.
        
        OUTPUT FORMAT:
        Return ONLY a JSON object mapping Field IDs to Values.
        Example: { "vibe_0_123": "John Doe", "vibe_1_456": "5" }
        Do NOT include markdown formatting. Return RAW JSON.
        `;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Empty AI response");

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("AI Analysis Failed:", e);
        throw new Error("AI processing failed.");
    }
}

