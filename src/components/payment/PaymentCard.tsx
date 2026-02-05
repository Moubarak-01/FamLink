import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PaymentCardProps {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
    isFlipped: boolean;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
    cardNumber,
    cardHolder,
    expiry,
    cvv,
    isFlipped,
}) => {
    const [brand, setBrand] = useState<'visa' | 'mastercard' | 'chip'>('chip');

    useEffect(() => {
        if (cardNumber.startsWith('4')) {
            setBrand('visa');
        } else if (cardNumber.startsWith('5')) {
            setBrand('mastercard');
        } else {
            setBrand('chip');
        }
    }, [cardNumber]);

    const formattedCardNumber = React.useMemo(() => {
        // Pad with # to ensure 16 characters for the mask
        const padded = cardNumber.padEnd(16, '#');
        // Group by 4
        return (padded.match(/.{1,4}/g) || []).join(' ');
    }, [cardNumber]);

    return (
        <div className="w-96 h-60 min-w-[24rem] min-h-[15rem] relative" style={{ perspective: '1200px' }}>
            <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(to bottom right, #2563eb, #10b981)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backfaceVisibility: 'hidden',
                        // Ensure the gradient is visible if backdrop-filter isn't supported or no content behind
                        zIndex: 2
                    }}
                >
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-white/10" />

                    <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
                        <div className="flex justify-between items-start">
                            {/* Chip / Brand Icon */}
                            <div className="w-12 h-10 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm opacity-80" />

                            <AnimatePresence mode='wait'>
                                {brand === 'visa' && (
                                    <motion.div
                                        key="visa"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="font-bold text-2xl italic tracking-tighter"
                                    >
                                        VISA
                                    </motion.div>
                                )}
                                {brand === 'mastercard' && (
                                    <motion.div
                                        key="mastercard"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-red-500/80 -mr-3 z-10" />
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/80" />
                                    </motion.div>
                                )}
                                {brand === 'chip' && (
                                    <motion.div
                                        key="default"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-2xl font-mono tracking-wider overflow-hidden">
                                <AnimatePresence mode='popLayout'>
                                    {formattedCardNumber.split('').map((char, index) => (
                                        <motion.span
                                            key={`${index}-${char}`}
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -10, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="inline-block"
                                        >
                                            {char}
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex justify-between items-end uppercase text-xs tracking-widest font-semibold text-white/80">
                            <div className='flex flex-col'>
                                <span className="text-[0.6rem] mb-1 opacity-70">Card Holder</span>
                                <span className="text-sm truncate max-w-[170px]">{cardHolder || 'YOUR NAME'}</span>
                            </div>
                            <div className='flex flex-col items-end'>
                                <span className="text-[0.6rem] mb-1 opacity-70">Expires</span>
                                <span className="text-sm">{expiry || 'MM/YY'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden"
                    style={{
                        background: 'linear-gradient(to bottom right, #2563eb, #10b981)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        zIndex: 1
                    }}
                >
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-white/10" />

                    <div className="relative z-10 flex flex-col h-full py-6">
                        <div className="w-full h-12 bg-black/80 mb-6" /> {/* Magnetic Strip */}

                        <div className="px-6 relative">
                            <div className="w-full h-10 bg-white/90 rounded-sm flex items-center justify-end px-3">
                                <span className="text-black font-mono font-bold tracking-widest text-lg">
                                    {cvv || '***'}
                                </span>
                            </div>
                            <span className="text-[0.6rem] text-white/80 uppercase tracking-wider mt-1 block text-right pr-1">
                                CVV
                            </span>
                        </div>

                        {/* Decorative Hologramish thing */}
                        <div className="mt-4 px-6 flex justify-end opacity-50">
                            <div className="w-12 h-8 rounded border border-white/30 grid grid-cols-2 gap-0.5 p-0.5">
                                <div className="bg-white/20 rounded-sm" />
                                <div className="bg-white/10 rounded-sm" />
                                <div className="bg-white/10 rounded-sm" />
                                <div className="bg-white/20 rounded-sm" />
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentCard;
