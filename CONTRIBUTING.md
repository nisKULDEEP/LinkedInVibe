# Contributing to LinkedInVibe

Thank you for your interest in contributing to **LinkedInVibe**! We welcome contributions from the community to make this the best open-source social media tool.

## How to Contribute

### 1. Extension (Community Edition)
The extension (`/extension`) is the core of the project. You can add new features here!
*   **Ideas**: Add support for Twitter/X, improve the UI, add new prompt templates.
*   **To Run Locally**:
    1.  Go to `chrome://extensions`
    2.  Enable "Developer Mode"
    3.  Click "Load Unpacked" and select the `extension` folder.

### 2. Frontend & Backend (SaaS Platform)
If you want to improve the dashboard or scheduling logic:
*   **Frontend**: `cd frontend && npm install && npm run dev`
*   **Backend**: `cd backend && npm install && npm start`
*   **Database**: You will need your own Supabase project. See `backend/schema.sql` for setup.

## Pull Request Process
1.  Fork the repo.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## Code of Conduct
Be kind and respectful. We are all here to build cool stuff together.
