
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../utils/api';
import { MOCK_USERS } from '../constants';

export const LoginScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
    const [username, setUsername] = useState('hr_admin');
    const [password, setPassword] = useState('123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Try API Login first
            const user = await api.post('/login', { username, password });
            onLogin(user);
        } catch (err) {
            console.warn("API Login failed, checking mocks...", err);
            // Fallback to Mock if API fails (for demo purposes/initial setup)
            // In a real production app, you might remove this fallback
            const found = MOCK_USERS.find(u => u.username === username && u.password === password);
            if (found) {
                 // Clone to avoid reference issues
                 onLogin({...found});
                 // Ideally, we warn the user they are in offline/demo mode
            } else {
                setError('Invalid credentials or Server Unreachable');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">K</div>
                    <h1 className="text-2xl font-bold text-slate-900">KnitWorks HCM</h1>
                    <p className="text-slate-500">Secure Employee Access Portal</p>
                </div>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input className="w-full p-3 border rounded-lg" value={username} onChange={e => setUsername(e.target.value)} disabled={isLoading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input className="w-full p-3 border rounded-lg" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400 font-mono">
                       Login : Password (123)<br/>
                       hr_admin, director, auditor<br/>
                       hod_ops, line_mgr, employee
                    </p>
                </div>
            </div>
        </div>
    )
}
