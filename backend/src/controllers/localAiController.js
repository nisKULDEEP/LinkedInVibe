const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.join(__dirname, '../scripts/z_image_gen.py');
const VENV_PATH = path.join(__dirname, '../venv'); // Virtual Env Path

async function generateLocalImage(req, res) {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ success: false, error: "Prompt required" });
    }

    // TODO: Environment check (venv exists? diffusers installed?)
    // For MVP, we assume user followed setup or we implement auto-setup later.

    const pythonPath = path.join(VENV_PATH, 'bin', 'python');
    const systemPython = 'python3'; // Fallback if venv not active

    // Check if venv python exists, else use system
    const executable = fs.existsSync(pythonPath) ? pythonPath : systemPython;

    console.log(`🎨 Starting Local Gen with: ${prompt}`);
    console.log(`🐍 Using Python: ${executable}`);

    const pythonProcess = spawn(executable, [SCRIPT_PATH, '--prompt', prompt]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`[Python stderr]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            return res.status(500).json({ success: false, error: "Image generation failed", details: errorString });
        }

        const base64Image = dataString.trim();
        // Validation: Ensure it looks like base64
        if (base64Image.length < 100) {
            return res.status(500).json({ success: false, error: "Invalid output from python script" });
        }

        res.json({ success: true, imageBase64: base64Image });
    });
}

module.exports = { generateLocalImage };
