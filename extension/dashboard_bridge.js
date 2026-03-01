// dashboard_bridge.js - Listens for token data from the Dashboard page
// and sends it to the extension's background script

console.log("🌉 LinkedInVibe Dashboard Bridge loaded (v1.2.2)");
console.log("   chrome.runtime available:", typeof chrome !== 'undefined' && !!chrome.runtime);

// Listen for custom events from the Dashboard page
window.addEventListener('linkedinvibe-tokens', (event) => {
    console.log("📨 linkedinvibe-tokens event RECEIVED!", event.detail ? "Has detail" : "NO detail");
    const { accessToken, refreshToken, username } = event.detail;

    if (!accessToken || !refreshToken) {
        console.error("❌ Missing token data in event");
        return;
    }

    console.log("🔑 Received tokens from Dashboard, sending to extension...");

    try {
        // Send to background script
        chrome.runtime.sendMessage({
            action: 'save_tokens',
            accessToken: accessToken,
            refreshToken: refreshToken,
            username: username
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Communication Error:", chrome.runtime.lastError.message);

                if (chrome.runtime.lastError.message.includes("Extension context invalidated")) {
                    console.error("⚠️ Extension was reloaded. Please REFRESH this page to reconnect.");
                    alert("LinkedInVibe Extension was updated. Please refresh this page.");
                }

                window.dispatchEvent(new CustomEvent('linkedinvibe-tokens-saved', {
                    detail: { success: false, error: chrome.runtime.lastError.message }
                }));
                return;
            }

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
    } catch (e) {
        console.error("🔥 Critical Error (Context Invalidated?):", e.message);
        if (e.message.includes("Extension context invalidated")) {
            alert("Extension updated. Please refresh this page to reconnect.");
        }
    }
});

// Signal that extension is installed - dispatch repeatedly so React can catch it
const signalReady = () => {
    window.dispatchEvent(new CustomEvent('linkedinvibe-extension-ready'));
};
signalReady();
setInterval(signalReady, 1000); // Keep signaling every second
