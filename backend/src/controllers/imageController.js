const imageRenderer = require('../services/imageRenderer');

exports.renderTemplate = async (req, res) => {
    try {
        // We now accept template_id and a generic textData object (containing zone keys)
        const { template_id, text_data } = req.body;

        if (!template_id || !text_data) {
            return res.status(400).json({ error: "Missing template_id or text_data" });
        }

        const base64Image = await imageRenderer.renderImage(template_id, text_data);

        res.status(200).json({
            success: true,
            imageBase64: base64Image
        });

    } catch (error) {
        console.error("Render API Error:", error);
        res.status(500).json({ error: "Failed to render image", details: error.message });
    }
};
