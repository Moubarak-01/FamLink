
import React, { useState, useRef, useEffect } from 'react';
import { User, Notification } from '../types';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggleButton from './ThemeToggleButton';

interface HeaderProps {
    isAuthenticated: boolean;
    user: User | null;
    onLogout: () => void;
    onEditProfile?: () => void;
    onViewSubscription?: () => void;
    notifications?: Notification[];
    onClearNotifications?: () => void;
    onNotificationClick?: (notification: Notification) => void;
}

const Header: React.FC<HeaderProps> = ({isAuthenticated, user, onLogout, onEditProfile, onViewSubscription, notifications = [], onClearNotifications, onNotificationClick}) => {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasSettings = onEditProfile || onViewSubscription;
  const unreadCount = notifications.length;

  return (
    <header 
        className="w-full backdrop-blur-sm border-b sticky top-0 z-10 transition-colors duration-300"
        style={{ 
            backgroundColor: 'var(--header-bg)', 
            borderColor: 'var(--header-border)' 
        }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-[var(--accent-primary)] animate-subtle-glow">
              FamLink ✨
            </h1>
            <p className="text-sm text-[var(--header-text)]">{t('header_tagline')}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector />
          <ThemeToggleButton />
          {isAuthenticated && user && (
              <div className="flex items-center gap-4">
                  
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                      <button
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="p-2 rounded-full bg-[var(--header-icon-bg)] text-[var(--header-icon-fg)] hover:text-[var(--accent-primary)] transition-colors relative"
                          title="Notifications"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {unreadCount > 0 && (
                              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                          )}
                      </button>
                      {showNotifications && (
                          <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-md shadow-lg py-1 border border-[var(--border-color)] z-50 max-h-96 overflow-y-auto">
                              <div className="px-4 py-2 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
                                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Notifications</span>
                                  {unreadCount > 0 && onClearNotifications && (
                                      <button onClick={onClearNotifications} className="text-xs text-[var(--accent-primary)] hover:underline">Clear all</button>
                                  )}
                              </div>
                              {notifications.length > 0 ? (
                                  notifications.map((notif) => (
                                      <button 
                                          key={notif.id} 
                                          onClick={() => {
                                              setShowNotifications(false);
                                              if (onNotificationClick) onNotificationClick(notif);
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] border-b border-[var(--border-color)] last:border-none transition-colors flex flex-col gap-1"
                                      >
                                          <div className="flex justify-between items-start w-full">
                                              <p className="text-sm text-[var(--text-primary)] font-medium line-clamp-2">{notif.message}</p>
                                              {notif.type === 'chat' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Chat</span>}
                                          </div>
                                          <p className="text-xs text-[var(--text-light)]">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      </button>
                                  ))
                              ) : (
                                  <div className="px-4 py-6 text-center text-sm text-[var(--text-light)]">
                                      No new notifications
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="hidden sm:block text-right">
                      <p className="text-sm text-[var(--header-text)]">{t('header_welcome')}, <span className="font-semibold text-[var(--header-text-strong)]">{user.fullName.split(' ')[0]}</span>!</p>
                  </div>
                  
                  {hasSettings && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowMenu(!showMenu)} 
                            className="p-2 rounded-full bg-[var(--header-icon-bg)] text-[var(--header-icon-fg)] hover:text-[var(--accent-primary)] transition-colors relative" 
                            title={t('button_settings')}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-md shadow-lg py-1 border border-[var(--border-color)] z-50">
                                {onEditProfile && (
                                    <button
                                        onClick={() => {
                                            onEditProfile();
                                            setShowMenu(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                    >
                                        {t('menu_edit_profile')}
                                    </button>
                                )}
                                {onViewSubscription && (
                                    <button
                                        onClick={() => {
                                            onViewSubscription();
                                            setShowMenu(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                    >
                                        {t('menu_subscription_status')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                  )}

                  <button onClick={onLogout} className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors">
                      {t('button_logout')}
                  </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
