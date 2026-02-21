import React from 'react';
import Skeleton from '../Skeleton';

export const ProfileSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header / Avatar Area */}
            <div className="flex flex-col items-center mb-8">
                <Skeleton variant="circular" width={120} height={120} className="mb-4" />
                <Skeleton width="40%" height="32px" className="mb-2" />
                <Skeleton width="25%" height="20px" />
            </div>

            {/* Profile Form / Content Area */}
            <div className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)] p-6 sm:p-8">
                <Skeleton width="30%" height="28px" className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i}>
                            <Skeleton width="40%" height="16px" className="mb-2" />
                            <Skeleton width="100%" height="40px" variant="rectangular" />
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    <Skeleton width="20%" height="16px" className="mb-2" />
                    <Skeleton width="100%" height="100px" variant="rectangular" />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <Skeleton width="100px" height="40px" variant="rectangular" />
                    <Skeleton width="120px" height="40px" variant="rectangular" />
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
