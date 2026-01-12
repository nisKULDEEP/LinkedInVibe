import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Check, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { logAnalyticsEvent } from '../lib/firebase';

import Scheduler from '../components/Scheduler';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [credits, setCredits] = useState(null);
  const [extensionReady, setExtensionReady] = useState(false);
  const [tokensSent, setTokensSent] = useState(false);
 
  const location = useLocation();

  useEffect(() => {
    // Basic Deep Linking
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'scheduler') {
      setActiveTab('scheduler');
    }
  }, [location]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits, subscription_status')
            .eq('id', userId)
            .single();
        
        if (data) {
            setCredits(data.credits);
        }
      } catch (e) {
          console.error("Error fetching profile", e);
      } finally {
          setLoading(false);
      }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/LinkedInVibe/#/dashboard`,
      },
    });
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setCredits(null);
      setActiveTab('overview');
  };
  
  const copyToken = () => {
      if(session?.access_token && session?.refresh_token) {
          const tokenData = JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token
          });
          navigator.clipboard.writeText(tokenData);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  // Send tokens directly to extension
  const sendToExtension = () => {
      if(session?.access_token && session?.refresh_token) {
          window.dispatchEvent(new CustomEvent('linkedinvibe-tokens', {
              detail: {
                  accessToken: session.access_token,
                  refreshToken: session.refresh_token,
                  username: session.user?.email?.split('@')[0] || ''
              }
          }));
      }
  };

  const trackDownload = (source) => {
    logAnalyticsEvent('download_extension', { source });
  };

  // Detect extension
  useEffect(() => {
      const handleExtensionReady = () => setExtensionReady(true);
      const handleTokensSaved = (e) => {
          if (e.detail?.success) {
              setTokensSent(true);
              setTimeout(() => setTokensSent(false), 3000);
          }
      };
      
      window.addEventListener('linkedinvibe-extension-ready', handleExtensionReady);
      window.addEventListener('linkedinvibe-tokens-saved', handleTokensSaved);
      
      return () => {
          window.removeEventListener('linkedinvibe-extension-ready', handleExtensionReady);
          window.removeEventListener('linkedinvibe-tokens-saved', handleTokensSaved);
      };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {authLoading ? 'Sending Magic Link...' : 'Sign in with Magic Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Logged in as {session.user.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-blue-900/5 p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition ${
              activeTab === 'overview'
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition ${
              activeTab === 'scheduler'
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
            }`}
          >
            Scheduler
          </button>
      </div>

      {activeTab === 'overview' ? (
        <>
            {/* Token Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-2">🔌 Connect Extension</h2>
                <p className="text-gray-600 text-sm mb-4">
                    Copy these tokens and paste them into the LinkedInVibe extension. The extension will auto-refresh when tokens expire!
                </p>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Access Token (expires in ~1h)</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <code className="text-xs font-mono text-gray-800 break-all flex-1 line-clamp-1">
                                {session.access_token?.substring(0, 50)}...
                            </code>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Refresh Token (long-lived)</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <code className="text-xs font-mono text-gray-800 break-all flex-1 line-clamp-1">
                                {session.refresh_token?.substring(0, 50)}...
                            </code>
                        </div>
                    </div>
                </div>
                
                {/* Extension Connection Section */}
                {tokensSent ? (
                    // SUCCESS STATE - Connected
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <div className="text-4xl mb-2 animate-bounce">✅</div>
                        <p className="text-green-800 font-semibold">Connected Successfully!</p>
                        <p className="text-green-600 text-sm mt-1">
                            Go back to the extension and click<br/>
                            <strong>"Connect & Start"</strong> to finish setup.
                        </p>
                    </div>
                ) : extensionReady ? (
                    // EXTENSION DETECTED - Show Connect
                    <div className="mt-4">
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                            <span className="text-green-700 text-sm font-medium">✅ Extension Detected</span>
                        </div>
                        <button 
                            onClick={sendToExtension}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-lg"
                        >
                            🔌 Connect to Extension
                        </button>
                    </div>
                ) : (
                    // EXTENSION NOT DETECTED - Show Install
                    <div className="mt-4">
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <span className="text-yellow-700 text-sm font-medium">⚠️ Extension Not Detected</span>
                        </div>
                        <a 
                            href="https://github.com/nisKULDEEP/LinkedInVibe/raw/main/linkedinvibe-extension.zip"
                            download
                            onClick={() => trackDownload('dashboard_fallback')}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
                        >
                            ⬇️ Download Extension
                        </a>
                        <div className="mt-3 text-xs text-gray-500 text-center">
                            <p className="mb-1"><strong>After downloading:</strong></p>
                            <ol className="text-left list-decimal list-inside space-y-1">
                                <li>Unzip the file</li>
                                <li>Go to <code className="bg-gray-100 px-1 rounded">chrome://extensions</code></li>
                                <li>Enable Developer mode (top right)</li>
                                <li>Click "Load unpacked" → Select folder</li>
                                <li>Refresh this page</li>
                            </ol>
                        </div>
                    </div>
                )}
                
                {!tokensSent && (
                    <p className="text-xs text-red-500 mt-3">
                        Warning: These tokens grant access to your account. Do not share them.
                    </p>
                )}
            </div>

            {/* Current Plan - BYOK */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
                <h2 className="text-lg font-semibold mb-2">🔑 Your Plan</h2>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="opacity-90 mb-1">Current Plan: <strong>BYOK (Bring Your Own Key)</strong></p>
                        <p className="text-sm text-emerald-100">
                            ✅ Unlimited posts using your own Gemini API key
                        </p>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-3xl font-bold">Free</div>
                        <div className="text-sm text-emerald-100">Forever</div>
                    </div>
                </div>
            </div>
        </>
      ) : (
          <Scheduler session={session} />
      )}
    </div>
  );
}
