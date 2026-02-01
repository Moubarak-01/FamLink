import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Check } from 'lucide-react';

interface DeleteButtonProps {
    onDelete: () => void;
    className?: string; // Allow custom positioning classes
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, className = '' }) => {
    return (
        <motion.button
            onClick={(e) => {
                e.stopPropagation();
                onDelete();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-2 p-2 rounded-full text-red-500 bg-white/90 shadow-sm hover:bg-red-50 border border-red-100 transition-all ${className}`}
            title="Delete"
        >
            <Trash2 size={16} />
        </motion.button>
    );
};

export default DeleteButton;
