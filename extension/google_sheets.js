/**
 * Google Sheets API Helper Module
 * Handles application tracking via Google Sheets REST API
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Validate spreadsheet access
 */
async function validateSpreadsheet(spreadsheetId, apiKey) {
    try {
        const response = await fetch(
            `${SHEETS_API_BASE}/${spreadsheetId}?key=${apiKey}&fields=properties.title`,
            { method: 'GET' }
        );
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log(`📊 Spreadsheet validated: "${data.properties.title}"`);
        return { success: true, title: data.properties.title };
    } catch (e) {
        console.error('📊 Spreadsheet validation failed:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Get existing sheet/tab names
 */
async function getSheetTabs(spreadsheetId, apiKey) {
    const response = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}?key=${apiKey}&fields=sheets.properties.title`,
        { method: 'GET' }
    );
    if (!response.ok) throw new Error(`Failed to get tabs: HTTP ${response.status}`);
    const data = await response.json();
    return (data.sheets || []).map(s => s.properties.title);
}

/**
 * Create a new tab/sheet in the spreadsheet
 */
async function createTab(spreadsheetId, apiKey, tabName) {
    const response = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    addSheet: {
                        properties: { title: tabName }
                    }
                }]
            })
        }
    );
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Failed to create tab: HTTP ${response.status}`);
    }
    console.log(`📊 Created new tab: "${tabName}"`);
    return true;
}

/**
 * Add header row to a new tab
 */
async function addHeaderRow(spreadsheetId, apiKey, tabName) {
    const headers = [
        'Timestamp', 'Job Title', 'Company', 'Job URL',
        'Match Score', 'Strategy', 'Resume Link', 'Status', 'Notes'
    ];
    
    const response = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:I1?valueInputOption=USER_ENTERED&key=${apiKey}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                range: `${tabName}!A1:I1`,
                majorDimension: 'ROWS',
                values: [headers]
            })
        }
    );
    if (!response.ok) {
        const err = await response.json();
        console.error('📊 Failed to add headers:', err.error?.message);
    }
}

/**
 * Get or create a date-based tab (e.g., "2026-02-28")
 * Returns the tab name
 */
async function getOrCreateDateTab(spreadsheetId, apiKey) {
    const today = new Date();
    const tabName = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    try {
        const existingTabs = await getSheetTabs(spreadsheetId, apiKey);
        
        if (existingTabs.includes(tabName)) {
            console.log(`📊 Tab "${tabName}" already exists`);
            return tabName;
        }

        // Create new tab for today
        await createTab(spreadsheetId, apiKey, tabName);
        // Add headers
        await addHeaderRow(spreadsheetId, apiKey, tabName);
        return tabName;
    } catch (e) {
        console.error('📊 getOrCreateDateTab failed:', e.message);
        throw e;
    }
}

/**
 * Append an application row to the spreadsheet
 * @param {string} spreadsheetId 
 * @param {string} apiKey 
 * @param {string} tabName - Date tab name
 * @param {object} rowData - { jobTitle, company, jobUrl, matchScore, strategy, resumeLink, status, notes }
 */
async function appendApplicationRow(spreadsheetId, apiKey, tabName, rowData) {
    const timestamp = new Date().toLocaleString();
    const row = [
        timestamp,
        rowData.jobTitle || '',
        rowData.company || '',
        rowData.jobUrl || '',
        rowData.matchScore || 'N/A',
        rowData.strategy || 'standard',
        rowData.resumeLink || '',
        rowData.status || 'Applied',
        rowData.notes || ''
    ];

    const response = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                range: `${tabName}!A:I`,
                majorDimension: 'ROWS',
                values: [row]
            })
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Failed to append row: HTTP ${response.status}`);
    }

    console.log(`📊 Logged application: ${rowData.jobTitle} @ ${rowData.company}`);
    return true;
}

/**
 * Extract Spreadsheet ID from a Google Sheets URL
 * Examples:
 *   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
 *   Returns: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
 */
function extractSpreadsheetId(url) {
    if (!url) return null;
    // If it's already just an ID (no slashes), return as-is
    if (!url.includes('/')) return url;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

/**
 * Extract Google Doc ID from a Google Docs URL
 */
function extractDocId(url) {
    if (!url) return null;
    if (!url.includes('/')) return url;
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}
