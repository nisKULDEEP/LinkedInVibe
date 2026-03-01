const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const templates = require('../config/templates');

// Helper to draw rounded rectangle for pill backgrounds
function fillRoundRect(ctx, x, y, width, height, radius) {
    if (radius === 0) {
        ctx.fillRect(x, y, width, height);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

/**
 * Renders text onto a template image and returns Base64 data.
 * @param {string} templateId - ID from templates.js
 * @param {object} textData - Object containing text for each zone (e.g. { main_headline: "...", eyebrow_pill: "..." })
 * @returns {Promise<string>} - Base64 PNG image (e.g. "data:image/png;base64,....")
 */
async function renderImage(templateId, textData) {
    const template = templates[templateId];
    if (!template) throw new Error(`Template config not found for ID: ${templateId}`);

    const bgImagePath = path.join(__dirname, '..', 'posters', template.background_url || template.filename);

    let bgImage;
    try {
        bgImage = await loadImage(bgImagePath);
    } catch (e) {
        throw new Error(`Failed to load template background image from ${bgImagePath}: ${e.message}`);
    }

    const canvasWidth = template.canvas_size?.width || bgImage.width;
    const canvasHeight = template.canvas_size?.height || bgImage.height;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Render Text Zones
    for (const [zoneKey, zoneConf] of Object.entries(template.text_zones)) {
        let text = textData[zoneKey] || "";
        if (!text) continue;

        // Apply transformations
        if (zoneConf.text_transform === "uppercase") {
            text = text.toUpperCase();
        }

        const fontSizePx = parseInt(zoneConf.font_size) || 30;
        const font = `${zoneConf.font_weight || 'normal'} ${zoneConf.font_size} ${zoneConf.font_family || 'sans-serif'}`;
        ctx.font = font;
        ctx.textBaseline = 'top';

        const rawX = zoneConf.x;
        const textY = zoneConf.y;

        let textX = rawX;
        let align = zoneConf.align || 'left';

        if (rawX === "center") {
            textX = canvas.width / 2;
            align = 'center';
        }

        ctx.textAlign = align;

        // Pill / Background Color
        if (zoneConf.background_color) {
            const metrics = ctx.measureText(text);
            let pTop = 10, pRight = 24, pBottom = 10, pLeft = 24;
            if (zoneConf.padding) {
                const parts = zoneConf.padding.split(' ').map(p => parseInt(p.replace('px', '')));
                if (parts.length === 2) {
                    pTop = pBottom = parts[0];
                    pLeft = pRight = parts[1];
                }
            }

            const textWidth = metrics.width;
            const textHeight = fontSizePx;

            let bgX = textX;
            if (align === 'center') bgX = textX - (textWidth / 2);
            else if (align === 'right') bgX = textX - textWidth;

            bgX -= pLeft;
            const bgY = textY - pTop;
            const bgW = textWidth + pLeft + pRight;
            const bgH = textHeight + pTop + pBottom;

            ctx.fillStyle = zoneConf.background_color;
            const radius = zoneConf.border_radius ? parseInt(zoneConf.border_radius) : 0;
            fillRoundRect(ctx, bgX, bgY, bgW, bgH, radius);
        }

        // Draw Text
        ctx.fillStyle = zoneConf.color || '#000000';

        // Wrapping mode if width is provided
        if (zoneConf.width) {
            const words = text.split(' ');
            let line = '';
            let currentY = textY;
            const lineHeight = zoneConf.line_height ?
                (fontSizePx * parseFloat(zoneConf.line_height)) :
                (fontSizePx * 1.2);

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > zoneConf.width && n > 0) {
                    ctx.fillText(line.trim(), textX, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line.trim(), textX, currentY);
        } else {
            // Single line drawing
            ctx.fillText(text, textX, textY);
        }
    }

    return canvas.toDataURL('image/png');
}

module.exports = {
    renderImage
};
