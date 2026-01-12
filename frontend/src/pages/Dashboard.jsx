import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Check, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

import Scheduler from '../components/Scheduler';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [credits, setCredits] = useState(null);
 
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
      if(session?.access_token) {
          navigator.clipboard.writeText(session.access_token);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

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
                    Copy this access token and paste it into the LinkedInVibe extension to enable Pro features.
                </p>
                
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <code className="text-xs font-mono text-gray-800 break-all flex-1 line-clamp-1">
                        {session.access_token}
                    </code>
                    <button 
                        onClick={copyToken}
                        className="p-2 hover:bg-gray-200 rounded-md transition"
                        title="Copy Token"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                </div>
                <p className="text-xs text-red-500 mt-2">
                    Warning: This token grants access to your account. Do not share it.
                </p>
            </div>

            {/* Subscription Section Placeholder */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white transition-all transform hover:scale-[1.01]">
                <h2 className="text-lg font-semibold mb-2">💎 Pro Subscription</h2>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="opacity-90 mb-1">Current Plan: <strong>Free Trial</strong></p>
                        <div className="text-sm bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                            ✨ <strong>{credits !== null ? credits : '...'}</strong> credits remaining
                        </div>
                    </div>
                    
                    <Link to="/pricing" className="bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-gray-50 transition-colors">
                        Upgrade to Pro
                    </Link>
                </div>
            </div>
        </>
      ) : (
          <Scheduler session={session} />
      )}
    </div>
  );
}
