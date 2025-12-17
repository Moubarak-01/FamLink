import { useState, useEffect, useMemo } from 'react';
import { Screen, User } from '../types';
import { authService } from '../services/authService';
import { useAppData } from './useAppData';
import { useSocketListeners } from './useSocketListeners';
import { socketService } from '../services/socketService';

export const useAppLogic = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Welcome);
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ type: string, item: any } | null>(null);
  
  // NEW STATE: For settings modal visibility
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Auth Check
  useEffect(() => {
      const checkAuth = async () => {
          const token = localStorage.getItem('authToken');
          if (token) {
              try {
                  const profile = await authService.getProfile();
                  setCurrentUser(profile);
                  setCurrentScreen(Screen.Dashboard);
              } catch (e) {
                  localStorage.removeItem('authToken');
              }
          }
      };
      checkAuth();
  }, []);

  // Socket connection
  useEffect(() => { socketService.connect(); }, []);

  // Data Hook
  const data = useAppData(currentUser);

  // Socket Listeners Hook
  useSocketListeners({
      currentUser,
      activeChatId: activeChat?.item?.id || null,
      ...data,
      setActiveChat
  });

  // NEW FUNCTION: Toggle settings
  const toggleSettingsModal = () => {
      setShowSettingsModal(prev => !prev);
  };
  
  // IMPLEMENTATION: Global Keyboard Shortcut Listener (Shift + P)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          
          // Shift + P for Settings
          if (e.shiftKey && e.key === 'P') { 
              e.preventDefault();
              toggleSettingsModal();
          }
          // Note: Other global shortcuts (Shift+N, Shift+A, Ctrl+D) would be implemented here
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
          document.removeEventListener('keydown', handleKeyDown);
      };
  }, []);
  
  // Nav
  const navigateTo = (screen: Screen, replace = false) => {
      setError(null);
      if (replace) setScreenHistory([]);
      else setScreenHistory([...screenHistory, currentScreen]);
      setCurrentScreen(screen);
  };

  const goBack = () => {
      setError(null);
      const prev = screenHistory.pop();
      if (prev !== undefined) {
          setScreenHistory([...screenHistory]);
          setCurrentScreen(prev);
      } else {
          setCurrentScreen(Screen.Welcome);
      }
  };

  return {
      currentUser, setCurrentUser,
      currentScreen, setCurrentScreen,
      error, setError,
      activeChat, setActiveChat,
      showSettingsModal, toggleSettingsModal, // NEW EXPOSURE
      navigateTo, goBack,
      ...data
  };
};