import React from 'react';
import { motion } from 'framer-motion';

interface GlassFormProps {
    email: string;
    setEmail: (email: string) => void;
    password?: string;
    setPassword?: (password: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onSignUp?: () => void;
    onForgotPassword?: () => void;
    error?: string | null;
    variant?: 'login' | 'register';
    fullName?: string;
    setFullName?: (name: string) => void;
}

export default function GlassForm({
    email, setEmail, password, setPassword, onSubmit, onSignUp, onForgotPassword, error, variant = 'login', fullName, setFullName
}: GlassFormProps) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
            className="w-full max-w-md p-8 relative z-10"
        >
            <div className="auth-glass-card dark:auth-glass-card p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                {/* Decorative gradients inside the card */}
                <div className="absolute top-0 -left-1/2 w-full h-full bg-gradient-to-br from-transparent to-white/10 dark:to-white/5 pointer-events-none transform rotate-12" />

                <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white text-center font-outfit">
                    {variant === 'login' ? 'Welcome Back' : 'Register now'}
                </h2>
                <p className="text-slate-500 dark:text-slate-300 text-center mb-8 text-sm">
                    {variant === 'login' ? 'Sign in to continue to FamLink.' : 'Join the FamLink community today.'}
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <form className="space-y-5" onSubmit={onSubmit}>
                    {variant === 'register' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                                What's your name?
                            </label>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName?.(e.target.value)}
                                className="auth-input w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-slate-400 text-slate-800 dark:text-white backdrop-blur-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                            Enter your email
                        </label>
                        <input
                            type="email"
                            placeholder="jane@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-slate-400 text-slate-800 dark:text-white backdrop-blur-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                            {variant === 'login' ? 'Your password' : 'Create password'}
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword?.(e.target.value)}
                            className="auth-input w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder-slate-400 text-slate-800 dark:text-white backdrop-blur-sm"
                        />
                    </div>

                    {/* Forgot Password Link (Login Only) */}
                    {variant === 'login' && onForgotPassword && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-xs text-pink-500 hover:text-pink-400 transition-colors font-medium"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-pink-500/30 transition-shadow relative overflow-hidden group"
                    >
                        <span className="relative z-10">{variant === 'login' ? 'Sign In' : 'Next'}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    </motion.button>
                </form>

                {/* Role Switcher / Toggle */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {variant === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={onSignUp || (() => { })} // In a real app this would toggle mode
                            className="ml-1 text-pink-500 hover:text-pink-400 font-bold hover:underline transition-all"
                        >
                            {variant === 'login' ? "Sign Up" : "Log In"}
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
