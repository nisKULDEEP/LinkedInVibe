const { htmlToPdf } = require('../services/pdfGenerator');

async function generatePdf(req, res) {
    try {
        const { html, filename } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        const pdfBuffer = await htmlToPdf(html);
        const base64 = pdfBuffer.toString('base64');

        res.json({
            success: true,
            pdf: base64,
            filename: filename || 'resume.pdf',
            size: pdfBuffer.length
        });
    } catch (error) {
        console.error('PDF generation failed:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = { generatePdf };
