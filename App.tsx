import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Answer, Screen, UserType, Subscription, Plan, User, NannyProfile, Rating, BookingRequest, Task, Activity, SharedOuting, OutingRequest, SkillRequest, SkillOffer, Child, ActivityCategory, SkillCategory, ChatMessage, Notification, NotificationType } from './types';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import Questionnaire from './components/Questionnaire';
import ResultScreen from './components/ResultScreen';
// FIX: Corrected import to use the service instance, resolving the Uncaught SyntaxError
import { geminiService } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import SubscriptionScreen from './components/SubscriptionScreen';
import DashboardScreen from './components/DashboardScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import NannyProfileForm from './components/NannyProfileForm';
import ParentProfileForm from './components/ParentProfileForm';
import NannyListingScreen from './components/NannyListingScreen';
import { useLanguage } from './contexts/LanguageContext';
import NannyProfileDetailScreen from './components/NannyProfileDetailScreen';
import ContactModal from './components/ContactModal';
import BookingRequestModal from './components/BookingRequestModal';
import TaskModal from './components/TaskModal';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import CommunityActivitiesScreen from './components/CommunityActivitiesScreen';
import CreateActivityModal from './components/CreateActivityModal';
import ChildOutingScreen from './components/ChildOutingScreen';
import CreateOutingModal from './components/CreateOutingModal';
import RequestOutingJoinModal from './components/RequestOutingJoinModal';
import SkillMarketplaceScreen from './components/SkillMarketplaceScreen';
import CreateSkillRequestModal from './components/CreateSkillRequestModal';
import MakeSkillOfferModal from './components/MakeSkillOfferModal';
import ChatModal from './components/ChatModal';
import SubscriptionStatusScreen from './components/SubscriptionStatusScreen';
import AiAssistant, { AiAssistantRef } from './components/AiAssistant';
import SettingsModal from './components/SettingsModal';
import { socketService } from './services/socketService';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { activityService } from './services/activityService';
import { outingService } from './services/outingService';
import { marketplaceService } from './services/marketplaceService';
import { bookingService } from './services/bookingService';
import { notificationService } from './services/notificationService';
import { reviewService } from './services/reviewService';
import { taskService } from './services/taskService';
import { chatService } from './services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { useActivities, useSkillRequests, useTasks, useNotifications, useBookings, useSharedOutings } from './hooks/useFamLinkQueries';

const getAvatarId = (id?: string) => {
  if (!id || typeof id !== 'string') return 0;
  return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 70;
};

interface PendingAction {
  type: 'contact' | 'book';
  nanny: User;
}

const StarRating: React.FC<{ rating: number, setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center text-4xl text-gray-300">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button type="button" key={ratingValue} className={`transition-colors duration-200 ${ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setRating(ratingValue)} onMouseEnter={() => setHover(ratingValue)} onMouseLeave={() => setHover(0)} aria-label={`Rate ${ratingValue} stars`}>
            <span className="star">★</span>
          </button>
        );
      })}
    </div>
  );
};


const RatingModal: React.FC<{ targetUser?: User, nanny?: User, onClose: () => void, onSubmit: (rating: number, comment: string) => void }> = ({ targetUser, nanny, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const userToRate = targetUser || nanny;
  if (!userToRate) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { alert("Please select a star rating."); return; }
    onSubmit(rating, comment);
  };
  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-8 text-center">
          <img src={userToRate.photo} alt={userToRate.fullName} className="w-24 h-24 rounded-full object-cover mx-auto -mt-20 border-4 border-[var(--bg-card)] shadow-lg" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">{t('rating_modal_title', { name: userToRate.fullName.split(' ')[0] })}</h2>
          <p className="text-[var(--text-light)] text-sm mb-6">{t('rating_modal_subtitle')}</p>
          <div className="space-y-4 text-left">
            <div><label className="block text-sm font-medium text-[var(--text-secondary)] text-center mb-2">{t('rating_modal_your_rating')}</label><StarRating rating={rating} setRating={setRating} /></div>
            <div><label htmlFor="comment" className="block text-sm font-medium text-[var(--text-secondary)]">{t('rating_modal_comment_label')}</label><textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder={t('rating_modal_comment_placeholder')} className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]" /></div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4"><button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button><button type="submit" className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50" disabled={rating === 0}>{t('button_submit_rating')}</button></div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Welcome);
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [approvedNannies, setApprovedNannies] = useState<User[]>([]);

  // React Query Setup
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data Hooks
  const { data: activities = [] } = useActivities();
  const { data: skillRequests = [] } = useSkillRequests();
  const { data: sharedOutings = [] } = useSharedOutings();
  const { data: tasks = [] } = useTasks(currentUser?.id || '');
  const { data: notifications = [] } = useNotifications(currentUser?.id || '');
  const { data: bookingRequests = [] } = useBookings(currentUser?.id || '');

  // UI State
  const [hiddenBookingIds, setHiddenBookingIds] = useState<string[]>([]);
  const [userTypeForSignup, setUserTypeForSignup] = useState<UserType>('parent');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const [viewingNannyId, setViewingNannyId] = useState<string | null>(null);
  const [contactNannyInfo, setContactNannyInfo] = useState<User | null>(null);
  const [ratingTargetUser, setRatingTargetUser] = useState<User | null>(null);
  const [bookingNannyInfo, setBookingNannyInfo] = useState<User | null>(null);
  const [taskModalNanny, setTaskModalNanny] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isCreateOutingModalOpen, setIsCreateOutingModalOpen] = useState(false);
  const [requestOutingInfo, setRequestOutingInfo] = useState<SharedOuting | null>(null);
  const [isCreateSkillRequestModalOpen, setIsCreateSkillRequestModalOpen] = useState(false);
  const [makeOfferSkillRequestInfo, setMakeOfferSkillRequestInfo] = useState<SkillRequest | null>(null);
  const [activeChat, setActiveChat] = useState<{ type: 'activity' | 'outing' | 'skill' | 'booking', item: Activity | SharedOuting | SkillRequest | BookingRequest } | null>(null);
  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiVisible, setIsAiVisible] = useState(true); // Added for Shift+A visibility toggle

  const aiAssistantRef = useRef<AiAssistantRef>(null);

  useEffect(() => {
    if (currentUser) {
      socketService.connect(currentUser.id);
    } else {
      socketService.disconnect();
    }

    // Setup Invalidation Listeners
    const unsubMarketplace = socketService.onMarketplaceUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
    });

    const unsubActivity = socketService.onActivityUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    const unsubOuting = socketService.onOutingsUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['outings'] });
    });

    const unsubBookings = socketService.onBookingsUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    const unsubTasks = socketService.onTasksUpdate(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    const unsubscribe = socketService.onMessage(({ roomId, message }) => {
      // 1. Process message (toast, etc.)
      processIncomingMessage(roomId, message);

      // 2. WhatsApp-style "Blue Ticks" & "Delivered":
      if (currentUser && message.senderId !== currentUser.id) {
        if (activeChatRef.current && activeChatRef.current.item.id === roomId) {
          socketService.sendMarkSeen(roomId, message.id);
        } else {
          socketService.sendMarkDelivered(roomId, message.id);
        }
      }

    });

    // FIX: Strict de-duplication for notifications
    const unsubNotif = socketService.onNotification((notif) => {
      // Optimistic update for notifications using React Query
      queryClient.setQueryData(['notifications', currentUser?.id], (old: Notification[] = []) => {
        if (old.some(n => n.id === notif.id)) return old;
        return [notif, ...old];
      });
    });

    return () => {
      unsubscribe();
      unsubNotif();
      unsubMarketplace();
      unsubActivity();
      unsubOuting();
      unsubBookings();
      unsubTasks();
    };
  }, [currentUser, queryClient]);

  // NEW: Auto-clear notifications when entering a Chat or Screen
  useEffect(() => {
    if (activeChat && activeChat.item.id && currentUser) {
      const contextId = activeChat.item.id;

      // 1. Identify notifications related to this chat
      const relevantNotifs = notifications.filter(n => n.relatedId === contextId && !n.read);

      if (relevantNotifs.length > 0) {
        // 2. Mark local state as read immediately via Cache
        queryClient.setQueryData(['notifications', currentUser.id], (old: Notification[] = []) => {
          return old.map(n => n.relatedId === contextId ? { ...n, read: true } : n);
        });

        // 3. Tell backend to mark them read
        relevantNotifs.forEach(n => {
          notificationService.markRead(n.id).catch(console.error);
        });
      }
    }
  }, [activeChat, notifications, currentUser, queryClient]);

  useEffect(() => {
    const unsubscribe = socketService.onStatusUpdate((data) => {
      if (activeChat && activeChat.item.id === data.roomId) {
        setActiveChat(prev => {
          if (!prev) return null;
          const updatedMessages = (prev.item.messages || []).map(msg => {
            if (data.status === 'seen') {
              if (msg.senderId !== data.userId) return { ...msg, status: 'seen' };
            } else if (msg.id === data.messageId) {
              return { ...msg, status: data.status };
            }
            return msg;
          });
          return { ...prev, item: { ...prev.item, messages: updatedMessages } };
        });
      }
    });
    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const profile = await authService.getProfile();
          setCurrentUser(profile);
          // STRICT ENFORCEMENT: Redirect based on profile status, not just existence
          if (profile.userType === 'parent') {
            if (!profile.location) navigateTo(Screen.ParentProfileForm, true);
            else navigateTo(Screen.Dashboard, true);
          } else {
            // Nanny Logic
            if (profile.profile) {
              navigateTo(Screen.Dashboard, true);
            } else if (profile.assessmentResult?.decision === 'Approved') {
              navigateTo(Screen.NannyProfileForm, true);
            } else if (profile.assessmentResult) {
              navigateTo(Screen.Result, true);
            } else {
              navigateTo(Screen.Questionnaire, true);
            }
          }
        } catch (e) {
          localStorage.removeItem('authToken');
        }
      }
    };
    checkAuth();
  }, []);

  // IMPLEMENTATION FIX: Global Keyboard Shortcut Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Prevent shortcut if user is typing in a form field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      // Shift + P to toggle settings modal (NEW IMPLEMENTATION)
      if (e.shiftKey && e.key.toUpperCase() === 'P') {
        e.preventDefault();
        setIsSettingsModalOpen(prev => !prev);
      }

      // Shift + N toggles open/close
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        aiAssistantRef.current?.toggle(); // Corrected method name
      }

      if (e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAiVisible(prev => !prev); // Toggles React State
      }

      // Control + D clears history
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        aiAssistantRef.current?.clearHistory();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); // isSettingsModalOpen is a local state, so no dependencies needed here.

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      await queryClient.invalidateQueries();
    } catch (e) { }
  }, [currentUser, queryClient]);

  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser, refreshData]);

  // Fetch approved nannies when user is logged in
  useEffect(() => {
    const fetchNannies = async () => {
      if (currentUser) {
        try {
          const nanniesRes = await userService.getNannies();
          setApprovedNannies(nanniesRes.filter(n => n.profile));
        } catch (e) {
          console.error("Failed to fetch nannies:", e);
        }
      }
    };
    fetchNannies();
  }, [currentUser]);

  const processIncomingMessage = useCallback((id: string, message: ChatMessage) => {
    // Intentionally empty - notifications handled by 'notification' event
  }, [currentUser]);

  const navigateTo = (screen: Screen, replace = false) => { setError(null); if (replace) setScreenHistory([]); else setScreenHistory([...screenHistory, currentScreen]); setCurrentScreen(screen); };
  const goBack = () => { setError(null); setViewingNannyId(null); const previousScreen = screenHistory.pop(); if (previousScreen !== undefined) { setScreenHistory([...screenHistory]); setCurrentScreen(previousScreen); } else { setCurrentScreen(Screen.Welcome); } };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberedUser');
    setCurrentScreen(Screen.Welcome);
    setScreenHistory([]);
    setCurrentUser(null);
    setError(null);
    setViewingNannyId(null);
    queryClient.clear();
  };
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      await userService.deleteAccount();
      alert("Your account has been permanently deleted.");
      handleLogout();
    } catch (e) {
      alert("Failed to delete account. Please try again.");
    }
  };
  const handleSelectUserType = (type: UserType) => { setUserTypeForSignup(type); navigateTo(Screen.SignUp); };
  const handleSignUp = async (fullName: string, email: string, password: string, userType: UserType) => {
    try {
      const data = await authService.signup(fullName, email, password, userType);
      localStorage.setItem('authToken', data.access_token);
      setCurrentUser(data.user);
      alert(t('alert_signup_success'));

      // FIX: Redirect based on user type
      if (userType === 'nanny') {
        navigateTo(Screen.Questionnaire);
      } else {
        navigateTo(Screen.ParentProfileForm); // Parents go to profile creation
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };
  const handleLogin = async (email: string, password: string, rememberMe: boolean) => { try { const data = await authService.login(email, password); localStorage.setItem('authToken', data.access_token); setCurrentUser(data.user); if (rememberMe) localStorage.setItem('rememberedUser', email); if (data.user.userType === 'parent') { if (!data.user.location) navigateTo(Screen.ParentProfileForm); else navigateTo(Screen.Dashboard); } else { if (data.user.profile) navigateTo(Screen.Dashboard); else if (data.user.assessmentResult?.decision === 'Approved') navigateTo(Screen.NannyProfileForm); else if (data.user.assessmentResult) navigateTo(Screen.Result); else navigateTo(Screen.Questionnaire); } } catch (err: any) { setError(err.response?.data?.message || t('error_invalid_credentials')); } };
  const handleForgotPassword = async (email: string) => { await new Promise(resolve => setTimeout(resolve, 1500)); alert(t('alert_forgot_password_sent')); navigateTo(Screen.Login); };

  const submitAssessment = async (finalAnswers: Answer[]) => {
    if (!currentUser) return;
    setIsLoading(true);
    navigateTo(Screen.Loading);
    try {
      // FIX: Corrected the usage of geminiService instance method
      const assessmentResult = await geminiService.evaluateAnswers(finalAnswers, language);
      let updatedUser = { ...currentUser, assessmentResult };
      await userService.updateProfile({ assessmentResult });
      setCurrentUser(updatedUser);
      // Clear backup on success
      localStorage.removeItem('questionnaire_backup');
      setCurrentScreen(Screen.Result);
    } catch (err) {
      setError(t('error_assessment_evaluation'));
      setCurrentScreen(Screen.Questionnaire);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubscribe = async (plan: Plan) => { if (!currentUser) return; const renewalDate = new Date(); renewalDate.setMonth(renewalDate.getMonth() + 1); const newSubscription: Subscription = { plan, status: 'active', renewalDate: renewalDate.toLocaleDateString() }; try { const updatedUser = await userService.updateProfile({ subscription: newSubscription }); setCurrentUser(updatedUser); alert(t('alert_subscription_success')); if (pendingAction) { const action = { ...pendingAction }; setPendingAction(null); if (action.type === 'contact') setContactNannyInfo(action.nanny); if (action.type === 'book') setBookingNannyInfo(action.nanny); } navigateTo(Screen.Dashboard); } catch (e) { alert("Subscription failed"); } };
  const handleNannyProfileSubmit = async (profileData: any) => { if (!currentUser) return; try { const updatedUser = await userService.updateProfile({ fullName: profileData.fullName, email: profileData.email, photo: profileData.photo, profile: { ...profileData } }); setCurrentUser(updatedUser); alert(t('alert_profile_success')); navigateTo(Screen.Dashboard); } catch (e) { alert("Failed to save profile"); } };
  const handleParentProfileSubmit = async (profileData: any) => { if (!currentUser) return; try { const updatedUser = await userService.updateProfile(profileData); setCurrentUser(updatedUser); alert(t('alert_profile_success')); navigateTo(Screen.Dashboard); } catch (e: any) { console.error("Profile save error:", e); alert(`Failed to save profile: ${e.response?.data?.message || e.message}`); } };
  const handleEditProfile = () => { if (!currentUser) return; currentUser.userType === 'parent' ? navigateTo(Screen.ParentProfileForm) : navigateTo(Screen.NannyProfileForm); };
  const handleViewSubscription = () => navigateTo(Screen.SubscriptionStatus);
  const handleCancelSubscription = async () => { if (currentUser?.subscription) { try { const updatedUser = await userService.updateProfile({ subscription: { ...currentUser.subscription, status: 'canceled' } }); setCurrentUser(updatedUser); } catch (e) { alert("Error canceling subscription"); } } };
  const handleContinueFromResult = () => { if (currentUser?.userType === 'nanny' && currentUser.assessmentResult?.decision === 'Approved') navigateTo(Screen.NannyProfileForm); };

  const handleViewNannyProfile = (nannyId: string) => { setViewingNannyId(nannyId); navigateTo(Screen.NannyProfileDetail); };
  const handleContactAttempt = (nanny: User) => { if (!currentUser) { setPendingAction({ type: 'contact', nanny }); navigateTo(Screen.Login); return; } if (currentUser.subscription?.status === 'active') setContactNannyInfo(nanny); else { setPendingAction({ type: 'contact', nanny }); navigateTo(Screen.Subscription); } };
  const handleAddNanny = async (nannyId: string) => { if (!currentUser) return; try { const updatedUser = await userService.addNanny(nannyId); setCurrentUser(updatedUser); alert(t('alert_nanny_added_dashboard')); } catch (e) { alert("Error adding nanny"); } };
  const handleRemoveNanny = async (nannyId: string) => {
    if (!currentUser) return;
    if (!window.confirm(t('confirm_remove_nanny') || "Remove this nanny from your dashboard?")) return;
    try {
      const updatedUser = await userService.removeNanny(nannyId);
      setCurrentUser(updatedUser);
      alert(t('alert_nanny_removed') || "Nanny removed from your dashboard.");
    } catch (e) {
      alert("Error removing nanny");
    }
  };
  const handleOpenRatingModal = (userToRate: User) => setRatingTargetUser(userToRate);
  const handleSubmitRating = async (targetUserId: string, ratingValue: number, comment: string) => { if (!currentUser) return; try { await reviewService.create(targetUserId, ratingValue, comment); setRatingTargetUser(null); alert(t('alert_rating_success')); const nanniesRes = await userService.getNannies(); setApprovedNannies(nanniesRes.filter(n => n.profile)); } catch (e) { alert("Error submitting rating"); } };
  const handleOpenBookingModal = (nanny: User) => { if (!currentUser) { setPendingAction({ type: 'book', nanny }); navigateTo(Screen.Login); return; } if (currentUser.subscription?.status !== 'active') { setPendingAction({ type: 'book', nanny }); alert(t('alert_subscribe_to_book')); navigateTo(Screen.Subscription); return; } setBookingNannyInfo(nanny); };

  const handleSubmitBookingRequest = async (nannyId: string, date: string, startTime: string, endTime: string, message: string) => {
    if (!currentUser) return;
    try {
      const newBooking = await bookingService.create({ nannyId, date, startTime, endTime, message });
      // Optimistic update
      const populatedBooking = {
        ...newBooking,
        nannyId,
        nanny: approvedNannies.find(n => n.id === nannyId) || { id: nannyId, fullName: 'Nanny', photo: '' },
        parentId: currentUser.id,
        parent: currentUser
      };
      queryClient.setQueryData(['bookings', currentUser.id], (old: BookingRequest[] = []) => [...old, populatedBooking]);
      setBookingNannyInfo(null);
      alert(t('alert_booking_request_sent'));
      queryClient.invalidateQueries({ queryKey: ['bookings', currentUser.id] });
    } catch (e) { alert("Error creating booking"); }
  };

  const handleUpdateBookingStatus = async (requestId: string, status: 'accepted' | 'declined') => { try { await bookingService.updateStatus(requestId, status); queryClient.invalidateQueries({ queryKey: ['bookings'] }); } catch (e) { alert("Error updating booking"); } };
  const handleNannyHideBooking = (id: string) => { if (window.confirm("Remove this from your history?")) { setHiddenBookingIds(prev => [...prev, id]); } };
  const handleCancelBooking = async (id: string) => {
    if (window.confirm("Cancel this request?")) {
      try {
        await bookingService.delete(id);
        queryClient.setQueryData(['bookings', currentUser?.id], (old: BookingRequest[] = []) => old.filter(b => b.id !== id));
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      } catch (e) { alert("Failed to cancel"); }
    }
  };
  const handleClearAllBookings = async () => {
    if (!currentUser) return;
    if (window.confirm(t('confirm_clear_history') || "Clear all history?")) {
      // Optimistic Update
      queryClient.setQueryData(['bookings', currentUser.id], []);

      try {
        await bookingService.deleteAll();
      } catch (e) {
        // Revert on failure (or just alert and re-fetch)
        alert("Failed to clear history");
      } finally {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      }
    }
  };

  const handleOpenTaskModal = (nanny: User) => setTaskModalNanny(nanny);
  const handleAddTask = async (nannyId: string, description: string, dueDate: string) => {
    if (!currentUser) return;
    try {
      const newTask = await taskService.create({ nannyId, description, dueDate });
      queryClient.setQueryData(['tasks', currentUser.id], (old: Task[] = []) => [...old, newTask]);
      setTaskModalNanny(null);
      alert(t('alert_task_added'));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e) { alert("Error adding task"); }
  };

  const handleDeleteTask = async (id: string) => {
    queryClient.setQueryData(['tasks', currentUser?.id], (old: Task[] = []) => old.filter(t => t.id !== id));
    try {
      await taskService.delete(id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e) {
      refreshData();
      alert("Failed to delete task");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'completed') => {
    try {
      const updatedTask = await taskService.updateStatus(taskId, status);
      queryClient.setQueryData(['tasks', currentUser?.id], (old: Task[] = []) => old.map(task => task.id === taskId ? updatedTask : task));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e) { alert("Error updating task status"); }
  };

  const handleKeepTask = async (id: string) => {
    try {
      await taskService.keepTask(id);
      queryClient.setQueryData(['tasks', currentUser?.id], (old: Task[] = []) => old.map(t => t.id === id ? { ...t, keepPermanently: true } : t));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e) { alert("Failed to update task"); }
  };

  const handleOpenCreateActivityModal = () => setIsCreateActivityModalOpen(true);
  const handleCloseCreateActivityModal = () => setIsCreateActivityModalOpen(false);

  const handleCreateActivity = async (activityData: any) => {
    if (!currentUser) return;
    try {
      const newActivity = await activityService.create(activityData);
      const populatedActivity = {
        ...newActivity,
        hostId: currentUser,
        hostName: currentUser.fullName,
        hostPhoto: currentUser.photo,
        participants: [currentUser.id],
        messages: []
      };
      queryClient.setQueryData(['activities'], (old: Activity[] = []) => [populatedActivity, ...old]);
      handleCloseCreateActivityModal();
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch (e) { alert("Error creating activity"); }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Delete this activity?")) return;
    queryClient.setQueryData(['activities'], (old: Activity[] = []) => old.filter(a => a.id !== id));
    try { await activityService.delete(id); queryClient.invalidateQueries({ queryKey: ['activities'] }); } catch (e) { refreshData(); alert("Delete failed"); }
  };

  const handleDeleteAllActivities = async () => {
    if (!window.confirm("Delete all activities?")) return;
    queryClient.setQueryData(['activities'], []);
    try { await activityService.deleteAll(); queryClient.invalidateQueries({ queryKey: ['activities'] }); } catch (e) { refreshData(); alert("Delete all failed"); }
  };

  const handleJoinActivity = async (activityId: string) => {
    if (!currentUser) return;
    try {
      const updatedActivity = await activityService.join(activityId);
      queryClient.setQueryData(['activities'], (old: Activity[] = []) => old.map(act => act.id === activityId ? updatedActivity : act));
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch (e) { alert("Error joining activity"); }
  };

  const handleSendMessage = (id: string, messageText: string) => {
    if (!currentUser) return;
    const tempId = `msg-${Date.now()}`;
    const newMessage: ChatMessage = { id: tempId, senderId: currentUser.id, senderName: currentUser.fullName, senderPhoto: currentUser.photo || `https://i.pravatar.cc/150?img=${getAvatarId(currentUser.id)}`, text: messageText, timestamp: Date.now(), status: 'sent' };

    // Optimistic UI Update for Active Chat
    setActiveChat(prev => {
      if (prev && prev.item.id === id) { return { ...prev, item: { ...prev.item, messages: [...(prev.item.messages || []), newMessage] } }; }
      return prev;
    });

    // Optimistic Cache Update
    const updateCacheCallback = (old: any[] = []) => old.map(item => item.id === id ? { ...item, messages: [...(item.messages || []), newMessage] } : item);
    queryClient.setQueryData(['activities'], (old: Activity[] = []) => updateCacheCallback(old));
    queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => updateCacheCallback(old));
    queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => updateCacheCallback(old));
    queryClient.setQueryData(['bookings', currentUser.id], (old: BookingRequest[] = []) => updateCacheCallback(old));

    socketService.sendMessage(id, newMessage, (savedMessage) => {
      const finalUpdateCallback = (old: any[] = []) => old.map(item => item.id === id ? { ...item, messages: (item.messages || []).map((m: any) => m.id === tempId ? savedMessage : m) } : item);
      queryClient.setQueryData(['activities'], (old: Activity[] = []) => finalUpdateCallback(old));
      queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => finalUpdateCallback(old));
      queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => finalUpdateCallback(old));
      queryClient.setQueryData(['bookings', currentUser.id], (old: BookingRequest[] = []) => finalUpdateCallback(old));

      queryClient.invalidateQueries(); // Ensure eventual consistency

      setActiveChat(prev => {
        if (prev && prev.item.id === id) {
          const updatedMessages = (prev.item.messages || []).map(msg => msg.id === tempId ? savedMessage : msg);
          return { ...prev, item: { ...prev.item, messages: updatedMessages } };
        }
        return prev;
      });
    });
  };

  const handleDeleteMessage = async (contextId: string, messageId: string) => {
    const filterMsgs = (item: any) => ({ ...item, messages: (item.messages || []).filter((m: ChatMessage) => m.id !== messageId) });

    // Optimistic Update
    const cacheUpdate = (old: any[] = []) => old.map(i => i.id === contextId ? filterMsgs(i) : i);
    queryClient.setQueryData(['activities'], (old: Activity[]) => cacheUpdate(old));
    queryClient.setQueryData(['outings'], (old: SharedOuting[]) => cacheUpdate(old));
    queryClient.setQueryData(['skillRequests'], (old: SkillRequest[]) => cacheUpdate(old));
    queryClient.setQueryData(['bookings', currentUser?.id], (old: BookingRequest[]) => cacheUpdate(old));

    setActiveChat(prev => { if (prev && prev.item.id === contextId) return { ...prev, item: filterMsgs(prev.item) }; return prev; });
    try { await chatService.deleteMessage(messageId); queryClient.invalidateQueries(); } catch (e) { alert("Failed to delete message"); }
  };

  const handleDeleteAllMessages = async (contextId: string) => {
    const clearMsgs = (item: any) => ({ ...item, messages: [] });

    // Optimistic Cache Updates
    const cacheUpdate = (old: any[] = []) => old.map(i => i.id === contextId ? clearMsgs(i) : i);

    queryClient.setQueryData(['activities'], (old: Activity[] = []) => cacheUpdate(old));
    queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => cacheUpdate(old));
    queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => cacheUpdate(old));
    // Important: Also update bookings cache specifically
    if (currentUser) {
      queryClient.setQueryData(['bookings', currentUser.id], (old: BookingRequest[] = []) => cacheUpdate(old));
    }

    setActiveChat(prev => { if (prev && prev.item.id === contextId) return { ...prev, item: clearMsgs(prev.item) }; return prev; });

    try {
      await chatService.deleteAllMessages(contextId);
    } catch (e) {
      alert("Failed to delete messages");
    } finally {
      queryClient.invalidateQueries();
    }
  };

  const handleOpenCreateOutingModal = () => setIsCreateOutingModalOpen(true);
  const handleCloseCreateOutingModal = () => setIsCreateOutingModalOpen(false);

  const handleCreateOuting = async (outingData: any) => {
    if (!currentUser) return;
    try {
      const newOuting = await outingService.create(outingData);
      const populatedOuting = {
        ...newOuting,
        hostId: currentUser,
        hostName: currentUser.fullName,
        hostPhoto: currentUser.photo,
        requests: []
      };
      queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => [populatedOuting, ...old]);
      handleCloseCreateOutingModal();
    } catch (e) { alert("Error creating outing"); }
  };

  const handleDeleteOuting = async (id: string) => {
    if (!window.confirm("Delete this outing?")) return;
    queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => old.filter(o => o.id !== id));
    try { await outingService.delete(id); queryClient.invalidateQueries({ queryKey: ['outings'] }); } catch (e) { refreshData(); alert("Delete failed"); }
  };

  const handleDeleteAllOutings = async () => {
    if (!window.confirm("Delete ALL outings?")) return;
    queryClient.setQueryData(['outings'], []);
    try { await outingService.deleteAll(); queryClient.invalidateQueries({ queryKey: ['outings'] }); } catch (e) { refreshData(); alert("Delete all failed"); }
  };

  const handleRequestOutingJoin = async (outing: SharedOuting, childName: string, childAge: number, emergencyContactName: string, emergencyContactPhone: string) => {
    if (!currentUser) return;
    try {
      const updatedOuting = await outingService.requestJoin(outing.id, { childName, childAge, emergencyContactName, emergencyContactPhone });
      queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => old.map(o => o.id === outing.id ? updatedOuting : o));
      setRequestOutingInfo(null);
      alert(t('alert_outing_request_sent'));
    } catch (e) { alert("Error requesting join"); }
  };
  const handleUpdateOutingRequestStatus = async (outingId: string, parentId: string, status: 'accepted' | 'declined') => {
    try {
      const updatedOuting = await outingService.updateRequestStatus(outingId, parentId, status);
      queryClient.setQueryData(['outings'], (old: SharedOuting[] = []) => old.map(o => o.id === outingId ? updatedOuting : o));
      queryClient.invalidateQueries({ queryKey: ['outings'] });
    } catch (e) { alert("Error updating status"); }
  };

  const handleCreateSkillRequest = async (requestData: any) => {
    if (!currentUser) return;
    try {
      const newSkill = await marketplaceService.create(requestData);
      const populatedSkill = {
        ...newSkill,
        requesterId: currentUser,
        requesterName: currentUser.fullName,
        requesterPhoto: currentUser.photo,
        offers: []
      };
      queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => [populatedSkill, ...old]);
      setIsCreateSkillRequestModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
    } catch (e) { alert("Error creating skill request"); }
  };

  const handleDeleteSkillRequest = async (id: string) => {
    if (!window.confirm("Delete this skill request?")) return;
    queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => old.filter(r => r.id !== id));
    try { await marketplaceService.delete(id); queryClient.invalidateQueries({ queryKey: ['skillRequests'] }); } catch (e) { refreshData(); alert("Delete failed"); }
  };

  const handleDeleteAllSkillRequests = async () => {
    if (!window.confirm("Delete ALL skill requests?")) return;
    queryClient.setQueryData(['skillRequests'], []);
    try { await marketplaceService.deleteAll(); queryClient.invalidateQueries({ queryKey: ['skillRequests'] }); } catch (e) { refreshData(); alert("Delete all failed"); }
  };

  const handleMakeSkillOffer = async (request: SkillRequest, offerAmount: number, message: string) => {
    if (!currentUser) return;
    try {
      const updatedSkill = await marketplaceService.makeOffer(request.id, { offerAmount, message });
      queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => old.map(r => r.id === request.id ? updatedSkill : r));
      setMakeOfferSkillRequestInfo(null);
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
    } catch (e) { alert("Error making offer"); }
  };
  const handleUpdateSkillOfferStatus = async (requestId: string, helperId: string, status: 'accepted' | 'declined') => {
    try {
      const updatedSkill = await marketplaceService.updateOfferStatus(requestId, helperId, status);
      queryClient.setQueryData(['skillRequests'], (old: SkillRequest[] = []) => old.map(r => r.id === requestId ? updatedSkill : r));
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
    } catch (e) { alert("Error updating offer"); }
  };
  const handleReportUser = (userId: string) => alert("User reported. Our team will review the case.");

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await notificationService.markRead(notification.id);
      queryClient.setQueryData(['notifications', currentUser?.id], (old: Notification[] = []) => old.map(n => n.id === notification.id ? { ...n, read: true } : n));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) { }

    if (notification.type === 'chat' && notification.relatedId) {
      const act = activities.find(a => a.id === notification.relatedId);
      if (act) { setActiveChat({ type: 'activity', item: act }); return; }
      const out = sharedOutings.find(o => o.id === notification.relatedId);
      if (out) { setActiveChat({ type: 'outing', item: out }); return; }
      const skill = skillRequests.find(s => s.id === notification.relatedId);
      if (skill) { setActiveChat({ type: 'skill', item: skill }); return; }
      const booking = bookingRequests.find(b => b.id === notification.relatedId);
      if (booking) { setActiveChat({ type: 'booking', item: booking }); return; }
    } else if (notification.type === 'activity_request') {
      // FORCE REFETCH OF ACTIVITIES TO SHOW PENDING REQUEST
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      navigateTo(Screen.Dashboard);
    } else if (notification.type === 'activity_approved') {
      // Find activity and open chat
      queryClient.invalidateQueries({ queryKey: ['activities'] }); // Ensure we have latest participants list
      const act = activities.find(a => a.id === notification.relatedId);
      if (act) setActiveChat({ type: 'activity', item: act });
      else navigateTo(Screen.CommunityActivities);
    } else if (notification.type === 'activity_declined') {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      navigateTo(Screen.Dashboard);
    } else if (notification.type === 'booking') {
      // Refresh bookings data to ensure we have the latest requests
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigateTo(Screen.Dashboard);
      // Only open chat for accepted bookings, pending requests are shown on dashboard
      if (notification.relatedId) {
        const booking = bookingRequests.find(b => b.id === notification.relatedId);
        if (booking && booking.status === 'accepted') {
          setActiveChat({ type: 'booking', item: booking });
        }
        // For pending bookings, the dashboard will show them in the "My Booking Requests" section
      }
    } else if (notification.type === 'outing') {
      queryClient.invalidateQueries({ queryKey: ['outings'] });
      navigateTo(Screen.ChildOutings);
    } else if (notification.type === 'skill') {
      queryClient.invalidateQueries({ queryKey: ['skillRequests'] });
      navigateTo(Screen.SkillMarketplace);
    } else if (notification.type === 'task') {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigateTo(Screen.Dashboard);
    }
  };

  const handleClearNotifications = async () => {
    if (currentUser) {
      try {
        await notificationService.markAllRead();
        queryClient.setQueryData(['notifications', currentUser.id], (old: Notification[] = []) => old.map(n => ({ ...n, read: true })));
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (e) { }
    }
  };

  const currentUserAddedNannies = useMemo(() => {
    if (currentUser?.userType !== 'parent') return [];
    const manualNannies = (currentUser.addedNannyIds || []).map(id => approvedNannies.find(n => n.id === id)).filter((n): n is User => !!n);
    const bookedNannies = bookingRequests.filter(req => req.parentId === currentUser.id && req.status === 'accepted').map(req => approvedNannies.find(n => n.id === req.nannyId)).filter((n): n is User => !!n);
    const combined = [...manualNannies, ...bookedNannies];
    return Array.from(new Map(combined.map(n => [n.id, n])).values());
  }, [currentUser, approvedNannies, bookingRequests]);

  const nannyVisibleBookings = useMemo(() => {
    return bookingRequests.filter(req => !hiddenBookingIds.includes(req.id));
  }, [bookingRequests, hiddenBookingIds]);

  const userBookingRequests = useMemo(() => {
    if (!currentUser) return [];
    let requests = [];
    if (currentUser.userType === 'parent') {
      requests = bookingRequests.filter(req => req.parentId === currentUser.id);
    } else {
      requests = nannyVisibleBookings.filter(req => req.nannyId === currentUser.id);
    }

    if (currentUser.userType === 'parent') {
      return requests.map(req => {
        const nanny = approvedNannies.find(n => n.id === req.nannyId);
        return { ...req, nanny: nanny || { id: req.nannyId, fullName: 'Nanny', photo: '' } as User };
      });
    } else {
      return requests.map(req => ({ ...req, parent: { id: req.parentId, fullName: req.parentName, photo: '' } as User }));
    }
  }, [currentUser, bookingRequests, nannyVisibleBookings, approvedNannies]);

  const userTasks = useMemo(() => { if (!currentUser) return []; if (currentUser.userType === 'nanny') return tasks.filter(task => task.nannyId === currentUser.id); else return tasks.filter(task => task.parentId === currentUser.id); }, [currentUser, tasks]);

  const handleOpenContactChat = (nanny: User) => {
    const booking = bookingRequests.find(req => req.nannyId === nanny.id && req.parentId === currentUser?.id && req.status === 'accepted');
    if (booking) { setContactNannyInfo(null); setActiveChat({ type: 'booking', item: booking }); } else { alert("You must have an accepted booking with this nanny to chat."); }
  };

  const renderScreen = () => {
    if (viewingNannyId && currentScreen === Screen.NannyProfileDetail) {
      const nanny = approvedNannies.find(n => n.id === viewingNannyId);
      const isAdded = currentUserAddedNannies.some(n => n.id === viewingNannyId);
      const hasPendingRequest = currentUser ? bookingRequests.some(req => req.parentId === currentUser.id && req.nannyId === viewingNannyId && req.status === 'pending') : false;

      return nanny ? <NannyProfileDetailScreen
        nanny={nanny}
        onBack={goBack}
        onContact={handleContactAttempt}
        onAdd={handleAddNanny}
        isAdded={!!isAdded}
        onRequestBooking={handleOpenBookingModal}
        hasPendingRequest={hasPendingRequest}
        onReportUser={handleReportUser}
        onOpenChat={handleOpenContactChat}
      /> : null;
    }
    switch (currentScreen) {
      case Screen.Welcome: return <WelcomeScreen onSelectUserType={handleSelectUserType} onLogin={() => navigateTo(Screen.Login)} />;
      case Screen.SignUp: return <SignUpScreen userType={userTypeForSignup} onSignUp={handleSignUp} onBack={goBack} onLogin={() => navigateTo(Screen.Login)} error={error} />;
      case Screen.Login: return <LoginScreen onLogin={handleLogin} onBack={goBack} onSignUp={() => navigateTo(Screen.SignUp)} onForgotPassword={() => navigateTo(Screen.ForgotPassword)} error={error} />;
      case Screen.ForgotPassword: return <ForgotPasswordScreen onBack={goBack} onSubmit={handleForgotPassword} />;
      case Screen.Questionnaire: return currentUser ? <Questionnaire user={currentUser} onSubmit={submitAssessment} error={error} onBack={goBack} /> : null;
      case Screen.Loading: return <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]"><LoadingSpinner /><h2 className="text-2xl font-semibold text-[var(--text-secondary)] mt-6">{t('loading_title')}</h2><p className="text-[var(--text-light)] mt-2">{t('loading_message')}</p></div>;
      case Screen.Result: return currentUser?.assessmentResult ? <ResultScreen result={currentUser.assessmentResult} onContinue={handleContinueFromResult} onRestart={() => navigateTo(Screen.Questionnaire, true)} onBack={goBack} isSuspended={!!(currentUser.suspendedUntil && new Date(currentUser.suspendedUntil) > new Date())} /> : null;
      case Screen.NannyProfileForm: return currentUser ? <NannyProfileForm user={currentUser} onSubmit={handleNannyProfileSubmit} onBack={goBack} /> : null;
      case Screen.ParentProfileForm: return currentUser ? <ParentProfileForm user={currentUser} onSubmit={handleParentProfileSubmit} onBack={goBack} /> : null;
      case Screen.Subscription: return currentUser ? <SubscriptionScreen onSubscribe={handleSubscribe} onBack={goBack} /> : null;
      case Screen.SubscriptionStatus: return currentUser ? <SubscriptionStatusScreen user={currentUser} onCancelSubscription={handleCancelSubscription} onBack={goBack} /> : null;
      case Screen.Dashboard: return currentUser ? <DashboardScreen
        user={currentUser}
        addedNannies={currentUserAddedNannies}
        bookingRequests={userBookingRequests}
        allTasks={tasks}
        userTasks={userTasks}
        activities={activities}
        sharedOutings={sharedOutings}
        skillRequests={skillRequests}
        onCancelSubscription={handleCancelSubscription}
        onLogout={handleLogout}
        onSearchNannies={() => navigateTo(Screen.NannyListing)}
        onRemoveNanny={handleRemoveNanny}
        onContactNanny={handleContactAttempt}
        onViewNanny={handleViewNannyProfile}
        onRateNanny={handleOpenRatingModal}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onOpenTaskModal={handleOpenTaskModal}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onViewActivities={() => navigateTo(Screen.CommunityActivities)}
        onViewOutings={() => navigateTo(Screen.ChildOutings)}
        onUpdateOutingRequestStatus={handleUpdateOutingRequestStatus}
        onViewSkillMarketplace={() => navigateTo(Screen.SkillMarketplace)}
        onEditProfile={handleEditProfile}
        onOpenBookingChat={(booking) => setActiveChat({ type: 'booking', item: booking })}
        onOpenChat={(type, item) => setActiveChat({ type, item })}
        onCancelBooking={currentUser.userType === 'parent' ? handleCancelBooking : handleNannyHideBooking}
        onClearAllBookings={handleClearAllBookings}
        onKeepTask={handleKeepTask}
        onDeleteTask={handleDeleteTask}
        onDeleteActivities={handleDeleteAllActivities}
        onDeleteOutings={handleDeleteAllOutings}
        onDeleteSkillRequests={handleDeleteAllSkillRequests}
        onUpdateOffer={handleUpdateSkillOfferStatus}
      /> : null;
      case Screen.NannyListing: return <NannyListingScreen nannies={approvedNannies} onBack={goBack} onViewProfile={handleViewNannyProfile} />;
      case Screen.CommunityActivities: return currentUser ? <CommunityActivitiesScreen
        user={currentUser}
        activities={activities}
        onBack={goBack}
        onCreateActivity={() => setIsCreateActivityModalOpen(true)}
        onJoinActivity={handleJoinActivity}
        onOpenChat={(activity) => setActiveChat({ type: 'activity', item: activity })}
        onDeleteActivity={handleDeleteActivity}
        onDeleteAllActivities={handleDeleteAllActivities}
      /> : null;
      case Screen.ChildOutings:
        const enrichedOutings = sharedOutings.map(o => ({ ...o, isHostVerified: false, isHost: o.hostId === currentUser?.id }));
        return currentUser ? <ChildOutingScreen
          user={currentUser}
          outings={enrichedOutings}
          onBack={goBack}
          onCreateOuting={() => setIsCreateOutingModalOpen(true)}
          onRequestJoin={setRequestOutingInfo}
          onUpdateRequestStatus={handleUpdateOutingRequestStatus} // Added prop
          onOpenChat={(outing) => setActiveChat({ type: 'outing', item: outing })}
          onRateHost={(hostId) => { const host = approvedNannies.find(n => n.id === hostId) || { id: hostId, fullName: 'Host', photo: '' } as User; setRatingTargetUser(host); }}
          onDeleteOuting={handleDeleteOuting}
          onDeleteAllOutings={handleDeleteAllOutings}
        /> : null;
      case Screen.SkillMarketplace: return currentUser ? <SkillMarketplaceScreen
        user={currentUser}
        requests={skillRequests}
        onBack={goBack}
        onCreateRequest={() => setIsCreateSkillRequestModalOpen(true)}
        onMakeOffer={setMakeOfferSkillRequestInfo}
        onUpdateOffer={handleUpdateSkillOfferStatus}
        onOpenChat={(skill) => setActiveChat({ type: 'skill', item: skill })}
        onDeleteSkillRequest={handleDeleteSkillRequest}
        onDeleteAllSkillRequests={handleDeleteAllSkillRequests}
      /> : null;
      default: return <WelcomeScreen onSelectUserType={handleSelectUserType} onLogin={() => navigateTo(Screen.Login)} />;
    }
  };

  const showAiAssistant = currentUser && (currentUser.userType === 'parent' || (currentUser.userType === 'nanny' && currentUser.assessmentResult?.decision === 'Approved' && currentUser.profile));

  const isWideScreen = [Screen.Dashboard, Screen.NannyListing, Screen.CommunityActivities, Screen.ChildOutings, Screen.SkillMarketplace].includes(currentScreen);

  return (
    <div className="min-h-screen flex flex-col items-center">
      {contactNannyInfo && <ContactModal nanny={contactNannyInfo} onClose={() => setContactNannyInfo(null)} onOpenChat={handleOpenContactChat} />}
      {ratingTargetUser && <RatingModal targetUser={ratingTargetUser} onClose={() => setRatingTargetUser(null)} onSubmit={(rating, comment) => handleSubmitRating(ratingTargetUser.id, rating, comment)} />}
      {bookingNannyInfo && currentUser && (
        <BookingRequestModal nanny={bookingNannyInfo} onClose={() => setBookingNannyInfo(null)} onSubmit={handleSubmitBookingRequest} existingBookings={bookingRequests} currentUserId={currentUser.id} />
      )}
      {taskModalNanny && <TaskModal nanny={taskModalNanny} onClose={() => setTaskModalNanny(null)} onSubmit={handleAddTask} />}
      {isCreateActivityModalOpen && <CreateActivityModal onClose={() => setIsCreateActivityModalOpen(false)} onSubmit={handleCreateActivity} />}
      {isCreateOutingModalOpen && <CreateOutingModal onClose={() => setIsCreateOutingModalOpen(false)} onSubmit={handleCreateOuting} />}
      {requestOutingInfo && <RequestOutingJoinModal outing={requestOutingInfo} onClose={() => setRequestOutingInfo(null)} onSubmit={handleRequestOutingJoin} existingRequests={requestOutingInfo.requests} currentUserId={currentUser?.id || ''} />}
      {isCreateSkillRequestModalOpen && <CreateSkillRequestModal onClose={() => setIsCreateSkillRequestModalOpen(false)} onSubmit={handleCreateSkillRequest} />}
      {makeOfferSkillRequestInfo && <MakeSkillOfferModal request={makeOfferSkillRequestInfo} onClose={() => setMakeOfferSkillRequestInfo(null)} onSubmit={handleMakeSkillOffer} />}
      {activeChat && currentUser && <ChatModal activity={activeChat.type === 'activity' ? activeChat.item as Activity : undefined} outing={activeChat.type === 'outing' ? activeChat.item as SharedOuting : undefined} skillRequest={activeChat.type === 'skill' ? activeChat.item as SkillRequest : undefined} bookingRequest={activeChat.type === 'booking' ? activeChat.item as BookingRequest : undefined} currentUser={currentUser} onClose={() => setActiveChat(null)} onDeleteMessage={handleDeleteMessage} onDeleteAllMessages={handleDeleteAllMessages} onReportUser={handleReportUser} />}

      {/* Conditional Rendering of Settings Modal (Now driven by state) */}
      {isSettingsModalOpen && (
        <SettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          noiseReductionEnabled={noiseReductionEnabled}
          onToggleNoiseReduction={() => {
            setNoiseReductionEnabled(!noiseReductionEnabled);
            alert(!noiseReductionEnabled ? "Audio processing enabled for clearer calls." : "Noise reduction disabled.");
          }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Passing the correct toggle handler to the Header component */}
      <Header
        isAuthenticated={!!currentUser}
        user={currentUser}
        onLogout={handleLogout}
        onEditProfile={(currentUser?.userType === 'parent' || (currentUser?.userType === 'nanny' && currentUser?.assessmentResult?.decision === 'Approved')) ? handleEditProfile : undefined}
        onViewSubscription={currentUser?.userType === 'parent' ? handleViewSubscription : undefined}
        // FIX: The header button now toggles the state directly
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        notifications={currentUser ? notifications.filter(n => !n.read) : []}
        onClearNotifications={handleClearNotifications}
        onNotificationClick={handleNotificationClick}
        noiseReductionEnabled={noiseReductionEnabled}
      />
      <main className={`w-full mx-auto p-4 pt-20 sm:p-6 sm:pt-24 md:p-8 md:pt-28 flex-grow transition-all duration-500 ${isWideScreen ? 'max-w-[95%] xl:max-w-[1400px]' : 'max-w-xl'}`}>
        <div className={`transition-all duration-500 ${isWideScreen ? 'bg-transparent' : 'bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden'}`}>
          {renderScreen()}
        </div>
      </main>

      {showAiAssistant && isAiVisible && currentUser && (
        <AiAssistant
          ref={aiAssistantRef}
          user={currentUser}
          currentScreen={currentScreen}
        />
      )}

      <footer className="text-center p-4 text-[var(--text-accent)] text-sm"><p>© {new Date().getFullYear()} {t('footer_text')}{' '}<span className="font-bold text-xs animate-rainbow">Moubarak</span>{t('footer_rights_reserved')}</p></footer>
    </div>
  );
};

export default App;