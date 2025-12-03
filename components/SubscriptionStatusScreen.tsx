
import React from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionStatusScreenProps {
  user: User;
  onCancelSubscription: () => void;
  onBack: () => void;
}

const SubscriptionStatusScreen: React.FC<SubscriptionStatusScreenProps> = ({ user, onCancelSubscription, onBack }) => {
  const { t } = useLanguage();
  const subscription = user.subscription;

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('dashboard_subscription_details_title')}</h2>
        <p className="text-[var(--text-secondary)]">{t('subscription_subtitle')}</p>
      </div>

      <div className="max-w-md mx-auto bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-color)] p-6 mb-8">
        {subscription ? (
          <div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">{t('dashboard_plan_label')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{t('plan_parent_name')}</span>
              </div>
              <div className="flex justify-between items-center p-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)]">{t('dashboard_status')}</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${subscription.status === 'canceled' ? 'bg-[var(--bg-status-red)] text-[var(--text-status-red)]' : 'bg-[var(--bg-status-green)] text-[var(--text-status-green)]'}`}>
                  {subscription.status === 'canceled' ? t('status_canceled') : t('status_active')}
                </span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-[var(--text-secondary)]">{subscription.status === 'canceled' ? t('dashboard_expires_on') : t('dashboard_renews_on')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{subscription.renewalDate}</span>
              </div>
            </div>
            
            <div className="mt-8">
                 <button
                    onClick={onCancelSubscription}
                    disabled={subscription.status === 'canceled'}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                >
                    {subscription.status === 'canceled' ? t('button_subscription_canceled') : t('button_cancel_subscription')}
                </button>
            </div>
           
          </div>
        ) : (
             <div className="text-center py-8">
                 <p className="text-[var(--text-secondary)] mb-4">You do not have an active subscription.</p>
             </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-start">
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full"
        >
          {t('button_back')}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionStatusScreen;
