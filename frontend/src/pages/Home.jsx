import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Download, Chrome, Settings, Play, CheckCircle, Github, Code } from 'lucide-react';
import ParticlesBackground from '../components/ParticlesBackground';
import { logAnalyticsEvent } from '../lib/firebase';

export default function Home() {
  const trackDownload = (source) => {
    logAnalyticsEvent('download_extension', { source });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />

      {/* Announcement Banner */}
      <div className="bg-blue-600 px-4 py-3 text-white relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-center text-center text-sm font-medium">
          <span className="mr-2">🎉 New in v1.2:</span>
          <span>Auto Apply Bot, Smart Form Filling & Interactive Learning.</span>
          <a href="#download" className="ml-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition">
            Try it now →
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
            <Github className="mr-2 h-4 w-4" />
            100% Open Source & Free
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl drop-shadow-sm">
            Supercharge your LinkedIn <br /> & Job Search with <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">Open Source AI</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Generate viral posts, auto-apply to thousands of jobs, and optimize your profile in seconds.
            Stop wasting time on writer's block and manual applications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#download"
              className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Extension
            </a>
            <Link to="/dashboard" className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-1 hover:gap-2 transition-all">
              Go to Dashboard <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights (Hero Footer) */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
            <div className="p-3 bg-blue-100 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Viral Post AI</h3>
            <p className="text-sm text-gray-600">Generate engagement-optimized content with one click.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
            <div className="p-3 bg-green-100 rounded-full mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Auto Apply Bot 🤖</h3>
            <p className="text-sm text-gray-600">Apply to thousands of "Easy Apply" jobs while you sleep.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
            <div className="p-3 bg-purple-100 rounded-full mb-4">
              <Code className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Scheduler</h3>
            <p className="text-sm text-gray-600">Auto-post content at peak hours for maximum reach.</p>
          </div>
        </div>
      </div>

      {/* How It Works - User Journey */}
      <div id="download" className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From download to your first viral post or application in under 5 minutes
            </p>
          </div>

          {/* Step 1: Download */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100">1</div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Download Extension</h3>
                <p className="text-gray-600 mb-6">
                  Get the Chrome extension and install it in developer mode.
                </p>
                <a
                  href="https://github.com/nisKULDEEP/LinkedInVibe/raw/main/linkedinvibe-extension.zip"
                  download
                  onClick={() => trackDownload('step_1_card')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-md"
                >
                  <Chrome className="w-4 h-4" />
                  Download .zip
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100">2</div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Install & Configure</h3>
                <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                  <li>Unzip the downloaded file</li>
                  <li>Load unpacked in <code className="bg-gray-100 px-1 rounded">chrome://extensions</code></li>
                  <li>Enter LinkedIn Username</li>
                  <li>Fill <strong>Job Preferences</strong> (for Bot)</li>
                  <li>Set API Key (for Posts/AI)</li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100">3</div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <Play className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Launch Magic</h3>
                <ul className="text-gray-600 text-sm space-y-3">
                  <li className="flex gap-2">
                    <span className="text-orange-500 font-bold">A.</span> Click <strong>"Viral Post"</strong> to generate content.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">B.</span> Click <strong>"Start Bot"</strong> on a Jobs page to auto-apply.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
            <p className="text-green-100 max-w-xl mx-auto">
              Your personal AI recruiter and content writer is ready.
              Apply to jobs while you sleep, and post viral content when you wake up!
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why LinkedInVibe?
          </h2>
        </div>
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                <h3 className="flex-auto text-lg font-semibold leading-8 text-gray-900">Auto Apply Bot 🤖</h3>
                <p className="flex-auto">
                  Automatically apply to "Easy Apply" jobs with a single click.
                  Smart form filling, resume uploads, and "human-like" behavior.
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Zap className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                <h3 className="flex-auto text-lg font-semibold leading-8 text-gray-900">Smart Scheduling</h3>
                <p className="flex-auto">Schedule posts for optimal times. Auto-posting runs every 5 minutes in the background.</p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Shield className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                <h3 className="flex-auto text-lg font-semibold leading-8 text-gray-900">Secure & Private</h3>
                <p className="flex-auto">BYOK (Bring Your Own Key) for total privacy. Your API key stays on your device.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source Section */}
      <div className="bg-white py-24 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gray-900 rounded-full">
              <Github className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Proudly Open Source 💖
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            LinkedInVibe is completely open source! We believe in building in public and community-driven development.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left hover:border-gray-200 transition">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3 mb-3">
                <Code className="w-6 h-6 text-blue-600" />
                For Developers
              </h3>
              <p className="text-gray-600 mb-6">
                Want to add features or fix bugs? Fork the repo, make changes, and submit a PR!
                It's a great project to add to your resume as an open-source contribution.
              </p>
              <div className="text-sm font-medium text-gray-900 bg-white inline-block px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                ✅ Perfect for Resume/Portfolio
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left hover:border-gray-200 transition">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Feature Requests
              </h3>
              <p className="text-gray-600 mb-6">
                Have a cool idea for an AI feature? Open an issue on GitHub or discuss it with the community.
                We are building the ultimate LinkedIn tool together!
              </p>
              <div className="text-sm font-medium text-gray-900 bg-white inline-block px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                🚀 Help shape the roadmap
              </div>
            </div>
          </div>

          <a
            href="https://github.com/nisKULDEEP/LinkedInVibe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg transform hover:-translate-y-1"
          >
            <Github className="w-5 h-5" />
            Star & Contribute on GitHub
          </a>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to go viral on LinkedIn?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of professionals using AI to grow their personal brand.
          </p>
          <a
            href="#download"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            <Download className="w-5 h-5" />
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}
