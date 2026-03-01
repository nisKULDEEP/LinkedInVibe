const path = require('path');

const templates = {
    floral_productivity_card: {
        template_id: "floral_productivity_card",
        description: "White central card over lime green floral background",
        background_url: "floral_productivity_card.png", // Keeping the local filename reference for the backend
        canvas_size: { width: 1080, height: 1350 },
        theme: "productivity, tips, bold, educational",
        text_zones: {
            top_left_tag: {
                x: 85,
                y: 120,
                max_chars: 20,
                font_family: "sans-serif",
                font_size: "24px",
                font_weight: "normal",
                color: "#000000",
                text_transform: "uppercase",
                letter_spacing: "3px"
            },
            eyebrow_pill: {
                x: "center",
                y: 340,
                max_chars: 15,
                font_family: "sans-serif",
                font_size: "26px",
                font_weight: "bold",
                color: "#000000",
                background_color: "#B4F73B",
                padding: "10px 24px",
                border_radius: "8px",
                text_transform: "uppercase",
                letter_spacing: "2px"
            },
            main_headline: {
                x: 140,
                y: 480,
                width: 800,
                align: "center",
                max_chars: 35,
                font_family: "sans-serif",
                font_size: "140px",
                font_weight: "900",
                color: "#000000",
                text_transform: "uppercase",
                line_height: 0.85,
                letter_spacing: "-3px"
            },
            footer_left: {
                x: 85,
                y: 1210,
                max_chars: 25,
                font_family: "sans-serif",
                font_size: "24px",
                font_weight: "bold",
                color: "#000000",
                text_transform: "uppercase",
                letter_spacing: "2px"
            }
        }
    }
};

module.exports = templates;
