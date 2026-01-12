# LinkedInVibe - The Open Source AI Post Manager 🚀

**LinkedInVibe** is a powerful AI tool that helps you create viral LinkedIn content in seconds. It operates in two modes:

1.  **Community Edition (Open Source)**: Bring Your Own Key (BYOK) - Free forever.
2.  **Pro Cloud (SaaS)**: Cloud-hosted, managed AI, advanced scheduling stats.

![Demo](/extension/icon.png)

## ✨ Features

*   **Viral Post Generator**: Uses Gemini 2.0 to mimic your style.
*   **Smart Scheduler**: Schedule posts and let the extension auto-post for you.
*   **Dual Mode**: Use your own API Key (Free) or subscribe to our Cloud Plan.
*   **Privacy First**: Your data stays local (Community Edition).

## 🚀 Deployment (Render)
1.  Push this code to GitHub.
2.  Go to [dashboard.render.com](https://dashboard.render.com) -> New -> **Blueprint**.
3.  Connect your repo.
4.  Render will read `render.yaml` and ask for your Environment Variables (SUPABASE_URL, etc).
5.  Click **Apply**. Done!

## 🗺️ Roadmap (Help Wanted!)
We are building the ultimate **LinkedIn AI Agent**. Check out [ROADMAP.md](ROADMAP.md) for features you can build, including:
*   ✨ **AI Profile Picture Enhancer**
*   🪄 **"About Me" Auto-Fixer**
*   🔍 **SEO Profile Auditor**

## 🚀 Getting Started

### Option A: Install Extension (Easy)
1.  Clone this repo.
2.  Go to `chrome://extensions` -> Load Unpacked -> Select `/extension` folder.
3.  Open the extension popup and enter your **Gemini API Key**.

### Option B: Self-Host the Full Stack
If you want the Dashboard and Scheduler features on your own server:

1.  **Setup Supabase**: Create a project and run `backend/schema.sql`.
2.  **Backend**:
    ```bash
    cd backend
    npm install
    # Set .env (SUPABASE_URL, GEMINI_API_KEY, etc)
    npm start
    ```
3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    # Set .env (VITE_API_URL)
    npm run dev
    ```

## 🤝 Contributing
We love contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.
