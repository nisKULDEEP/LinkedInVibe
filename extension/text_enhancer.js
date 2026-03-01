/**
 * Smart Text Enhancer
 * Adds an AI ✨ enhancement button to text inputs on LinkedIn
 */

(function () {
    'use strict';

    let currentTarget = null;
    let enhancerBtn = null;

    // --- Memory Optimization: Check Settings First ---
    chrome.storage.local.get(['botSettings'], (res) => {
        const settings = res.botSettings || {};
        if (settings.enableTextEnhancer === false) {
            console.log('✨ Text Enhancer disabled in settings. Skipping initialization.');
            return; // Abort loading to save memory
        }
        initEnhancer();
    });

    function initEnhancer() {
        console.log("✨ Smart Text Enhancer initialized");

        // Use event delegation for dynamically loaded inputs
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);
    }

    function handleFocus(e) {
        const target = e.target;

        // Check if it's a text input we care about
        const isContentEditable = target.getAttribute('contenteditable') === 'true' ||
            target.classList.contains('ql-editor') ||
            target.role === 'textbox';
        const isTextarea = target.tagName === 'TEXTAREA';
        const isTextInput = target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search');

        // Ignore single-line inputs like search bars to avoid annoyance, focus on multi-line/rich text
        if (!isContentEditable && !isTextarea) return;

        // Don't attach to tiny inputs
        if (target.offsetHeight < 30) return;

        currentTarget = target;
        showEnhancerButton(target);
    }

    function handleBlur(e) {
        // Need a slight delay to check if the new focus is the button itself
        setTimeout(() => {
            if (document.activeElement !== currentTarget && document.activeElement !== enhancerBtn) {
                hideEnhancerButton();
                currentTarget = null;
            }
        }, 200);
    }

    function showEnhancerButton(element) {
        if (!enhancerBtn) {
            createEnhancerButton();
        }

        const rect = element.getBoundingClientRect();

        // Position it at the bottom-right of the input
        enhancerBtn.style.top = `${window.scrollY + rect.top + rect.height - 35}px`;
        enhancerBtn.style.left = `${window.scrollX + rect.left + rect.width - 40}px`;
        enhancerBtn.style.display = 'flex';
    }

    function hideEnhancerButton() {
        if (enhancerBtn) {
            enhancerBtn.style.display = 'none';
        }
    }

    function createEnhancerButton() {
        enhancerBtn = document.createElement('div');
        enhancerBtn.id = 'lv-text-enhancer-btn';
        enhancerBtn.innerHTML = '✨';
        enhancerBtn.title = 'Enhance with AI';

        enhancerBtn.style.cssText = `
            position: absolute;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(109, 40, 217, 0.4);
            transition: all 0.2s;
            user-select: none;
        `;

        enhancerBtn.addEventListener('mouseover', () => {
            enhancerBtn.style.transform = 'scale(1.1)';
        });

        enhancerBtn.addEventListener('mouseout', () => {
            enhancerBtn.style.transform = 'scale(1)';
        });

        enhancerBtn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            enhanceText();
        });

        document.body.appendChild(enhancerBtn);
    }

    async function enhanceText() {
        if (!currentTarget) return;

        let originalText = '';
        if (currentTarget.tagName === 'TEXTAREA' || currentTarget.tagName === 'INPUT') {
            originalText = currentTarget.value;
        } else {
            originalText = currentTarget.innerText || currentTarget.textContent;
        }

        originalText = originalText.trim();
        if (!originalText || originalText.length < 5) {
            showToast("Please type a few words first!");
            return;
        }

        const ogIcon = enhancerBtn.innerHTML;
        enhancerBtn.innerHTML = '⏳';
        enhancerBtn.style.animation = 'lv-pulse 1.5s infinite';

        if (!document.getElementById('lv-enhancer-styles')) {
            const style = document.createElement('style');
            style.id = 'lv-enhancer-styles';
            style.textContent = `@keyframes lv-pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }`;
            document.head.appendChild(style);
        }

        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: "enhance_text",
                    text: originalText
                }, resolve);
            });

            if (response && response.success) {
                replaceText(response.text);
            } else {
                showToast(response.error || "Failed to enhance text. Check API Key.");
            }
        } catch (e) {
            console.error("Enhancement error:", e);
            showToast("Error communicating with background script.");
        } finally {
            enhancerBtn.innerHTML = ogIcon;
            enhancerBtn.style.animation = 'none';
        }
    }

    function replaceText(newText) {
        if (!currentTarget) return;

        currentTarget.focus();

        // Different injection strategies based on element type
        if (currentTarget.tagName === 'TEXTAREA' || currentTarget.tagName === 'INPUT') {
            currentTarget.value = newText;
            currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
            currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // contenteditable
            // Convert plain text newlines to HTML paragraphs or breaks to preserve formatting
            const htmlText = newText.split('\n').map(line => `<p>${line}</p>`).join('');

            // For LinkedIn QL Editor
            if (currentTarget.classList.contains('ql-editor')) {
                currentTarget.innerHTML = htmlText;
            } else {
                currentTarget.innerText = newText; // Fallback
            }

            currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
        }

        showToast("✨ Enhanced!");
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: #f8fafc;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 10001;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
})();
