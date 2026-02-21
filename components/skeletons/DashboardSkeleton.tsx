import React from 'react';
import Skeleton from '../Skeleton';
import { useLanguage } from '../../contexts/LanguageContext';

export const DashboardSkeleton: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="w-full">
            {/* 4 Feature Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-5 sm:p-6 flex flex-col justify-between shadow-sm min-h-[160px]">
                        <div>
                            <Skeleton width="60%" height="24px" className="mb-2" />
                            <Skeleton width="90%" height="16px" className="mb-1" />
                            <Skeleton width="80%" height="16px" className="mb-4" />
                        </div>
                        <Skeleton width="100%" height="40px" variant="rectangular" />
                    </div>
                ))}
            </div>

            {/* 2 Column Layout: Bookings and Nannies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{t('dashboard_my_booking_requests')}</h3>
                    </div>
                    <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-[var(--bg-card)] p-5 rounded-xl shadow-lg border border-[var(--border-color)]">
                                <div className="flex justify-center mb-3">
                                    <Skeleton variant="circular" width={64} height={64} />
                                </div>
                                <div className="flex justify-center mb-2">
                                    <Skeleton width="50%" height="24px" />
                                </div>
                                <div className="flex justify-center mb-4">
                                    <Skeleton width="40%" height="40px" />
                                </div>
                                <div className="flex justify-center">
                                    <Skeleton width="30%" height="28px" variant="rectangular" className="rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_added_nannies')}</h3>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[var(--bg-card)] p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-wrap items-center gap-4">
                                <Skeleton variant="circular" width={64} height={64} />
                                <div className="flex-grow">
                                    <Skeleton width="40%" height="20px" className="mb-2" />
                                    <Skeleton width="30%" height="16px" className="mb-1" />
                                    <Skeleton width="60%" height="16px" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks Section Placeholder */}
            <div className="mt-8 mb-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('dashboard_my_tasks')}</h3>
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-[var(--bg-card)] p-3 rounded-lg shadow-sm border border-[var(--border-color)] flex items-start gap-4">
                            <Skeleton width="20px" height="20px" className="mt-1" />
                            <div className="flex-grow">
                                <Skeleton width="70%" height="20px" className="mb-2" />
                                <Skeleton width="30%" height="16px" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
