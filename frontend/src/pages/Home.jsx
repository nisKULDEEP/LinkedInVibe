import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield } from 'lucide-react';
import ParticlesBackground from '../components/ParticlesBackground';

export default function Home() {
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
            <Link to="/dashboard" className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              Get Started for Free
            </Link>
            <a href="#" className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-1 hover:gap-2 transition-all">
              Download Extension <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
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
                <p className="flex-auto">Schedule posts for optimal times effortlessly. Auto-posting integration coming soon.</p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Shield className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                <h3 className="flex-auto text-lg font-semibold leading-8 text-gray-900">Secure & Private</h3>
                <p className="flex-auto">BYOK (Bring Your Own Key) for total privacy, or use our secure SaaS cloud.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
