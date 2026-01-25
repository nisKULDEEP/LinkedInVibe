console.log("LinkedIn Job Bot Loaded");

const JOB_BOT_STATE = {
    IDLE: 'idle',
    NAVIGATING: 'navigating',
    SCANNING: 'scanning',
    APPLYING: 'applying',
    COMPLETED: 'completed'
};

let currentState = JOB_BOT_STATE.IDLE;
let config = {};
let jobQueue = [];
let processedJobs = new Set();
let applicationCount = 0;

// --- UI Helper Functions ---
function initGenericUI() {
    let overlay = document.getElementById('linkedin-bot-status-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'linkedin-bot-status-overlay';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '20px';
        overlay.style.right = '20px';
        overlay.style.width = '300px';
        overlay.style.backgroundColor = '#fff';
        overlay.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        overlay.style.borderRadius = '8px';
        overlay.style.zIndex = '9999';
        overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        overlay.style.border = '1px solid #e0e0e0';
        overlay.style.overflow = 'hidden';

        overlay.innerHTML = `
            <div style="background: #0a66c2; color: white; padding: 10px 15px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                <span>🤖 LinkedIn Bot</span>
                <span id="bot-status-badge" style="background: rgba(255,255,255,0.2); font-size: 11px; padding: 2px 6px; border-radius: 4px;">IDLE</span>
            </div>
            <div style="padding: 15px;">
                <div id="bot-status-text" style="font-size: 14px; margin-bottom: 8px; color: #333;">Waiting to start...</div>
                <div style="font-size: 12px; color: #666; display: flex; justify-content: space-between;">
                    <span>Applications: <strong id="bot-stats-count">0</strong></span>
                    <span>State: <span id="bot-stats-state">Ready</span></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
}

function updateOverlay(statusText, state = null) {
    const textEl = document.getElementById('bot-status-text');
    const badgeEl = document.getElementById('bot-status-badge');
    const countEl = document.getElementById('bot-stats-count');
    const stateEl = document.getElementById('bot-stats-state');

    if (textEl) textEl.innerText = statusText;
    if (countEl) countEl.innerText = applicationCount;
    if (stateEl && state) stateEl.innerText = state;
    if (badgeEl && state) badgeEl.innerText = state.toUpperCase();
}

// --- Initialization ---
function initBot() {
    initGenericUI(); // Initialize UI immediately
    // All field keys to load
    const storageKeys = [
        'firstName', 'middleName', 'lastName',
        'email', 'phone', 'resumeLink', 'linkedinLink', 'portfolioLink',
        'gender', 'experience', 'disability', 'veteran', 'ethnicity', 'usCitizenship', 'requireVisa',
        'street', 'city', 'state', 'zipcode', 'country',
        'desiredSalary', 'currentCtc', 'currency', 'noticePeriodDays',
        'recentEmployer', 'linkedinHeadline', 'linkedinSummary', 'coverLetter', 'userInfoAll',
        'workStyle', 'jobType', 'experienceLevel', 'maxJobs',
        'companyBlacklist', 'titleBlacklist',
        'selectedJobTitles', 'autoApply', 'botActive'
    ];

    chrome.storage.local.get(['candidateProfile', 'botSettings', 'autoApply', 'botActive', 'dailyApplicationCount'], (result) => {
        if (result.candidateProfile) {
            config = { ...result.candidateProfile, ...result.botSettings };
            config.autoApply = result.autoApply || false;

            // Restore count
            applicationCount = result.dailyApplicationCount || 0;

            // Compute derived values
            const fn = config.firstName || '';
            const mn = config.middleName || '';
            const ln = config.lastName || '';
            if (!config.fullName) {
                config.fullName = mn ? `${fn} ${mn} ${ln}`.trim() : `${fn} ${ln}`.trim();
            }

            // Full address
            if (!config.fullAddress) {
                config.fullAddress = [config.street, config.city, config.state, config.zipcode, config.country]
                    .filter(Boolean).join(', ');
            }

            // Preferred roles
            config.preferredRoles = config.preferredRoles || [];

            console.log("🤖 Bot Config Loaded:", config);
            updateOverlay("Config loaded. Ready.", "Idle");

            // Check if we should auto-start
            if (result.botActive) {
                startWorkflow();
            }
        }
    });
}
initBot();

// Listen for start command
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_bot") {
        console.log("🚀 Bot Started via Popup");
        updateOverlay("Starting bot...", "Starting");
        chrome.storage.local.set({ botActive: true }, () => {
            startWorkflow();
        });
        sendResponse({ success: true });
    } else if (request.action === "stop_bot") {
        console.log("🛑 Bot Stopped");
        updateOverlay("Bot stopped by user.", "Stopped");
        chrome.storage.local.set({ botActive: false });
        currentState = JOB_BOT_STATE.IDLE;
        sendResponse({ success: true });
    }
});

async function startWorkflow() {
    // Refresh config to ensure we have latest settings (e.g. Auto-Apply toggle)
    try {
        const res = await chrome.storage.local.get(['candidateProfile']);
        if (res.candidateProfile) {
            config = res.candidateProfile;
            console.log("🤖 Bot Config Refreshed on Start:", config.autoApply ? "Auto-Apply ON" : "Auto-Apply OFF");
        }
    } catch (e) { console.error("Config refresh failed", e); }

    if (currentState !== JOB_BOT_STATE.IDLE) return;
    updateOverlay("Initializing workflow...", "Active");

    // Workflow 1: Navigation
    // Check if we are on the jobs search page with correct parameters
    const isJobSearch = window.location.href.includes('/jobs/search');
    const hasKeywords = window.location.href.includes('keywords=');
    const hasEasyApplyFilter = window.location.href.includes('f_AL=true');

    // Determine target location (City + Country, or Country, or Default)
    let searchLocation = config.location;
    if (!searchLocation) {
        if (config.city && config.country) searchLocation = `${config.city}, ${config.country}`;
        else if (config.country) searchLocation = config.country;
        else searchLocation = "United States";
    }

    // Determine keywords (Join all preferred roles with OR)
    let roles = config.preferredRoles && config.preferredRoles.length > 0 ? config.preferredRoles : ["Software Engineer"];

    // Clean up roles (remove "(General)" which is internal, but keep others) and join with OR
    const keywords = roles
        .map(r => r.replace('(General)', '').trim())
        .join(' OR ');

    // Force navigation if not on search page OR if we have keywords but URL doesn't (empty search filter) OR if Easy Apply filter is missing
    if (!isJobSearch || (keywords && !hasKeywords) || !hasEasyApplyFilter) {
        currentState = JOB_BOT_STATE.NAVIGATING;
        const msg = `Navigating to Jobs Page...`;
        console.log(`📍 ${msg}`);
        updateOverlay(msg, "Navigating");

        const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(searchLocation)}&f_AL=true`;
        window.location.href = url;
        return; // Will reload on new page
    }

    // Workflow 2: Scanning & Processing
    currentState = JOB_BOT_STATE.SCANNING;
    console.log("👀 Scanning for jobs...");
    updateOverlay("Scanning for jobs...", "Scanning");
    await processJobList();
}

// --- Workflow 2: Job List Processing ---
async function processJobList() {
    console.log("🔍 Starting job list processing...");
    console.log("📍 Current URL:", window.location.href);

    // Try multiple selectors (LinkedIn changes these frequently)
    const selectors = [
        '.jobs-search-results-list__list-item',
        '.scaffold-layout__list-item',
        '.job-card-container',
        '.jobs-search__job-card',
        '[data-job-id]',
        'li.jobs-search-results__list-item'
    ];

    let jobCards = [];
    let usedSelector = '';

    // Retry Loop: Wait for page to fully render (BigPipe lazy loading)
    let retries = 0;
    const maxRetries = 15;

    updateOverlay("Waiting for jobs to load...", "Scanning");

    while (retries < maxRetries) {
        for (const selector of selectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                jobCards = found;
                usedSelector = selector;
                break;
            }
        }

        if (jobCards.length > 0) break;

        console.log(`   ⏳ No jobs found yet... waiting for page load (${retries + 1}/${maxRetries})`);
        updateOverlay(`Detailed scan (${retries}/${maxRetries})...`, "Scanning");
        await wait(1000);
        retries++;
    }

    if (jobCards.length === 0) {
        console.log("⚠️ No job cards found with any selector!");
        updateOverlay("No jobs found on this page.", "Idle");
        return;
    }

    console.log(`✅ Found ${jobCards.length} job cards using selector: "${usedSelector}"`);
    updateOverlay(`Found ${jobCards.length} jobs. Processing...`, "Processing");


    for (const card of jobCards) {
        if (applicationCount >= (config.maxJobs || 10)) {
            console.log("✅ Max jobs reached. Stopping.");
            updateOverlay("Max jobs limit reached.", "Completed");
            chrome.storage.local.set({ botActive: false });
            return;
        }

        // Check active state
        const isActive = await new Promise(resolve => chrome.storage.local.get(['botActive'], r => resolve(r.botActive)));
        if (!isActive) {
            updateOverlay("Bot paused.", "Paused");
            return;
        }

        // Extract ID (Robust)
        let jobId = card.getAttribute('data-job-id');
        if (!jobId) jobId = card.getAttribute('data-occludable-job-id');
        if (!jobId) {
            const link = card.querySelector('a');
            if (link && link.href.includes('/jobs/view/')) {
                const match = link.href.match(/view\/(\d+)/);
                if (match) jobId = match[1];
            }
        }

        console.log(`\n📋 Processing job card: ${jobId || 'no-id'}`);
        // updateOverlay(`Checking job ${jobId || '...'}`, "Processing");

        if (jobId && processedJobs.has(jobId)) {
            console.log(`   ⏭️  Already processed, skipping...`);
            continue;
        }

        // Safety: Check if card is still valid (DOM might have updated)
        if (!card.isConnected) {
            console.log("   ⚠️ Card detached from DOM (page updated?). Re-scanning...");
            break; // Break loop to trigger re-scan
        }

        // Basic Validation (Skip Applied)
        const footer = card.querySelector('.job-card-container__footer-job-state');
        if (footer && footer.innerText.includes('Applied')) {
            console.log(`   ✓ Already Applied - skipping`);
            continue;
        }

        // Click and Wait - Enhanced Navigation
        console.log(`    Clicking card to load details...`);
        // Find the actual clickable target (usually the title link)
        const clickable = card.querySelector('.job-card-list__title') ||
            card.querySelector('a.job-card-container__link') ||
            card;

        clickable.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(500); // Wait for scroll
        clickable.click();

        // Wait for URL or Details update
        // (LinkedIn usually updates the URL to /jobs/view/123 or updates the currentJobId param)
        await wait(2000); // Give right pane time to load

        // Check Blacklist (Enhanced)
        let listTitle = card.querySelector('.job-card-list__title')?.innerText;
        if (!listTitle) listTitle = card.querySelector('.artdeco-entity-lockup__title')?.innerText;
        if (!listTitle) listTitle = card.querySelector('strong')?.innerText;
        listTitle = listTitle || "";

        let listCompany = card.querySelector('.job-card-container__primary-description')?.innerText;
        if (!listCompany) listCompany = card.querySelector('.artdeco-entity-lockup__subtitle')?.innerText;
        if (!listCompany) listCompany = card.querySelector('.job-card-container__company-name')?.innerText; // Added this line
        listCompany = listCompany || "";

        console.log(`   📝 Title: ${listTitle || '(not found)'}`);
        console.log(`   🏢 Company: ${listCompany || '(not found)'}`);

        updateOverlay(`Inspecting: ${listCompany}`, "Processing");

        // Load Blacklist from config
        const companyBlacklist = config.companyBlacklist ? config.companyBlacklist.split(',').map(s => s.trim().toLowerCase()) : [];
        const titleBlacklist = config.titleBlacklist ? config.titleBlacklist.split(',').map(s => s.trim().toLowerCase()) : [];

        // Check Company
        if (companyBlacklist.length > 0 && companyBlacklist.some(b => listCompany.toLowerCase().includes(b))) {
            console.log(`   ⛔ Blacklisted company - skipping`);
            updateOverlay(`Skipping (Blacklisted Co): ${listCompany}`, "Skipping");
            continue;
        }

        // Check Title
        if (titleBlacklist.length > 0 && titleBlacklist.some(b => listTitle.toLowerCase().includes(b))) {
            console.log(`   ⛔ Blacklisted title - skipping`);
            updateOverlay(`Skipping (Blacklisted Title): ${listTitle}`, "Skipping");
            continue;
        }

        console.log(`   ⏳ Waiting for job details to load...`);
        await wait(2000); // Wait for details to load

        // Check for Easy Apply button
        console.log(`   🔍 Looking for Easy Apply button...`);

        // Robust selector strategy
        const applySelectors = [
            '.jobs-apply-button',
            '[data-live-test-job-apply-button]',
            'button[aria-label*="Easy Apply"]',
            '.jobs-apply-button--top-card button'
        ];

        let easyApplyBtn = null;
        let easyApplySelectorUsed = '';
        const startTime = Date.now();

        // Custom wait loop for multiple selectors
        while (Date.now() - startTime < 5000 && !easyApplyBtn) {
            for (const sel of applySelectors) {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) { // Check visibility
                    easyApplyBtn = el;
                    easyApplySelectorUsed = sel;
                    console.log(`      Found button using selector: ${sel}`);
                    break;
                }
            }
            if (!easyApplyBtn) await wait(500);
        }

        if (easyApplyBtn) {
            const btnText = easyApplyBtn.innerText || easyApplyBtn.textContent || '';
            const ariaLabel = easyApplyBtn.getAttribute('aria-label') || '';
            console.log(`   🔘 Found button with text: "${btnText}"`);

            if (btnText.includes('Easy Apply') || ariaLabel.includes('Easy Apply')) {
                console.log(`   ✅ Easy Apply confirmed! Starting application...`);
                updateOverlay(`Applying to ${listCompany}...`, "Applying");

                // --- ROBUST CLICK STRATEGY ---
                let modalOpen = false;
                for (let i = 0; i < 3; i++) {
                    // Refetch button just in case
                    if (i > 0) {
                        console.log("   ⚠️ Click retry...");
                        easyApplyBtn = document.querySelector(easyApplySelectorUsed);
                        if (!easyApplyBtn) break;
                    }

                    easyApplyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(300);
                    easyApplyBtn.click();
                    await wait(1500);

                    // Check if modal appeared
                    if (document.querySelector('.jobs-easy-apply-content') || document.querySelector('div[role="dialog"]')) {
                        modalOpen = true;
                        break;
                    }
                }

                if (!modalOpen) {
                    console.log("   ❌ Failed to open modal after multiple clicks.");
                    updateOverlay("Failed to open modal", "Failed");
                    continue; // Skip to next job
                }

                // Workflow 3: Application Loop
                const success = await handleApplicationModal();
                if (success) {
                    processedJobs.add(jobId);
                    applicationCount++;

                    // Persist count
                    chrome.storage.local.set({ dailyApplicationCount: applicationCount });

                    console.log(`   🎉 Application ${applicationCount} completed!`);
                    updateOverlay(`Applied! Total: ${applicationCount}`, "Success");
                    // Update stats (visual feedback helper)
                    chrome.runtime.sendMessage({ action: "update_bot_stats", count: applicationCount });
                } else {
                    console.log(`   ⚠️  Application failed or incomplete`);
                    updateOverlay("Application incomplete/failed", "Failed");
                }
            } else {
                console.log(`   ❌ Button found but not Easy Apply (text: "${btnText}")`);
                updateOverlay("Skipped (External Apply)", "Skipping");
            }
        } else {
            console.log(`   ❌ No Easy Apply button found`);
            updateOverlay("Skipped (No Apply Button)", "Skipping");
        }

        console.log(`   ⏸️  Cooling down before next job...`);
        await wait(2000); // Cool down between jobs
    }

    // Pagination (Next Page)
    console.log("🏁 Page scan complete. Checking for next page...");
    updateOverlay("Checking for next page...", "Pagination");
    await handlePagination();
}

// --- Workflow ~2.5: Pagination ---
async function handlePagination() {
    // 1. Find active page
    const activeBtn = document.querySelector('button[aria-current="page"]');
    if (!activeBtn) {
        console.log("⚠️ Could not find active pagination button.");
        updateOverlay("Pagination failed (No active page)", "Done");
        return;
    }

    const currentPage = parseInt(activeBtn.innerText.trim());
    const nextPage = currentPage + 1;
    console.log(`   📄 Current Page: ${currentPage}. Looking for Page ${nextPage}...`);

    // 2. Find Next Page Button
    // Try explicit "Page X" button first
    let nextBtn = document.querySelector(`button[aria-label="Page ${nextPage}"]`);

    // Fallback: Try "Next" button (sometimes usually an icon button with aria-label="Next" or similar)
    if (!nextBtn) {
        nextBtn = document.querySelector('button[aria-label="Next"]');
    }

    // 3. Click and Loop
    if (nextBtn) {
        console.log(`   ➡️ Found Next Page button. Clicking...`);
        updateOverlay(`Switching to Page ${nextPage}...`, "Navigating");
        nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(500);
        nextBtn.click();

        // Wait for reload
        await wait(3000); // Give it time to fetch new results

        // Recursive call (Loop)
        await processJobList();
    } else {
        console.log("   ❌ No next page found. We might be at the end.");
        updateOverlay("No more pages.", "Completed");
        chrome.storage.local.set({ botActive: false }); // Stop bot safely
    }
}

// --- Workflow 3: Application Modal Handling ---
async function handleApplicationModal() {
    console.log("\n📝 Starting application modal flow...");
    currentState = JOB_BOT_STATE.APPLYING;
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops

    while (attempts < maxAttempts) {
        attempts++;

        // Fast Stop Check
        const isActive = await checkBotActive();
        if (!isActive) {
            console.log("🛑 Bot stopped by user (during application).");
            return false;
        }

        console.log(`   🔄 Modal attempt ${attempts}/${maxAttempts}...`);
        await wait(1000); // Pace ourselves

        // Check for modal
        let modal = document.querySelector('.jobs-easy-apply-content');
        if (!modal) modal = document.querySelector('.jobs-easy-apply-modal');
        if (!modal) modal = document.querySelector('div[role="dialog"].artdeco-modal');
        if (!modal) modal = document.querySelector('div[role="dialog"]');

        if (!modal) {
            console.log(`   ⚠️  Modal not found yet...`);
            if (attempts >= maxAttempts) {
                console.log("   ❌ Modal never appeared. Aborting.");
                return false;
            }
            continue; // Retry loop
        }

        // 1. Fill Form (Always try to fill current page first)
        console.log("   ✍️ Filling current page...");
        await fillCurrentPage(modal);
        await wait(1000); // Wait for validation/UI updates

        // 2. Check Buttons
        // Check for Submit
        let submitBtn = modal.querySelector('button[aria-label="Submit application"]');
        if (!submitBtn) submitBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Submit application'));
        if (submitBtn) {
            console.log("   ✅ Found Submit button!");
            if (config.autoApply) {
                console.log("   🚀 Auto-apply enabled - submitting...");
                submitBtn.click();
                await wait(2000); // Wait for success screen
                // Close success modal
                const dismissBtn = document.querySelector('button[aria-label="Dismiss"]');
                if (dismissBtn) {
                    console.log("   ✅ Application submitted! Dismissing success modal...");
                    dismissBtn.click();
                }
                return true;
            } else {
                console.log("   ⏸️ Auto-apply disabled - Waiting for MANUAL submit...");

                // Poll until modal closes (User clicked Submit/Dismiss)
                let waited = 0;
                while (waited < 600) { // Wait up to 10 mins
                    await wait(1000);
                    waited++;

                    const openModal = document.querySelector('.jobs-easy-apply-content') || document.querySelector('div[role="dialog"]');
                    if (!openModal) {
                        console.log("   ✅ Modal closed (Manual action detected). Moving to next job...");
                        return true;
                    }

                    // Allow manual stop
                    const isActive = await new Promise(r => chrome.storage.local.get(['botActive'], res => r(res.botActive)));
                    if (!isActive) return false;
                }

                console.log("   ⚠️ Timed out waiting for manual submit.");
                return false;
            }
        }

        // Check for Review
        let reviewBtn = modal.querySelector('button[aria-label="Review your application"]');
        if (!reviewBtn) reviewBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Review'));
        if (reviewBtn) {
            console.log("   👀 Review button found - clicking to review...");
            reviewBtn.click();
            continue;
        }

        // Check for Next
        let nextBtn = modal.querySelector('button[aria-label="Continue to next step"]');
        if (!nextBtn) nextBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Next'));
        if (nextBtn) {
            console.log("   📄 Next button found - clicking...");
            // Form already filled at start of loop

            console.log("   ➡️ Clicking Next to continue...");
            nextBtn.click();
            continue;
        }


        // Check for Errors
        const error = modal.querySelector('.artdeco-inline-feedback--error');
        if (error) {
            console.log("   ⚠️  Validation Error detected!");
        }

        console.log("   ⚠️  No navigation buttons found or detected stuck state. Waiting...");
        attempts++;

        // INTERVENTION MODE: If stuck, ask for help instead of quitting
        if (attempts >= maxAttempts) {
            console.log("   ❌ Stuck! Entering Intervention Mode...");

            // Enable Learning
            attachLearningListeners(modal);

            // Notify
            chrome.runtime.sendMessage({
                action: "notify_user",
                title: "Bot Stuck ⚠️",
                message: "Please help - validation error or missing button!"
            });

            console.log("   ⏳ Waiting for user intervention (10 min timeout)...");
            let waited = 0;
            while (waited < 600) {
                await wait(1000);
                waited++;

                // If Modal Closed -> User finished it
                const stillOpen = document.querySelector('.jobs-easy-apply-content') || document.querySelector('div[role="dialog"]');
                if (!stillOpen) {
                    console.log("   ✅ Modal closed! Resuming...");
                    return true;
                }

                // If User fixed it and Buttons are clickable again, we can try resuming auto-pilot
                // But simplest is: User clicks Next/Submit manually.
                // If User clicks Next -> Page changes -> Our loop continues? 
                // We are in 'while' loop here.
                // We rely on user action. 

                // Allow Stop
                const isActive = await new Promise(r => chrome.storage.local.get(['botActive'], res => r(res.botActive)));
                if (!isActive) return false;
            }

            if (waited >= 600) return false; // Timed out
        }
    }

    return false;
}

// Reuse logic from autofill.js but adapted for the modal context
// --- Advanced Heuristics (Ported from Python) ---
// Reuse logic from autofill.js but adapted for the modal context
// --- Advanced Heuristics (Ported from Python) ---
async function fillCurrentPage(modal) {
    console.log("✍️ Filling current page (Enhanced)...");

    // 1. Get Candidate Data & Learned Questions
    if (!config) {
        console.warn("Config not loaded!");
        return;
    }

    // Load learned questions
    const learned = await new Promise(r => chrome.storage.local.get(['learnedQuestions'], res => r(res.learnedQuestions || {})));

    // 2. Identify elements strategy
    const containers = Array.from(modal.querySelectorAll('div[data-test-form-element]'));
    const legacyInputs = Array.from(modal.querySelectorAll('input, select, textarea, fieldset'));

    // Choose strategy
    const elementsToProcess = containers.length > 0 ? containers : legacyInputs;
    const isContainerMode = containers.length > 0;

    console.log(`   🔎 Found ${containers.length} question containers. Mode: ${isContainerMode ? 'Precise (Container)' : 'Legacy (Input)'}`);

    // Extended mappings - maps config key to label keywords
    const fieldMappings = {
        // Name fields
        'firstName': ['first name', 'given name', 'forename'],
        'middleName': ['middle name', 'middle initial'],
        'lastName': ['last name', 'surname', 'family name'],
        'fullName': ['full name', 'signature', 'legal name', 'your name', 'name'],
        // Contact
        'email': ['email', 'e-mail'],
        'phone': ['phone', 'mobile', 'cell', 'contact number', 'telephone'],
        'linkedinLink': ['linkedin', 'profile url', 'linkedin url'],
        'portfolioLink': ['portfolio', 'website', 'github', 'blog', 'personal site'],
        // Address
        'street': ['street', 'address line', 'street address'],
        'city': ['city', 'town', 'municipality'],
        'state': ['state', 'province', 'region'],
        'zipcode': ['zip', 'postal', 'pincode', 'zip code'],
        'country': ['country', 'nation'],
        'fullAddress': ['full address', 'mailing address', 'current address'],
        // Experience
        'experience': ['experience', 'years of experience', 'total experience'],
        'recentEmployer': ['current employer', 'recent employer', 'company name', 'employer'],
        // Compensation
        'noticePeriodDays': ['notice period', 'start date', 'joining date', 'availability'],
        'currentCtc': ['current ctc', 'current salary', 'current compensation', 'present salary'],
        'desiredSalary': ['expected ctc', 'expected salary', 'desired salary', 'salary expectation'],
        // Demographics
        'gender': ['gender', 'sex'],
        'ethnicity': ['ethnicity', 'race', 'ethnic background'],
        'disability': ['disability', 'handicapped', 'physical limitation'],
        'veteran': ['veteran', 'military service', 'protected veteran'],
        'usCitizenship': ['citizenship', 'work authorization', 'employment eligibility'],
        'requireVisa': ['visa', 'sponsorship', 'work permit'],
        // Work Preferences
        'workStyle': ['work style', 'work mode', 'remote', 'hybrid', 'on-site'],
        'jobType': ['job type', 'employment type', 'full-time', 'contract'],
        'experienceLevel': ['seniority', 'experience level', 'career level'],
        // Professional Content
        'linkedinHeadline': ['headline', 'professional title', 'tagline'],
        'linkedinSummary': ['summary', 'about yourself', 'profile summary', 'professional summary'],
        'coverLetter': ['cover letter', 'motivation letter', 'application letter']
    };

    let aiPendingQuestions = [];

    for (const el of elementsToProcess) {
        // Resolve Target Input and Label based on Strategy
        let input = el;
        let label = "";

        if (isContainerMode) {
            // Find input inside container
            const fieldset = el.querySelector('fieldset');
            const select = el.querySelector('select');
            const checkbox = el.querySelector('input[type="checkbox"]');
            const text = el.querySelector('input[type="text"], textarea, input:not([type])'); // input:not([type]) handles some defaults

            input = fieldset || select || checkbox || text;
            if (!input) continue; // No actionable input

            // Get Label from Container
            const labEl = el.querySelector('label') || el.querySelector('.fb-form-element-label');
            label = labEl ? labEl.innerText : el.innerText.split('\n')[0];
        } else {
            // Legacy Mode
            input = el;
            label = getLabelText(input);
        }

        label = label.toLowerCase();

        // --- LEARNED CHECK ---
        if (learned && learned[label]) {
            console.log(`   🧠 Applying learned answer for "${label}": ${learned[label]}`);
            await setInputValue(input, learned[label]);
            continue;
        }

        // Skip hidden/filled
        if (!input || input.type === 'hidden' || input.style.display === 'none') continue;
        if (input.tagName === 'FIELDSET') {
            await handleRadioGroup(input, config, fieldMappings);
            continue;
        }
        if (input.tagName !== 'SELECT' && input.value && input.value.length > 0 && input.type !== 'checkbox') continue;
        if (input.type === 'checkbox' && input.checked) continue;

        let filled = false;

        // --- Checkbox Heuristic (T&C) ---
        if (input.type === 'checkbox') {
            if (label.includes('agree') || label.includes('terms') || label.includes('policy') || label.includes('confirm') || label.includes('acknowledge')) {
                console.log(`   ✅ Auto-agreeing T&C: "${label.substring(0, 30)}..."`);
                input.click();
                filled = true;
            }
            // Could also check against config if user has boolean prefs
        }

        // --- Heuristic Matching ---
        if (!filled) {
            for (const [key, keywords] of Object.entries(fieldMappings)) {
                if (config[key] && keywords.some(k => label.includes(k))) {
                    console.log(`   🎯 Matched "${label.substring(0, 20)}..." to [${key}]`);
                    await setInputValue(input, config[key]);
                    filled = true;
                    break;
                }
            }
        }

        // --- Specific "Yes/No" Logic for Common Questions ---
        if (!filled && (input.tagName === 'SELECT' || input.type === 'radio' || input.tagName === 'FIELDSET')) {
            if (label.includes('sponsorship') || label.includes('visa')) {
                await setInputValue(input, 'No');
                filled = true;
            } else if (label.includes('authorized') || label.includes('legally')) {
                await setInputValue(input, 'Yes');
                filled = true;
            }
        }

        if (filled) continue;

        // --- Resume ---
        if (input.type === 'file' && (label.includes('resume') || label.includes('cv'))) {
            console.log("   📂 Resume upload needed (Manual for now)");
            continue;
        }

        // --- AI Fallback ---
        if (!filled && (input.type === 'text' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT')) {
            const questionData = {
                id: input.id || Math.random().toString(36),
                label: label,
                type: input.type || input.tagName.toLowerCase(),
                options: input.tagName === 'SELECT' ? Array.from(input.options).map(o => o.text) : []
            };
            aiPendingQuestions.push({ element: input, data: questionData });
        }
    }

    // --- Process AI Questions ---
    if (aiPendingQuestions.length > 0) {
        console.log(`🧠 Asking AI for ${aiPendingQuestions.length} questions...`);
        const jobDescription = document.querySelector('.jobs-description__content') ?
            document.querySelector('.jobs-description__content').innerText.substring(0, 3000) : "N/A";

        try {
            const response = await chrome.runtime.sendMessage({
                action: "bot_ask_ai",
                profile: config,
                questions: aiPendingQuestions.map(q => q.data),
                jobDescription: jobDescription
            });

            if (response && response.answers) {
                for (const item of aiPendingQuestions) {
                    const answer = response.answers[item.data.id];
                    if (answer) {
                        await setInputValue(item.element, answer);
                    }
                }
            }
        } catch (e) {
            console.error("AI Request Failed", e);
        }
    }

    // --- Capture Unanswered Questions ---
    const actuallyUnanswered = [];
    for (const item of aiPendingQuestions) {
        const el = item.element;
        // Check if still empty
        let isFilled = false;
        if (el.tagName === 'SELECT') isFilled = el.selectedIndex > 0;
        else if (el.type === 'checkbox' || el.type === 'radio') isFilled = el.checked;
        else isFilled = el.value && el.value.trim().length > 0;

        if (!isFilled) {
            actuallyUnanswered.push({
                label: item.data.label,
                type: item.data.type,
                url: window.location.href,
                timestamp: Date.now()
            });
        }
    }

    if (actuallyUnanswered.length > 0) {
        saveUnansweredQuestions(actuallyUnanswered);
    }
}

// Helper to save unanswered questions
function saveUnansweredQuestions(newQuestions) {
    chrome.storage.local.get(['unansweredQuestions'], (result) => {
        let existing = result.unansweredQuestions || [];
        let addedCount = 0;

        for (const q of newQuestions) {
            // Deduplicate by label (simple check)
            if (!existing.some(e => e.label === q.label)) {
                existing.push(q);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            console.log(`💾 Saved ${addedCount} new unanswered questions to storage.`);
            chrome.storage.local.set({ unansweredQuestions: existing });
        }
    });
}

// Handler for Radio Groups (Fieldsets)
async function handleRadioGroup(fieldset, config, mappings) {
    const legend = fieldset.querySelector('legend');
    const label = legend ? legend.innerText.toLowerCase() : "";

    // Find matching config key
    let answer = null;
    for (const [key, keywords] of Object.entries(mappings)) {
        if (config[key] && keywords.some(k => label.includes(k))) {
            answer = config[key];
            break;
        }
    }

    // Fallbacks
    if (!answer) {
        if (label.includes('sponsorship') || label.includes('visa')) answer = 'No';
        if (label.includes('authorized') || label.includes('legally')) answer = 'Yes';
    }

    if (answer) {
        const radios = Array.from(fieldset.querySelectorAll('input[type="radio"]'));
        // Find best radio match
        // 1. Exact match override for boolean
        if (answer === 'Yes' || answer === 'No') {
            const match = radios.find(r => getLabelText(r).toLowerCase().includes(answer.toLowerCase()));
            if (match) { match.click(); return; }
        }

        // 2. Value/Label fuzzy match
        const checkMatch = (val, label) => label.includes(String(val).toLowerCase()) || String(val).toLowerCase().includes(label);

        for (const radio of radios) {
            const rLabel = getLabelText(radio).toLowerCase();

            if (Array.isArray(answer)) {
                if (answer.some(a => checkMatch(a, rLabel))) {
                    radio.click();
                    return;
                }
            } else {
                if (checkMatch(answer, rLabel)) {
                    radio.click();
                    return;
                }
            }
        }
    }
}

// --- Helpers for Dom Manipulation ---
function getLabelText(element) {
    let text = "";
    const id = element.id;
    if (id) {
        const lab = document.querySelector(`label[for="${id}"]`);
        if (lab) text += lab.innerText;
    }
    if (element.getAttribute('aria-label')) text += " " + element.getAttribute('aria-label');

    // Parent label or fieldset legend
    const parent = element.closest('label') || element.closest('fieldset');
    if (parent) text += " " + parent.innerText;

    return text.trim();
}

function getRadioOptions(input) {
    // Attempt to find siblings with same name
    if (!input.name) return [];
    const sibs = document.querySelectorAll(`input[name="${input.name}"]`);
    return Array.from(sibs).map(s => getLabelText(s));
}

async function setInputValue(input, value) {
    if (!value) return;

    const checkMatch = (text, val) => {
        const t = String(text).toLowerCase();
        if (Array.isArray(val)) {
            return val.some(v => t.includes(String(v).toLowerCase()) || String(v).toLowerCase().includes(t));
        }
        const v = String(val).toLowerCase();
        return t.includes(v) || v.includes(t);
    };

    // Select
    if (input.tagName === 'SELECT') {
        const opts = Array.from(input.options);
        if (input.multiple && Array.isArray(value)) {
            let found = false;
            for (const opt of opts) {
                if (checkMatch(opt.text, value) || checkMatch(opt.value, value)) {
                    opt.selected = true;
                    found = true;
                }
            }
        } else {
            const idx = opts.findIndex(o => checkMatch(o.text, value) || checkMatch(o.value, value));
            if (idx >= 0) {
                input.selectedIndex = idx;
            } else {
                // Fallback
                if (opts.length > 1) input.selectedIndex = 1;
            }
        }
        // Force event dispatch for React/Validation
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    // Radio
    else if (input.type === 'radio') {
        if (input.name) {
            const radios = document.querySelectorAll(`input[name="${input.name}"]`);
            for (const r of radios) {
                if (checkMatch(getLabelText(r), value)) {
                    if (!r.checked) r.click();
                    break;
                }
            }
        }
    }
    // Checkbox
    else if (input.type === 'checkbox') {
        const label = getLabelText(input);
        if (checkMatch(label, value) || checkMatch(input.value, value)) {
            if (!input.checked) input.click();
        }
    }
    // Text / Number
    else {
        let finalValue = Array.isArray(value) ? value.join(', ') : value;

        // Numeric Sanitization: Handle "whole number" requirements
        // If input type is number OR label suggests years/experience, floor the value
        const isNumericField = input.type === 'number' ||
            getLabelText(input).toLowerCase().match(/years|experience|notice|duration|age/);

        if (isNumericField) {
            // Extract number from string (e.g. "5.5 years" -> 5.5)
            const match = String(finalValue).match(/(\d+(\.\d+)?)/);
            if (match) {
                const num = parseFloat(match[0]);
                if (!isNaN(num) && num % 1 !== 0) {
                    console.log(`   🔢 Flooring decimal value "${finalValue}" -> "${Math.floor(num)}"`);
                    finalValue = Math.floor(num);
                }
            }
        }

        input.value = finalValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await wait(200);
}


// --- Helpers ---
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkBotActive() {
    return new Promise(resolve => {
        chrome.storage.local.get(['botActive'], (result) => {
            resolve(result.botActive || false);
        });
    });
}

async function waitForElement(selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);
        if (el) return el;
        await wait(500);
    }
    return null;
}

// --- Interactive Learning Helpers ---
let sessionLearned = {}; // Temporary storage for current page

function attachLearningListeners(modal) {
    console.log("👀 Watching for user input to learn...");
    sessionLearned = {}; // Reset

    const inputs = modal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Remove old listeners to avoid dupes? (Hard to remove anon funcs, but okay for intervention)
        input.addEventListener('change', (e) => {
            const label = getLabelText(e.target);
            const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

            if (label && val) {
                console.log(`   🧠 Learned: "${label}" = "${val}"`);
                sessionLearned[label] = {
                    label: label,
                    value: val,
                    type: e.target.type || e.target.tagName.toLowerCase(),
                    timestamp: Date.now()
                };
            }
        });
    });

    // Listen for Next/Submit to persist learning
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // If navigating away, save what we learned
            saveRescuedAnswers();
        });
    });
}

function saveRescuedAnswers() {
    const newAnswers = Object.values(sessionLearned);
    if (newAnswers.length === 0) return;

    chrome.storage.local.get(['learnedQuestions'], (result) => {
        let learned = result.learnedQuestions || {};
        let count = 0;

        newAnswers.forEach(a => {
            learned[a.label] = a.value; // Simple KV map: Label -> Value
            count++;
        });

        chrome.storage.local.set({ learnedQuestions: learned }, () => {
            console.log(`💾 Persisted ${count} learned answers for future use!`);
        });
    });
}
