const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const VENV_PATH = path.join(__dirname, '../../venv');

function setupEnvironment() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(VENV_PATH)) {
            console.log("✅ venv already exists.");
            return resolve();
        }

        console.log("⚙️ Creating Python venv...");
        const python = spawn('python3', ['-m', 'venv', 'venv'], { cwd: path.join(__dirname, '../../') });

        python.on('close', (code) => {
            if (code !== 0) return reject("Failed to create venv");

            console.log("📦 Installing dependencies (torch, diffusers)... This may take a while.");
            const pip = path.join(VENV_PATH, 'bin', 'pip');
            const install = spawn(pip, ['install', 'torch', 'diffusers', 'transformers', 'accelerate'], { cwd: path.join(__dirname, '../../') });

            install.stdout.on('data', d => console.log(d.toString()));
            install.stderr.on('data', d => console.error(d.toString()));

            install.on('close', (code) => {
                if (code !== 0) return reject("Failed to install dependencies");
                console.log("✅ Environment Setup Complete!");
                resolve();
            });
        });
    });
}

if (require.main === module) {
    setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };
