import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

// ─── Blog Data ───
export const blogPosts = [
    {
        slug: 'linkedin-auto-apply-bot-2026-guide',
        title: 'LinkedIn Auto Apply Bot: The Complete 2026 Guide to Automated Job Applications',
        excerpt: 'Learn how to automate your LinkedIn job applications using AI. Apply to 100+ jobs per day while maintaining quality with smart filtering.',
        date: 'February 28, 2026',
        readTime: '8 min read',
        tags: ['#LinkedInAutoApply', '#JobSearchAutomation', '#AIJobs', '#CareerTech'],
        image: '🤖',
        content: `
      <h2>Why Automate LinkedIn Job Applications?</h2>
      <p>The modern job market is brutal. On average, a job seeker applies to <strong>100-200 jobs</strong> before landing an interview. Doing this manually on LinkedIn takes <strong>2-4 hours per day</strong> — time you could spend preparing for interviews, upskilling, or networking.</p>
      
      <p>LinkedIn's "Easy Apply" feature was a step forward, but you still spend hours scrolling, clicking, and filling the same forms over and over. That's where <strong>auto-apply bots</strong> come in.</p>

      <h2>What is a LinkedIn Auto Apply Bot?</h2>
      <p>A LinkedIn auto apply bot is a browser extension or script that automatically:</p>
      <ul>
        <li>Scrolls through job search results</li>
        <li>Clicks "Easy Apply" buttons</li>
        <li>Fills in application forms with your saved profile data</li>
        <li>Uploads your resume</li>
        <li>Submits applications — all while you focus on other things</li>
      </ul>

      <h2>How LinkedInVibe's Auto Apply Works</h2>
      <p>LinkedInVibe takes this concept further with <strong>AI-powered intelligence</strong>:</p>
      <ul>
        <li><strong>Smart Form Filling:</strong> Uses Google Gemini AI to understand and answer complex application questions</li>
        <li><strong>Job Matching:</strong> AI scores each job against your profile before applying, so you don't waste applications on irrelevant roles</li>
        <li><strong>Resume Tailoring:</strong> Automatically customizes your resume keywords for each job description</li>
        <li><strong>Human-like Behavior:</strong> Random delays between actions to appear natural</li>
        <li><strong>Learning System:</strong> Remembers your corrections and improves over time</li>
      </ul>

      <h2>Setting Up Auto Apply in 5 Minutes</h2>
      <ol>
        <li><strong>Install the Extension:</strong> Download LinkedInVibe from GitHub and load it in Chrome</li>
        <li><strong>Complete Your Profile:</strong> Fill in your name, email, phone, and job preferences in Settings</li>
        <li><strong>Upload Resume:</strong> Upload your PDF resume for automatic attachment</li>
        <li><strong>Set Your Strategy:</strong> Choose Standard (apply to all), AI Filter (smart matching), or AI Tailor (resume customization)</li>
        <li><strong>Hit Start:</strong> Navigate to LinkedIn Jobs and click "Start Bot"</li>
      </ol>

      <h2>Best Practices for Auto Applying</h2>
      <ul>
        <li>Start with <strong>10-20 applications per session</strong> to test your settings</li>
        <li>Use the <strong>AI Filter strategy</strong> with a 60% minimum match score for quality over quantity</li>
        <li>Set up <strong>company and title blacklists</strong> to avoid irrelevant applications</li>
        <li>Review your <strong>Job History</strong> regularly to track what's working</li>
        <li>Keep your profile data updated — outdated information leads to rejected applications</li>
      </ul>

      <h2>Is It Safe to Use?</h2>
      <p>LinkedInVibe is designed with safety in mind:</p>
      <ul>
        <li>All data stays on your device (no external servers)</li>
        <li>Uses your own API key (BYOK model)</li>
        <li>Human-like delays prevent detection</li>
        <li>Open source — you can audit every line of code</li>
      </ul>

      <p><strong>Ready to supercharge your job search?</strong> Download LinkedInVibe and start applying to jobs while you sleep.</p>
    `
    },
    {
        slug: 'how-to-write-viral-linkedin-posts-ai',
        title: 'How to Write Viral LinkedIn Posts Using AI in 2026',
        excerpt: 'Discover the formula behind viral LinkedIn content and how AI can help you create engaging posts that get thousands of impressions.',
        date: 'February 25, 2026',
        readTime: '6 min read',
        tags: ['#LinkedInContent', '#ViralPosts', '#AIWriting', '#PersonalBranding'],
        image: '⚡',
        content: `
      <h2>The Anatomy of a Viral LinkedIn Post</h2>
      <p>After analyzing thousands of viral LinkedIn posts, patterns emerge. The most engaging content shares these characteristics:</p>
      <ul>
        <li><strong>Hook in the first line:</strong> You have 2 seconds to grab attention before the "See more" cutoff</li>
        <li><strong>Personal storytelling:</strong> Posts with personal experiences get 3x more engagement</li>
        <li><strong>Short paragraphs:</strong> One sentence per line, lots of white space</li>
        <li><strong>Contrarian takes:</strong> Challenge conventional wisdom to spark discussion</li>
        <li><strong>Actionable insights:</strong> Give readers something they can use immediately</li>
      </ul>

      <h2>AI-Powered Content Creation</h2>
      <p>Writing consistently is hard. AI tools like LinkedInVibe's Post Generator solve this by:</p>
      <ul>
        <li>Analyzing your top-performing posts to learn your voice</li>
        <li>Generating content that matches your style and tone</li>
        <li>Suggesting trending topics in your industry</li>
        <li>Creating multiple variations for A/B testing</li>
      </ul>

      <h2>The AIDA Framework for LinkedIn</h2>
      <p>Every great LinkedIn post follows the <strong>AIDA</strong> framework:</p>
      <ol>
        <li><strong>Attention:</strong> A bold, surprising first line ("I got fired and it was the best thing that happened to me")</li>
        <li><strong>Interest:</strong> Build curiosity with a story or data point</li>
        <li><strong>Desire:</strong> Show the transformation or benefit</li>
        <li><strong>Action:</strong> End with a question or CTA to drive comments</li>
      </ol>

      <h2>Best Times to Post on LinkedIn</h2>
      <ul>
        <li><strong>Tuesday - Thursday:</strong> Highest engagement days</li>
        <li><strong>7-8 AM:</strong> Catch the morning commute scroll</li>
        <li><strong>12-1 PM:</strong> Lunch break browsing</li>
        <li><strong>5-6 PM:</strong> End-of-day wind-down</li>
      </ul>
      <p>LinkedInVibe's <strong>Smart Scheduler</strong> lets you set posts to publish at these optimal times automatically.</p>

      <h2>Content Ideas That Always Work</h2>
      <ul>
        <li>"X lessons I learned from Y" (listicles)</li>
        <li>Career milestones and reflections</li>
        <li>Industry trends with your unique take</li>
        <li>"What I wish I knew when I started..."</li>
        <li>Behind-the-scenes of your work process</li>
      </ul>

      <p><strong>Start creating content that stands out.</strong> Use LinkedInVibe to generate, schedule, and publish AI-powered posts that resonate with your audience.</p>
    `
    },
    {
        slug: 'best-linkedin-job-search-strategies-2026',
        title: '10 LinkedIn Job Search Strategies That Actually Work in 2026',
        excerpt: 'Go beyond just applying. Learn proven strategies to stand out on LinkedIn, get recruiter attention, and land more interviews.',
        date: 'February 20, 2026',
        readTime: '7 min read',
        tags: ['#JobSearch', '#LinkedIn', '#CareerAdvice', '#Hiring2026'],
        image: '🎯',
        content: `
      <h2>The Job Market Has Changed</h2>
      <p>In 2026, <strong>87% of recruiters</strong> use LinkedIn to find candidates. But with millions of job seekers competing for the same roles, simply applying isn't enough. You need a strategy.</p>

      <h2>Strategy 1: Optimize Your Profile for Search</h2>
      <p>Recruiters search using keywords. Make sure your headline, summary, and experience sections include relevant industry terms. Don't just say "Software Engineer" — say "Full Stack Software Engineer | React, Node.js, AWS | Building Scalable SaaS Products".</p>

      <h2>Strategy 2: Apply Early and Fast</h2>
      <p>Data shows that <strong>applications submitted within the first 24 hours</strong> get 3x more callbacks. Use automation tools like LinkedInVibe to apply to new postings the moment they appear.</p>

      <h2>Strategy 3: Use AI to Score Job Fit</h2>
      <p>Not every job is worth applying to. Use AI-powered match scoring to evaluate how well your skills align with each job description before spending time on an application.</p>

      <h2>Strategy 4: Tailor Your Resume Per Application</h2>
      <p>Generic resumes get filtered out by ATS systems. AI tools can automatically customize your resume's keywords to match each job description, dramatically improving your pass-through rate.</p>

      <h2>Strategy 5: Build in Public</h2>
      <p>Post regularly about your expertise. Recruiters check candidate profiles — if they see thought leadership content, you stand out from other applicants.</p>

      <h2>Strategy 6: Network Strategically</h2>
      <p>Connect with recruiters and hiring managers at target companies. A warm introduction gets you <strong>10x the response rate</strong> of a cold application.</p>

      <h2>Strategy 7: Track Everything</h2>
      <p>Keep a log of every application: company, role, date, status. This helps you follow up at the right time and identify which strategies work best.</p>

      <h2>Strategy 8: Set Up Job Alerts</h2>
      <p>LinkedIn's job alerts notify you of new postings. Combine this with auto-apply to be one of the first applicants every time.</p>

      <h2>Strategy 9: Prepare AI-Powered Answers</h2>
      <p>Many applications include screening questions. Having AI-prepared answers that are consistent and well-crafted saves time and improves quality.</p>

      <h2>Strategy 10: Don't Put All Eggs in One Basket</h2>
      <p>Apply on LinkedIn, company websites, AngelList, and other platforms simultaneously. Use tools that can fill forms on any website, not just LinkedIn.</p>

      <p><strong>Combine these strategies with automation</strong> to create a job search machine that works 24/7.</p>
    `
    },
    {
        slug: 'ai-resume-optimization-ats-2026',
        title: 'AI Resume Optimization: How to Beat ATS Systems in 2026',
        excerpt: 'Your resume gets 6 seconds of human review — if it even passes the ATS. Learn how AI can optimize your resume to beat both machines and humans.',
        date: 'February 15, 2026',
        readTime: '6 min read',
        tags: ['#ResumeOptimization', '#ATS', '#AIResume', '#JobHunting'],
        image: '📄',
        content: `
      <h2>The ATS Problem</h2>
      <p>Over <strong>75% of resumes</strong> are rejected by Applicant Tracking Systems before a human ever sees them. These systems scan for keywords, formatting, and structure — and most resumes fail.</p>

      <h2>Why Your Resume Gets Rejected</h2>
      <ul>
        <li><strong>Missing keywords:</strong> The #1 reason. If the JD says "project management" and you wrote "managing projects," ATS may not match it</li>
        <li><strong>Bad formatting:</strong> Tables, columns, graphics, and fancy fonts confuse parsers</li>
        <li><strong>Wrong file type:</strong> Some ATS systems can't read .docx properly. PDF is usually safest</li>
        <li><strong>Generic content:</strong> The same resume for every job = low match scores</li>
      </ul>

      <h2>How AI Resume Optimization Works</h2>
      <p>AI tools analyze the job description and your resume side by side to:</p>
      <ol>
        <li><strong>Extract keywords:</strong> Identify the exact terms the ATS is looking for</li>
        <li><strong>Match and gap analysis:</strong> Find which keywords you're missing</li>
        <li><strong>Suggest improvements:</strong> Rewrite bullet points to include relevant terms</li>
        <li><strong>Score compatibility:</strong> Give you a percentage match before you apply</li>
      </ol>

      <h2>LinkedInVibe's ATS Score Feature</h2>
      <p>The extension's built-in ATS analyzer:</p>
      <ul>
        <li>Scans your uploaded resume against best practices</li>
        <li>Scores your compatibility on a 0-100 scale</li>
        <li>Provides specific, actionable feedback</li>
        <li>Can auto-tailor your resume per job when using the AI Tailor strategy</li>
      </ul>

      <h2>Resume Formatting Rules for ATS</h2>
      <ul>
        <li>Use standard section headers: Experience, Education, Skills</li>
        <li>Stick to one column layout</li>
        <li>Use standard fonts (Arial, Calibri, Times New Roman)</li>
        <li>No headers/footers — ATS can't read them</li>
        <li>Include your contact info in the body, not in a text box</li>
        <li>Save as PDF unless the application specifically requests .docx</li>
      </ul>

      <h2>The 80/20 Rule of Resume Optimization</h2>
      <p>Focus on <strong>three things</strong> that make 80% of the difference:</p>
      <ol>
        <li>Match your resume title to the job title</li>
        <li>Include the top 10 keywords from the JD in your experience section</li>
        <li>Quantify achievements with numbers (increased by X%, managed Y people, saved $Z)</li>
      </ol>

      <p><strong>Stop guessing.</strong> Let AI optimize your resume and watch your interview rate skyrocket.</p>
    `
    },
    {
        slug: 'open-source-linkedin-tools-privacy-first',
        title: 'Why Open Source LinkedIn Tools Are the Future of Job Search Automation',
        excerpt: 'Closed-source LinkedIn bots sell your data. Open source alternatives give you full control, transparency, and zero monthly fees.',
        date: 'February 10, 2026',
        readTime: '5 min read',
        tags: ['#OpenSource', '#Privacy', '#LinkedInTools', '#FreeTools'],
        image: '🔓',
        content: `
      <h2>The Problem with Closed-Source LinkedIn Tools</h2>
      <p>Most LinkedIn automation tools charge <strong>$30-100/month</strong> and require you to:</p>
      <ul>
        <li>Share your LinkedIn credentials with their servers</li>
        <li>Trust that they won't misuse your data</li>
        <li>Accept that you can't see what code is running</li>
        <li>Pay recurring fees even when you're not job hunting</li>
      </ul>

      <h2>The Open Source Advantage</h2>
      <p>Open source tools like LinkedInVibe flip this model:</p>
      <ul>
        <li><strong>Full transparency:</strong> Every line of code is public on GitHub. You can audit exactly what the extension does</li>
        <li><strong>Data stays local:</strong> All your profile data, API keys, and settings are stored in Chrome's local storage — never sent to external servers</li>
        <li><strong>BYOK (Bring Your Own Key):</strong> You use your own Gemini API key. No middleman, no markup</li>
        <li><strong>Free forever:</strong> No subscriptions, no trials, no hidden costs</li>
        <li><strong>Community-driven:</strong> Features are requested and built by users, not driven by profit motives</li>
      </ul>

      <h2>Privacy Comparison</h2>
      <table>
        <tr><th>Feature</th><th>Closed-Source Tools</th><th>LinkedInVibe</th></tr>
        <tr><td>Data Storage</td><td>Their servers</td><td>Your browser only</td></tr>
        <tr><td>API Keys</td><td>Shared/managed</td><td>Your own key</td></tr>
        <tr><td>Code Audit</td><td>Impossible</td><td>100% public</td></tr>
        <tr><td>Monthly Cost</td><td>$30-100</td><td>$0</td></tr>
        <tr><td>AI Cost</td><td>Included in fee</td><td>Gemini free tier</td></tr>
      </table>

      <h2>Contributing to Open Source</h2>
      <p>Using open source tools is also a career move:</p>
      <ul>
        <li><strong>Learn by reading:</strong> Study how Chrome extensions, AI APIs, and automation work</li>
        <li><strong>Build your portfolio:</strong> Contributing to LinkedInVibe counts as real open source experience</li>
        <li><strong>Network with developers:</strong> Join the community of builders solving real problems</li>
      </ul>

      <h2>How to Get Started</h2>
      <ol>
        <li>Star the <a href="https://github.com/nisKULDEEP/LinkedInVibe">GitHub repository</a></li>
        <li>Download and install the extension</li>
        <li>Get a free Gemini API key</li>
        <li>Start applying and posting with AI assistance</li>
      </ol>

      <p><strong>Your job search tools should work for you, not the other way around.</strong> Choose open source. Choose privacy. Choose LinkedInVibe.</p>
    `
    }
];

// ─── Blog List Page ───
export function BlogList() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">LinkedInVibe Blog</h1>
                    <p className="text-lg text-gray-600">Tips, strategies, and insights for LinkedIn success</p>
                </div>

                <div className="space-y-8">
                    {blogPosts.map(post => (
                        <Link
                            key={post.slug}
                            to={`/blog/${post.slug}`}
                            className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{post.image}</div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition">{post.title}</h2>
                                    <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Individual Blog Post Page ───
export function BlogPost() {
    const slug = window.location.hash.split('/blog/')[1];
    const post = blogPosts.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
                    <Link to="/blog" className="text-blue-600 hover:underline">← Back to Blog</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <article className="mx-auto max-w-3xl px-4 py-16">
                <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-8 transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>

                <div className="text-5xl mb-6">{post.image}</div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {post.readTime}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {post.tags.map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                </div>

                <div
                    className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-li:text-gray-600 prose-strong:text-gray-900 prose-table:text-sm"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* CTA */}
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-center text-white">
                    <h3 className="text-2xl font-bold mb-3">Ready to Try LinkedInVibe?</h3>
                    <p className="text-blue-100 mb-6">Free, open source, AI-powered LinkedIn automation.</p>
                    <a
                        href="https://github.com/nisKULDEEP/LinkedInVibe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
                    >
                        Download Extension →
                    </a>
                </div>
            </article>
        </div>
    );
}
