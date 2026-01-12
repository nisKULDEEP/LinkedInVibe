// dashboard_bridge.js - Listens for token data from the Dashboard page
// and sends it to the extension's background script

console.log("🌉 LinkedInVibe Dashboard Bridge loaded");

// Listen for custom events from the Dashboard page
window.addEventListener('linkedinvibe-tokens', (event) => {
    const { accessToken, refreshToken, username } = event.detail;
    
    if (!accessToken || !refreshToken) {
        console.error("❌ Missing token data in event");
        return;
    }
    
    console.log("🔑 Received tokens from Dashboard, sending to extension...");
    
    // Send to background script
    chrome.runtime.sendMessage({
        action: 'save_tokens',
        accessToken: accessToken,
        refreshToken: refreshToken,
        username: username
    }, (response) => {
        if (response && response.success) {
            console.log("✅ Tokens saved to extension!");
            // Dispatch success event back to page
            window.dispatchEvent(new CustomEvent('linkedinvibe-tokens-saved', {
                detail: { success: true }
            }));
        } else {
            console.error("❌ Failed to save tokens");
            window.dispatchEvent(new CustomEvent('linkedinvibe-tokens-saved', {
                detail: { success: false, error: response?.error || 'Unknown error' }
            }));
        }
    });
});

// Also check if extension is installed - so Dashboard can show the button
window.dispatchEvent(new CustomEvent('linkedinvibe-extension-ready'));
