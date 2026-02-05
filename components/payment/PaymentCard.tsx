import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type CardTheme = 'midnight' | 'ocean' | 'sunset' | 'gold' | 'royal';

export interface PaymentCardProps {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
    isFlipped: boolean;
    theme?: CardTheme;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
    cardNumber,
    cardHolder,
    expiry,
    cvv,
    isFlipped,
    theme = 'midnight',
}) => {
    const [brand, setBrand] = useState<'visa' | 'mastercard' | 'amex' | 'discover' | 'chip'>('chip');

    useEffect(() => {
        // Basic regex for detection
        const cleanNum = cardNumber.replace(/\D/g, '');
        if (cleanNum.startsWith('4')) {
            setBrand('visa');
        } else if (/^5[1-5]/.test(cleanNum)) {
            setBrand('mastercard');
        } else if (/^3[47]/.test(cleanNum)) {
            setBrand('amex');
        } else if (/^6(?:011|5)/.test(cleanNum)) {
            setBrand('discover');
        } else {
            setBrand('chip');
        }
    }, [cardNumber]);

    const displayedCardNumber = React.useMemo(() => {
        const cleanNum = cardNumber.replace(/\D/g, '');
        const maxLength = 16;
        const padded = cleanNum.padEnd(maxLength, '#');

        // Secure Masking Logic: Show First 4, Mask Middle, Show Last 2
        let result = '';
        for (let i = 0; i < maxLength; i++) {
            if (i < 4) {
                result += padded[i];
            } else if (i >= maxLength - 2) {
                // Last 2 digits only
                result += padded[i];
            } else {
                if (i < cleanNum.length) {
                    result += '*';
                } else {
                    result += '#';
                }
            }
        }
        return (result.match(/.{1,4}/g) || []).join(' ');
    }, [cardNumber]);

    const themes: Record<CardTheme, React.CSSProperties> = {
        midnight: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
            boxShadow: '0 25px 80px -15px rgba(15, 52, 96, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        },
        ocean: {
            background: 'radial-gradient(ellipse at 20% 80%, #1e3a5f 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0d47a1 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #4fc3f7 0%, transparent 60%), linear-gradient(135deg, #0d1b2a 0%, #1b3a4b 40%, #2d5a6b 70%, #0d1b2a 100%)',
            boxShadow: '0 25px 80px -15px rgba(13, 71, 161, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
        },
        sunset: {
            background: 'radial-gradient(ellipse at 30% 70%, #7c3aed 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #f43f5e 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, #fb7185 0%, transparent 40%), linear-gradient(135deg, #4c1d95 0%, #6d28d9 30%, #be185d 70%, #4c1d95 100%)',
            boxShadow: '0 25px 80px -15px rgba(124, 58, 237, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
        },
        gold: {
            background: 'radial-gradient(ellipse at 20% 30%, #ffd700 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, #b8860b 0%, transparent 40%), linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 30%, #1a1a1a 60%, #2d2d2d 100%)',
            boxShadow: '0 25px 80px -15px rgba(184, 134, 11, 0.4), inset 0 0 0 1px rgba(255, 215, 0, 0.3)',
        },
        royal: {
            background: 'radial-gradient(ellipse at 10% 90%, #06b6d4 0%, transparent 40%), radial-gradient(ellipse at 90% 10%, #8b5cf6 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, #3b0764 0%, transparent 60%), linear-gradient(135deg, #0c0a20 0%, #1e1b4b 30%, #312e81 60%, #0c0a20 100%)',
            boxShadow: '0 25px 80px -15px rgba(139, 92, 246, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }
    };

    const currentTheme = themes[theme] || themes.midnight;

    return (
        <div className="w-96 h-60 min-w-[24rem] min-h-[15rem] relative group" style={{ perspective: '1200px' }}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden text-white transition-all duration-500"
                    style={{
                        ...currentTheme,
                        backfaceVisibility: 'hidden',
                        zIndex: 2
                    }}
                >
                    {/* Texture / Noise Overlay */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}
                    />
                    {/* Shine Effect */}
                    <div className="absolute -inset-[100%] top-0 block h-[200%] w-[200%] -rotate-45 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 p-7 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            {/* Chip */}
                            <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-sm border border-yellow-300/50 flex flex-col justify-center items-center overflow-hidden relative">
                                <div className="absolute inset-0 border border-black/20 rounded-md" />
                                <div className="w-full h-[1px] bg-black/20 my-1" />
                                <div className="h-full w-[1px] bg-black/20 mx-1 absolute" />
                            </div>

                            <AnimatePresence mode='wait'>
                                {brand === 'visa' && (
                                    <motion.div
                                        key="visa"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="font-bold text-3xl italic tracking-tighter text-white"
                                    >
                                        VISA
                                    </motion.div>
                                )}
                                {brand === 'mastercard' && (
                                    <motion.div
                                        key="mastercard"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-red-500/90 -mr-4 z-10 mix-blend-screen" />
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/90 mix-blend-screen" />
                                    </motion.div>
                                )}
                                {brand === 'amex' && (
                                    <motion.div
                                        key="amex"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="font-bold text-xl tracking-tighter border-2 border-white px-2 py-1 rounded-sm"
                                    >
                                        AMEX
                                    </motion.div>
                                )}
                                {brand === 'discover' && (
                                    <motion.div
                                        key="discover"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="font-bold text-xl tracking-tight text-white"
                                    >
                                        DISCOVER
                                    </motion.div>
                                )}
                                {brand === 'chip' && <div className="h-8" />}
                            </AnimatePresence>
                        </div>

                        <div className="py-2">
                            <div className="flex justify-between items-center text-[26px] font-mono tracking-widest text-shadow-md">
                                <AnimatePresence mode='popLayout'>
                                    {displayedCardNumber.split('').map((char, index) => (
                                        <motion.span
                                            key={`${index}-${char}`}
                                            initial={{ y: 5, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.15 }}
                                            className="inline-block w-[14px] text-center"
                                        >
                                            {char === '#' ? <span className="opacity-20">•</span> : char}
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex justify-between items-end uppercase text-xs tracking-widest font-bold text-white/60">
                            <div className='flex flex-col gap-1'>
                                <span className="text-[0.55rem] tracking-[0.2em] opacity-50">Card Holder</span>
                                <span className="text-sm text-white truncate max-w-[280px]">{cardHolder || 'FULL NAME'}</span>
                            </div>
                            <div className='flex flex-col gap-1 items-end'>
                                <span className="text-[0.55rem] tracking-[0.2em] opacity-50">Expires</span>
                                <span className="text-sm text-white">{expiry || 'MM/YY'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden bg-[#0a0a0a]"
                    style={{
                        ...currentTheme,
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        zIndex: 1
                    }}
                >
                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}
                    />

                    <div className="relative z-10 flex flex-col h-full py-8">
                        <div className="w-full h-14 bg-black mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/50 to-transparent" />
                        </div>

                        <div className="px-8 relative">
                            <div className="flex justify-end mb-1">
                                <span className="text-[0.6rem] text-white/50 uppercase tracking-wider pr-1">CVV</span>
                            </div>
                            <div className="w-full h-10 bg-white rounded flex items-center justify-end px-3 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 6px)' }}></div>
                                <span className="text-black font-mono font-bold tracking-widest text-lg z-10">
                                    {cvv || '***'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto px-8 flex justify-between items-center opacity-40">
                            <span className="text-[0.5rem] max-w-[120px] leading-tight text-white">This card is property of FamLink Inc. use subject to terms.</span>
                            <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white/50 rounded-full" />
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentCard;
