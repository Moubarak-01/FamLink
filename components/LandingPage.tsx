import React from 'react';

interface LandingPageProps {
    onFinish: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFinish }) => {
    return (
        <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black text-white p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">FamLink</h1>
            <p className="text-xl mb-8 text-gray-400">Connecting families with trusted care.</p>
            <button
                onClick={onFinish}
                className="px-8 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-full font-bold text-lg transition-colors"
            >
                Enter Platform
            </button>
        </div>
    );
};

export default LandingPage;
