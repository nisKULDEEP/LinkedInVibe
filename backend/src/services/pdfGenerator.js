const puppeteer = require('puppeteer');

/**
 * Convert HTML string to PDF buffer using Puppeteer
 */
async function htmlToPdf(htmlContent) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
            printBackground: true
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { htmlToPdf };
