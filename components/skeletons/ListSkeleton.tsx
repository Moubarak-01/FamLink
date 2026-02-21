import React from 'react';
import Skeleton from '../Skeleton';

export const ListSkeleton: React.FC = () => {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
                <Skeleton width="30%" height="32px" />
                <Skeleton width="150px" height="40px" variant="rectangular" />
            </div>

            <div className="bg-[var(--bg-card)] rounded-xl shadow border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                    <Skeleton width="20%" height="24px" />
                </div>

                <div className="divide-y divide-[var(--border-color)]">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <Skeleton variant="circular" width={48} height={48} className="flex-shrink-0" />
                            <div className="flex-grow w-full">
                                <Skeleton width="40%" height="20px" className="mb-2" />
                                <Skeleton width="70%" height="16px" />
                            </div>
                            <div className="w-full sm:w-auto flex gap-2 justify-end">
                                <Skeleton width="80px" height="32px" variant="rectangular" />
                                <Skeleton width="80px" height="32px" variant="rectangular" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ListSkeleton;
