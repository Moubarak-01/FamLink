import React from 'react';
import ThreeHero from './ThreeHero';

interface LandingPageProps {
    onFinish: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFinish }) => {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <ThreeHero onFinish={onFinish} />
        </div>
    );
};

export default LandingPage;
