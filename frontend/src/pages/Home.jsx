import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Download, Chrome, Settings, Play, CheckCircle } from 'lucide-react';
import ParticlesBackground from '../components/ParticlesBackground';

export default function Home() {
  const trackDownload = (source) => {
    if (window.logFirebaseEvent && window.firebaseAnalytics) {
      window.logFirebaseEvent(window.firebaseAnalytics, 'download_extension', {
        source: source
      });
      console.log('Download tracked:', source);
    }
  };

  return (
    <div className="bg-white min-h-screen relative overflow-hidden">
      <ParticlesBackground />
      
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl drop-shadow-sm">
            Supercharge your LinkedIn <br /> with <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">AI Magic</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Generate viral posts, create stunning visuals, and schedule content in seconds. 
            Stop wasting time on writer's block.
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

      {/* How It Works - User Journey */}
      <div id="download" className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From download to your first viral post in under 5 minutes
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Install in Chrome</h3>
                <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                  <li>Unzip the downloaded file</li>
                  <li>Go to <code className="bg-gray-100 px-1 rounded">chrome://extensions</code></li>
                  <li>Enable <strong>Developer mode</strong> (top right)</li>
                  <li>Click <strong>"Load unpacked"</strong></li>
                  <li>Select the unzipped folder</li>
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Connect & Generate</h3>
                <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                  <li>Click extension icon in Chrome</li>
                  <li>Enter LinkedIn username</li>
                  <li>Enter your <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">Gemini API key</a></li>
                  <li><Link to="/dashboard" className="text-blue-600 underline">Login to Dashboard</Link> & connect</li>
                  <li>Click <strong>"Generate Magic Post"</strong> 🎉</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
            <p className="text-green-100 max-w-xl mx-auto">
              After setup, just navigate to LinkedIn, click the extension, and generate viral posts instantly. 
              Schedule them in advance or post immediately!
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
                <h3 className="flex-auto text-lg font-semibold leading-8 text-gray-900">AI Content Gen</h3>
                <p className="flex-auto">One-click post generation based on your unique voice/profile. No more generic ChatGPT slop.</p>
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
