import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

    let variantClasses = '';
    switch (variant) {
        case 'circular':
            variantClasses = 'rounded-full';
            break;
        case 'rectangular':
            variantClasses = 'rounded-xl';
            break;
        case 'text':
        default:
            variantClasses = 'rounded';
            height = height || '1em'; // default text height
            break;
    }

    // Handle inline styles for explicit w/h if provided as numbers or specific strings
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
