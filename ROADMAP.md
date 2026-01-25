# 🗺️ Project Roadmap & Help Wanted

We want to evolve LinkedInVibe from a "Post Publisher" into a full **End-to-End LinkedIn Assistant**.
We need YOUR help to build these features! 🚀

## 🟢 Priority 1: AI Profile Optimizer (The "SEO" Agent)
**Goal:** Help users rank higher in recruiter searches.
*   **Feature**: `Audit My Profile` button.
*   **Logic**:
    1.  Scrape User's Headline, About, and Experience sections.
    2.  Ask Gemini: "Rate this profile 1-10 for a [Job Title] role. Rewrite the Headline to be more click-worthy using Keywords X, Y, Z."
    3.  Show a "Diff View" (Old vs New) for the user to apply changes.
*   **Difficulty**: Medium (Prompt Engineering + UI).

## 🟢 Priority 2: AI Headshot Enhancer
**Goal:** Turn casual selfies into professional studio headshots.
*   **Feature**: `Enhance Profile Pic` button.
*   **Logic**:
    1.  Download user's current profile picture URL.
    2.  Use an AI Library (e.g., `imgly/background-removal-js`) to remove the background client-side.
    3.  Use Gemini/Imagen to generate a "Professional Office Blur" background.
    4.  Composite the images and offer a download.
*   **Difficulty**: Hard (Canvas manipulation + Image Models).

## 🟢 Priority 3: Smart Commenter
**Goal:** Engage with other posts automatically (safely).
*   **Feature**: `Suggest Reply` button on *other people's* posts.
*   **Logic**:
    1.  Read the post content + top 3 comments.
    2.  Generate a thoughtful, non-generic reply (e.g., "Great point about X, have you considered Y?").
*   **Difficulty**: Easy/Medium.

## 🤝 How to Claim a Task
1.  Open an Issue on GitHub titled "Working on [Feature Name]".
2.  Fork the repo.
3.  Submit a PR!
