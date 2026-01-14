
import React, { useState } from 'react';
import { Page } from '../types';
import { adminLogin } from '../lib/api';

interface AdminLoginProps {
    onLogin: () => void;
    onNavigate: (page: Page) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onNavigate }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Use 'admin' as default username for password-only login
            const response = await adminLogin('admin', password);
            if (response.success) {
                onLogin();
            } else {
                setError('Invalid password');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-hudt-light min-h-screen py-16 px-4 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-fade-in-up">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <span className="text-4xl">🎭</span>
                    </div>
                    <h2 className="text-3xl font-black text-purple-900 mb-2">Admin Portal</h2>
                    <p className="text-gray-500 font-medium">Enter password to access dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl text-center font-bold animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-semibold text-center text-lg tracking-widest"
                            required
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 bg-gradient-to-r from-purple-600 to-amber-600 text-white font-black rounded-xl shadow-xl transform transition-all hover:scale-105 flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                            </>
                        ) : (
                            'Access Dashboard'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => onNavigate(Page.HOME)}
                        className="text-purple-600 hover:text-purple-800 font-bold transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
