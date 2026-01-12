import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Scheduler({ session }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({ topic: '', date: '', time: '', autoPost: false });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, [session]);

    async function fetchSchedule() {
        try {
            const res = await fetch(`${API_URL}/schedule`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (data.success) setPosts(data.schedule);
        } catch (e) {
            console.error("Fetch Schedule Error", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd(e) {
        e.preventDefault();
        setError('');

        if (!acceptedTerms && newPost.autoPost) {
            setError("You must accept the T&C to enable Auto-Post.");
            return;
        }

        const scheduledTime = new Date(`${newPost.date}T${newPost.time}`);
        if (scheduledTime <= new Date()) {
            setError("Time must be in the future.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/schedule`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    topic: newPost.topic,
                    scheduled_time: scheduledTime.toISOString(),
                    auto_post: newPost.autoPost,
                    custom_instructions: ""
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setPosts([...posts, data.item]);
                setNewPost({ ...newPost, topic: '' }); // Reset topic only
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError(e.message);
        }
    }

    async function handleDelete(id) {
        try {
            await fetch(`${API_URL}/schedule/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            setPosts(posts.filter(p => p.id !== id));
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="space-y-8">
            {/* Add New Schedule Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Schedule New Post
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Idea</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., The future of AI in Marketing..."
                            value={newPost.topic}
                            onChange={e => setNewPost({...newPost, topic: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                value={newPost.date}
                                onChange={e => setNewPost({...newPost, date: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input 
                                type="time" 
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                value={newPost.time}
                                onChange={e => setNewPost({...newPost, time: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="autoPost" 
                                checked={newPost.autoPost}
                                onChange={e => setNewPost({...newPost, autoPost: e.target.checked})}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label htmlFor="autoPost" className="font-semibold text-gray-800 text-sm">Enable Auto-Pilot Posting</label>
                        </div>
                        
                        {newPost.autoPost && (
                            <div className="ml-6">
                                <div className="flex items-start gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="terms"
                                        checked={acceptedTerms}
                                        onChange={e => setAcceptedTerms(e.target.checked)}
                                        className="mt-1 h-3 w-3 text-blue-600 rounded"
                                    />
                                    <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                                        I authorize LinkedInVibe to post this content on my behalf. I understand that I am responsible for the content generated.
                                        <br/>
                                        <span className="text-blue-600">Note: Browser Extension must be active for auto-posting.</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Schedule Post
                    </button>
                </form>
            </div>

            {/* List View */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
                {loading ? (
                    <p className="text-gray-500 animate-pulse">Loading schedule...</p>
                ) : posts.length === 0 ? (
                    <p className="text-gray-500 italic">No posts scheduled.</p>
                ) : (
                    <div className="space-y-3">
                        {posts.map(post => (
                            <div key={post.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{post.topic}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(post.scheduled_time).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(post.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            post.status === 'posted' ? 'bg-green-100 text-green-700' : 
                                            post.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {post.status.toUpperCase()}
                                        </span>
                                        
                                        {post.auto_post && (
                                            <span className="flex items-center gap-1 text-blue-600 font-medium text-xs">
                                                <AlertCircle className="w-3 h-3" /> Auto-Pilot
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
