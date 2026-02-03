
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface VerifyEmailScreenProps {
    onLogin: () => void;
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ onLogin }) => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            // Parse token from window.location instead of useSearchParams
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await api.get(`/auth/verify?token=${token}`);
                setStatus('success');
                setMessage('Email verified successfully!');
                // Auto-redirect after 3 seconds, or let user click
                setTimeout(() => {
                    // Remove query params to clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    onLogin();
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        verify();
    }, [onLogin]);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-auto my-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                {status === 'verifying' && (
                    <div className="text-5xl mb-6 animate-pulse">⏳</div>
                )}
                {status === 'success' && (
                    <div className="text-5xl mb-6">✅</div>
                )}
                {status === 'error' && (
                    <div className="text-5xl mb-6">❌</div>
                )}

                <h2 className="text-2xl font-bold mb-4 dark:text-white">Email Verification</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">{message}</p>

                {status !== 'verifying' && (
                    <button
                        onClick={() => {
                            window.history.replaceState({}, document.title, window.location.pathname);
                            onLogin();
                        }}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full"
                    >
                        {status === 'success' ? 'Go to Login' : 'Back to Login'}
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmailScreen;
