
// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.local.get(['candidateProfile', 'botSettings'], (result) => {
        const profile = result.candidateProfile || {};
        const settings = result.botSettings || {};

        // Personal Info
        setInput('firstName', profile.firstName);
        setInput('lastName', profile.lastName);
        setInput('email', profile.email);
        setInput('phone', profile.phone);
        setInput('city', profile.city); // Used as general address string often

        // Links
        setInput('linkedinLink', profile.linkedinLink);
        setInput('portfolioLink', profile.portfolioLink);
        setInput('githubLink', profile.githubLink);

        // Resume (Visual only)
        if (profile.resumeBase64) {
            document.getElementById('resumeFileName').textContent = "✅ Resume Saved (PDF)";
            document.getElementById('resumeFileName').style.color = "green";
            document.getElementById('resumeBase64').value = profile.resumeBase64;
        }

        // Job Preferences
        setInput('preferredRoles', (profile.preferredRoles || []).join(', '));
        setInput('experience', profile.experience);
        setInput('desiredSalary', profile.desiredSalary);
        setInput('noticePeriodDays', profile.noticePeriodDays);
        setInput('requireVisa', profile.requireVisa || 'No');

        // Bot Settings
        setInput('location', settings.location);
        setInput('maxJobs', settings.maxJobs || 10);
        setInput('companyBlacklist', (settings.companyBlacklist || []).join(', '));
        document.getElementById('autoApply').checked = settings.autoApply || false;
    });
}

function setInput(id, value) {
    if (value === undefined || value === null) return;
    const el = document.getElementById(id);
    if (el) el.value = value;
}

// Handle File Upload
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File size must be under 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const base64 = event.target.result.split(',')[1]; // Remove data:application/pdf;base64, prefix if wanted, or keep it. 
        // job_bot.js logic might expect raw base64 or data uri. 
        // Extension's attachImageToPost uses `atob` which expects raw base64. 
        // background.js:402 `atob(base64Data)`.
        // So we should store RAW base64.

        document.getElementById('resumeBase64').value = base64;
        document.getElementById('resumeFileName').textContent = `📄 ${file.name} (Ready to Save)`;
        document.getElementById('resumeFileName').style.color = "#0a66c2";
    };
    reader.readAsDataURL(file);
}

// Save options to chrome.storage
function saveOptions(e) {
    e.preventDefault();
    const status = document.getElementById('saveStatus');
    status.textContent = "Saving...";
    status.style.color = "#555";

    const formData = new FormData(e.target);
    const profile = {};
    const settings = {};

    // Helper to get text
    const getVal = (name) => formData.get(name).trim();

    // Map Profile
    profile.firstName = getVal('firstName');
    profile.lastName = getVal('lastName');
    profile.fullName = `${profile.firstName} ${profile.lastName}`;
    profile.email = getVal('email');
    profile.phone = getVal('phone');
    profile.city = getVal('city'); // Using city as address field

    profile.linkedinLink = getVal('linkedinLink');
    profile.portfolioLink = getVal('portfolioLink');
    profile.githubLink = getVal('githubLink');

    profile.resumeBase64 = document.getElementById('resumeBase64').value; // Hidden input

    // Arrays
    profile.preferredRoles = getVal('preferredRoles').split(',').map(s => s.trim()).filter(Boolean);

    // Numbers
    profile.experience = getVal('experience');
    profile.desiredSalary = getVal('desiredSalary');
    profile.noticePeriodDays = getVal('noticePeriodDays');
    profile.requireVisa = getVal('requireVisa');

    // Bot Settings
    settings.location = getVal('location');
    settings.maxJobs = parseInt(getVal('maxJobs')) || 10;
    settings.companyBlacklist = getVal('companyBlacklist').split(',').map(s => s.trim()).filter(Boolean);
    settings.autoApply = document.getElementById('autoApply').checked;

    chrome.storage.local.set({
        candidateProfile: profile,
        botSettings: settings
    }, () => {
        status.textContent = "✅ Settings Saved!";
        status.style.color = "green";
        setTimeout(() => {
            status.textContent = "";
        }, 3000);
    });
}
