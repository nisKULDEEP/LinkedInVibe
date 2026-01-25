function log(message, type = 'info') {
    const output = document.getElementById('output');
    const timestamp = new Date().toLocaleTimeString();
    const statusClass = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
    output.innerHTML += `[${timestamp}] ${message}\n`;
    output.scrollTop = output.scrollHeight;
}

function clearOutput() {
    document.getElementById('output').innerHTML = '';
}

async function testScheduler() {
    log('🧪 Sending test_scheduler message to background...', 'info');
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'test_scheduler' });
        log('✅ Scheduler poll completed! Check service worker console for details.', 'success');
        log('💡 TIP: Open chrome://extensions, find LinkedInVibe, click "service worker" to see logs.', 'info');
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'error');
    }
}

async function checkAlarms() {
    log('⏰ Checking active alarms...', 'info');
    
    try {
        const alarms = await chrome.alarms.getAll();
        
        if (alarms.length === 0) {
            log('⚠️ No alarms found! Extension may not be polling.', 'error');
        } else {
            log(`Found ${alarms.length} alarm(s):`, 'success');
            alarms.forEach(alarm => {
                log(`  - ${alarm.name}: Next fire at ${new Date(alarm.scheduledTime).toLocaleString()}`, 'info');
            });
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'error');
    }
}

// Auto-check on load
window.onload = () => {
    log('🚀 Debugger loaded. Ready to test!', 'success');
    
    // Attach event listeners
    document.getElementById('testBtn').addEventListener('click', testScheduler);
    document.getElementById('alarmsBtn').addEventListener('click', checkAlarms);
    document.getElementById('clearBtn').addEventListener('click', clearOutput);
};
