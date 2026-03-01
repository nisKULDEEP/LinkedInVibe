/**
 * Google Docs API Helper Module
 * Handles resume creation and sharing via Google Docs REST API
 */

const DOCS_API_BASE = 'https://docs.googleapis.com/v1/documents';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Read content from a Google Doc
 * @param {string} docId - Google Doc ID
 * @param {string} apiKey - Google API Key
 * @returns {string} Plain text content of the document
 */
async function readDocContent(docId, apiKey) {
    const response = await fetch(
        `${DOCS_API_BASE}/${docId}?key=${apiKey}`,
        { method: 'GET' }
    );
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Failed to read doc: HTTP ${response.status}`);
    }
    const doc = await response.json();

    // Extract plain text from document body
    let text = '';
    if (doc.body && doc.body.content) {
        for (const element of doc.body.content) {
            if (element.paragraph) {
                for (const pe of element.paragraph.elements) {
                    if (pe.textRun && pe.textRun.content) {
                        text += pe.textRun.content;
                    }
                }
            }
        }
    }
    console.log(`📄 Read resume doc (${text.length} chars)`);
    return text;
}

/**
 * Create a new Google Doc with content using Drive API
 * Note: Docs API requires OAuth for creation. We use Drive API to create,
 * then Docs API to insert content.
 * 
 * For API key-only access, we'll use a different approach:
 * The user must share their base doc, and we'll use the export endpoint.
 * 
 * Alternative: Use the Gemini API to format the resume and store the 
 * tailored text directly in the spreadsheet + use the public link approach.
 *
 * @param {string} apiKey - Google API Key
 * @param {string} accessToken - OAuth access token (if available)
 * @param {string} title - Document title
 * @param {string} content - Plain text content to insert
 * @returns {object} { docId, url }
 */
async function createTailoredDoc(apiKey, accessToken, title, content) {
    // Try OAuth token first (if user connected via dashboard)
    const authHeader = accessToken
        ? { 'Authorization': `Bearer ${accessToken}` }
        : {};

    // Step 1: Create empty doc via Drive API
    const createResponse = await fetch(
        `${DRIVE_API_BASE}?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                name: title,
                mimeType: 'application/vnd.google-apps.document'
            })
        }
    );

    if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.error?.message || `Failed to create doc: HTTP ${createResponse.status}`);
    }

    const newDoc = await createResponse.json();
    const docId = newDoc.id;
    console.log(`📄 Created new doc: ${docId}`);

    // Step 2: Insert content via Docs API
    const updateResponse = await fetch(
        `${DOCS_API_BASE}/${docId}:batchUpdate?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                requests: [{
                    insertText: {
                        location: { index: 1 },
                        text: content
                    }
                }]
            })
        }
    );

    if (!updateResponse.ok) {
        console.error('📄 Failed to insert content into doc');
    }

    // Step 3: Make public
    await makeDocPublic(docId, apiKey, accessToken);

    const url = `https://docs.google.com/document/d/${docId}/edit`;
    console.log(`📄 Tailored resume ready: ${url}`);

    return { docId, url };
}

/**
 * Make a Google Doc publicly accessible (anyone with link can view)
 */
async function makeDocPublic(docId, apiKey, accessToken) {
    const authHeader = accessToken
        ? { 'Authorization': `Bearer ${accessToken}` }
        : {};

    try {
        const response = await fetch(
            `${DRIVE_API_BASE}/${docId}/permissions?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone'
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            console.error('📄 Failed to make doc public:', err.error?.message);
            return false;
        }

        console.log(`📄 Doc ${docId} is now public`);
        return true;
    } catch (e) {
        console.error('📄 makeDocPublic error:', e.message);
        return false;
    }
}

/**
 * Get public view URL for a doc
 */
function getDocPublicUrl(docId) {
    return `https://docs.google.com/document/d/${docId}/edit?usp=sharing`;
}

/**
 * Export a Google Doc as plain text (works with API key if doc is public/shared)
 */
async function exportDocAsText(docId, apiKey) {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain&key=${apiKey}`,
        { method: 'GET' }
    );
    if (!response.ok) {
        throw new Error(`Failed to export doc: HTTP ${response.status}`);
    }
    return await response.text();
}
