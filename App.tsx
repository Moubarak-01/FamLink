import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Answer, Screen, UserType, Subscription, Plan, User, NannyProfile, Rating, BookingRequest, Task, Activity, SharedOuting, OutingRequest, SkillRequest, SkillOffer, Child, ActivityCategory, SkillCategory, ChatMessage, Notification, NotificationType } from './types';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import Questionnaire from './components/Questionnaire';
import ResultScreen from './components/ResultScreen';
import { evaluateAnswers } from './services/geminiService';
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

const getAvatarId = (id: string) => {
    return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 70;
};

interface PendingAction {
  type: 'contact' | 'book';
  nanny: User;
}

// ... (StarRating and RatingModal remain standard) ...
const StarRating: React.FC<{ rating: number, setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex justify-center text-4xl text-gray-300">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={`transition-colors duration-200 ${
              ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${ratingValue} stars`}
          >
            <span className="star">&#9733;</span>
          </button>
        );
      })}
    </div>
  );
};

const RatingModal: React.FC<{targetUser?: User, nanny?: User, onClose: () => void, onSubmit: (rating: number, comment: string) => void}> = ({ targetUser, nanny, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const userToRate = targetUser || nanny;

  if (!userToRate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
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
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] text-center mb-2">{t('rating_modal_your_rating')}</label>
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                 <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-[var(--text-secondary)]">{t('rating_modal_comment_label')}</label>
                    <textarea 
                        id="comment"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                        placeholder={t('rating_modal_comment_placeholder')}
                        className="mt-1 block w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)] sm:text-sm text-[var(--text-primary)]"
                    />
                </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg">{t('button_back')}</button>
                <button type="submit" className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50" disabled={rating === 0}>{t('button_submit_rating')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Welcome);
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  
  // Data State
  const [approvedNannies, setApprovedNannies] = useState<User[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sharedOutings, setSharedOutings] = useState<SharedOuting[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Local hidden bookings (to simulate "delete for me only")
  // In a real app this would be persisted in DB or LocalStorage
  const [hiddenBookingIds, setHiddenBookingIds] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  
  // Accessibility / AI State
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const aiAssistantRef = useRef<AiAssistantRef>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socketService.connect();
    const unsubscribe = socketService.onMessage(({ roomId, message }) => {
        processIncomingMessage(roomId, message);
    });
    return () => { unsubscribe(); };
  }, []);

  // ... (Auto-login check, Global Keyboard Shortcuts, Refresh Data, processIncomingMessage unchanged) ...
  useEffect(() => {
      const checkAuth = async () => {
          const token = localStorage.getItem('authToken');
          if (token) {
              try {
                  const profile = await authService.getProfile();
                  setCurrentUser(profile);
                  navigateTo(Screen.Dashboard, true);
              } catch (e) {
                  localStorage.removeItem('authToken');
              }
          }
      };
      checkAuth();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); aiAssistantRef.current?.openChat(); }
      if (e.shiftKey && e.key.toLowerCase() === 'a') { e.preventDefault(); aiAssistantRef.current?.toggleVisibility(); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
        const [nanniesRes, activitiesRes, outingsRes, skillsRes, bookingsRes, notificationsRes, tasksRes] = await Promise.all([
            userService.getNannies(),
            activityService.getAll(),
            outingService.getAll(),
            marketplaceService.getAll(),
            bookingService.getAll(),
            notificationService.getAll(),
            taskService.getAll()
        ]);
        setApprovedNannies(nanniesRes.filter(n => n.profile));
        setActivities(activitiesRes);
        setSharedOutings(outingsRes);
        setSkillRequests(skillsRes);
        setBookingRequests(bookingsRes);
        setNotifications(notificationsRes);
        setTasks(tasksRes);
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const processIncomingMessage = useCallback((id: string, message: ChatMessage) => {
      if (currentUser && message.senderId !== currentUser.id) {
           setNotifications(prev => [{
               id: `notif-${Date.now()}`,
               userId: currentUser.id,
               message: `New message from ${message.senderName.split(' ')[0]}`,
               type: 'chat',
               read: false,
               createdAt: new Date().toISOString(),
               timestamp: Date.now(),
               relatedId: id
           }, ...prev]);
      }
  }, [currentUser]);

  // ... (Navigation & Auth Handlers: navigateTo, goBack, handleLogout, handleSelectUserType, handleSignUp, handleLogin, handleForgotPassword) ...
  const navigateTo = (screen: Screen, replace = false) => { setError(null); if (replace) setScreenHistory([]); else setScreenHistory([...screenHistory, currentScreen]); setCurrentScreen(screen); };
  const goBack = () => { setError(null); setViewingNannyId(null); const previousScreen = screenHistory.pop(); if (previousScreen !== undefined) { setScreenHistory([...screenHistory]); setCurrentScreen(previousScreen); } else { setCurrentScreen(Screen.Welcome); } };
  const handleLogout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('rememberedUser'); setCurrentScreen(Screen.Welcome); setScreenHistory([]); setCurrentUser(null); setError(null); setViewingNannyId(null); setActivities([]); setSharedOutings([]); setBookingRequests([]); setTasks([]); };
  const handleSelectUserType = (type: UserType) => { setUserTypeForSignup(type); navigateTo(Screen.SignUp); };
  const handleSignUp = async (fullName: string, email: string, password: string, userType: UserType) => { try { const data = await authService.signup(fullName, email, password, userType); localStorage.setItem('authToken', data.access_token); setCurrentUser(data.user); alert(t('alert_signup_success')); navigateTo(Screen.Dashboard); } catch (err: any) { setError(err.response?.data?.message || 'Signup failed.'); } };
  const handleLogin = async (email: string, password: string, rememberMe: boolean) => { try { const data = await authService.login(email, password); localStorage.setItem('authToken', data.access_token); setCurrentUser(data.user); if (rememberMe) localStorage.setItem('rememberedUser', email); if (data.user.userType === 'parent') { if (!data.user.location) navigateTo(Screen.ParentProfileForm); else navigateTo(Screen.Dashboard); } else { if (data.user.profile) navigateTo(Screen.Dashboard); else if (data.user.assessmentResult?.decision === 'Approved') navigateTo(Screen.NannyProfileForm); else if (data.user.assessmentResult) navigateTo(Screen.Result); else navigateTo(Screen.Questionnaire); } } catch (err: any) { setError(err.response?.data?.message || t('error_invalid_credentials')); } };
  const handleForgotPassword = async (email: string) => { await new Promise(resolve => setTimeout(resolve, 1500)); alert(t('alert_forgot_password_sent')); navigateTo(Screen.Login); };

  // ... (Profile & Assessment Handlers) ...
  const submitAssessment = async (finalAnswers: Answer[]) => { if (!currentUser) return; setIsLoading(true); navigateTo(Screen.Loading); try { const assessmentResult = await evaluateAnswers(finalAnswers, language); let updatedUser = { ...currentUser, assessmentResult }; await userService.updateProfile({ assessmentResult }); setCurrentUser(updatedUser); setCurrentScreen(Screen.Result); } catch (err) { setError(t('error_assessment_evaluation')); setCurrentScreen(Screen.Questionnaire); } finally { setIsLoading(false); } };
  const handleSubscribe = async (plan: Plan) => { if (!currentUser) return; const renewalDate = new Date(); renewalDate.setMonth(renewalDate.getMonth() + 1); const newSubscription: Subscription = { plan, status: 'active', renewalDate: renewalDate.toLocaleDateString() }; try { const updatedUser = await userService.updateProfile({ subscription: newSubscription }); setCurrentUser(updatedUser); alert(t('alert_subscription_success')); if (pendingAction) { const action = { ...pendingAction }; setPendingAction(null); if (action.type === 'contact') setContactNannyInfo(action.nanny); if (action.type === 'book') setBookingNannyInfo(action.nanny); } navigateTo(Screen.Dashboard); } catch(e) { alert("Subscription failed"); } };
  const handleNannyProfileSubmit = async (profileData: any) => { if(!currentUser) return; try { const updatedUser = await userService.updateProfile({ fullName: profileData.fullName, email: profileData.email, photo: profileData.photo, profile: { ...profileData } }); setCurrentUser(updatedUser); alert(t('alert_profile_success')); navigateTo(Screen.Dashboard); } catch (e) { alert("Failed to save profile"); } };
  const handleParentProfileSubmit = async (profileData: any) => { if (!currentUser) return; try { const updatedUser = await userService.updateProfile(profileData); setCurrentUser(updatedUser); alert(t('alert_profile_success')); navigateTo(Screen.Dashboard); } catch(e) { alert("Failed to save profile"); } };
  const handleEditProfile = () => { if (!currentUser) return; currentUser.userType === 'parent' ? navigateTo(Screen.ParentProfileForm) : navigateTo(Screen.NannyProfileForm); };
  const handleViewSubscription = () => navigateTo(Screen.SubscriptionStatus);
  const handleCancelSubscription = async () => { if (currentUser?.subscription) { try { const updatedUser = await userService.updateProfile({ subscription: { ...currentUser.subscription, status: 'canceled' } }); setCurrentUser(updatedUser); } catch (e) { alert("Error canceling subscription"); } } };
  const handleContinueFromResult = () => { if (currentUser?.userType === 'nanny' && currentUser.assessmentResult?.decision === 'Approved') navigateTo(Screen.NannyProfileForm); };
  
  // ... (Standard Dashboard Actions) ...
  const handleViewNannyProfile = (nannyId: string) => { setViewingNannyId(nannyId); navigateTo(Screen.NannyProfileDetail); };
  const handleContactAttempt = (nanny: User) => { if (!currentUser) { setPendingAction({ type: 'contact', nanny }); navigateTo(Screen.Login); return; } if (currentUser.subscription?.status === 'active') setContactNannyInfo(nanny); else { setPendingAction({ type: 'contact', nanny }); navigateTo(Screen.Subscription); } };
  const handleAddNanny = async (nannyId: string) => { if (!currentUser) return; try { const updatedUser = await userService.addNanny(nannyId); setCurrentUser(updatedUser); alert(t('alert_nanny_added_dashboard')); } catch(e) { alert("Error adding nanny"); } };
  const handleRemoveNanny = async (nannyId: string) => { if (!currentUser) return; try { const updatedUser = await userService.removeNanny(nannyId); setCurrentUser(updatedUser); } catch(e) { alert("Error removing nanny"); } };
  const handleOpenRatingModal = (userToRate: User) => setRatingTargetUser(userToRate);
  const handleSubmitRating = async (targetUserId: string, ratingValue: number, comment: string) => { if (!currentUser) return; try { await reviewService.create(targetUserId, ratingValue, comment); setRatingTargetUser(null); alert(t('alert_rating_success')); const nanniesRes = await userService.getNannies(); setApprovedNannies(nanniesRes.filter(n => n.profile)); } catch(e) { alert("Error submitting rating"); } };
  const handleOpenBookingModal = (nanny: User) => { if (!currentUser) { setPendingAction({ type: 'book', nanny }); navigateTo(Screen.Login); return; } if (currentUser.subscription?.status !== 'active') { setPendingAction({ type: 'book', nanny }); alert(t('alert_subscribe_to_book')); navigateTo(Screen.Subscription); return; } setBookingNannyInfo(nanny); };
  const handleSubmitBookingRequest = async (nannyId: string, date: string, startTime: string, endTime: string, message: string) => { if (!currentUser) return; try { const newBooking = await bookingService.create({ nannyId, date, startTime, endTime, message }); setBookingRequests(prev => [...prev, newBooking]); setBookingNannyInfo(null); alert(t('alert_booking_request_sent')); refreshData(); } catch(e) { alert("Error creating booking"); } };
  
  // UPDATED: Booking Logic
  const handleUpdateBookingStatus = async (requestId: string, status: 'accepted' | 'declined') => {
      try {
          await bookingService.updateStatus(requestId, status);
          refreshData();
      } catch(e) { alert("Error updating booking"); }
  };

  // NEW: Local hide for Nanny History (Persists only in memory for session unless we add localstorage)
  const handleNannyHideBooking = (id: string) => {
      if (window.confirm("Remove this from your history?")) {
          setHiddenBookingIds(prev => [...prev, id]);
      }
  };

  const handleCancelBooking = async (id: string) => { if (window.confirm("Cancel this request?")) { try { await bookingService.delete(id); setBookingRequests(prev => prev.filter(b => b.id !== id)); } catch(e) { alert("Failed to cancel"); } } };
  const handleClearAllBookings = async () => { if (window.confirm("Clear all history?")) { try { await bookingService.deleteAll(); setBookingRequests([]); } catch(e) { alert("Failed to clear history"); } } };
  
  // ... (Task, Activity, Outing, Skill, Chat, Notification handlers remain standard - see previous full file) ...
  const handleOpenTaskModal = (nanny: User) => setTaskModalNanny(nanny);
  const handleAddTask = async (nannyId: string, description: string, dueDate: string) => { if (!currentUser) return; try { const newTask = await taskService.create({ nannyId, description, dueDate }); setTasks(prev => [...prev, newTask]); setTaskModalNanny(null); alert(t('alert_task_added')); } catch(e) { alert("Error adding task"); } };
  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'completed') => { try { const updatedTask = await taskService.updateStatus(taskId, status); setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task)); } catch(e) { alert("Error updating task status"); } };
  const handleOpenCreateActivityModal = () => setIsCreateActivityModalOpen(true);
  const handleCloseCreateActivityModal = () => setIsCreateActivityModalOpen(false);
  const handleCreateActivity = async (activityData: any) => { if (!currentUser) return; try { const newActivity = await activityService.create(activityData); setActivities(prev => [newActivity, ...prev]); handleCloseCreateActivityModal(); } catch(e) { alert("Error creating activity"); } };
  const handleJoinActivity = async (activityId: string) => { if (!currentUser) return; try { const updatedActivity = await activityService.join(activityId); setActivities(prev => prev.map(act => act.id === activityId ? updatedActivity : act)); } catch(e) { alert("Error joining activity"); } };
  const handleSendMessage = (id: string, messageText: string) => { if (!currentUser) return; const tempId = `msg-${Date.now()}`; const newMessage: ChatMessage = { id: tempId, senderId: currentUser.id, senderName: currentUser.fullName, senderPhoto: currentUser.photo || `https://i.pravatar.cc/150?img=${getAvatarId(currentUser.id)}`, text: messageText, timestamp: Date.now(), }; setActiveChat(prev => { if (prev && prev.item.id === id) { return { ...prev, item: { ...prev.item, messages: [...(prev.item.messages || []), newMessage] } }; } return prev; }); socketService.sendMessage(id, newMessage, (savedMessage) => { setActiveChat(prev => { if (prev && prev.item.id === id) { const updatedMessages = (prev.item.messages || []).map(msg => msg.id === tempId ? savedMessage : msg); return { ...prev, item: { ...prev.item, messages: updatedMessages } }; } return prev; }); }); };
  const handleDeleteMessage = async (contextId: string, messageId: string) => { const filterMsgs = (item: any) => ({ ...item, messages: (item.messages || []).filter((m: ChatMessage) => m.id !== messageId) }); if (activities.some(a => a.id === contextId)) setActivities(prev => prev.map(a => a.id === contextId ? filterMsgs(a) : a)); else if (sharedOutings.some(o => o.id === contextId)) setSharedOutings(prev => prev.map(o => o.id === contextId ? filterMsgs(o) : o)); else if (skillRequests.some(s => s.id === contextId)) setSkillRequests(prev => prev.map(s => s.id === contextId ? filterMsgs(s) : s)); else if (bookingRequests.some(b => b.id === contextId)) setBookingRequests(prev => prev.map(b => b.id === contextId ? filterMsgs(b) : b)); setActiveChat(prev => { if (prev && prev.item.id === contextId) return { ...prev, item: filterMsgs(prev.item) }; return prev; }); try { await chatService.deleteMessage(messageId); } catch (e) { alert("Failed to delete message"); } };
  const handleDeleteAllMessages = async (contextId: string) => { const clearMsgs = (item: any) => ({ ...item, messages: [] }); if (activities.some(a => a.id === contextId)) setActivities(prev => prev.map(a => a.id === contextId ? clearMsgs(a) : a)); else if (sharedOutings.some(o => o.id === contextId)) setSharedOutings(prev => prev.map(o => o.id === contextId ? clearMsgs(o) : o)); else if (skillRequests.some(s => s.id === contextId)) setSkillRequests(prev => prev.map(s => s.id === contextId ? clearMsgs(s) : s)); else if (bookingRequests.some(b => b.id === contextId)) setBookingRequests(prev => prev.map(b => b.id === contextId ? clearMsgs(b) : b)); setActiveChat(prev => { if (prev && prev.item.id === contextId) return { ...prev, item: clearMsgs(prev.item) }; return prev; }); try { await chatService.deleteAllMessages(contextId); } catch (e) { alert("Failed to delete messages"); } };
  const handleOpenCreateOutingModal = () => setIsCreateOutingModalOpen(true);
  const handleCloseCreateOutingModal = () => setIsCreateOutingModalOpen(false);
  const handleCreateOuting = async (outingData: any) => { if (!currentUser) return; try { const newOuting = await outingService.create(outingData); setSharedOutings(prev => [newOuting, ...prev]); handleCloseCreateOutingModal(); } catch(e) { alert("Error creating outing"); } };
  const handleRequestOutingJoin = async (outing: SharedOuting, childName: string, childAge: number, emergencyContactName: string, emergencyContactPhone: string) => { if (!currentUser) return; try { const updatedOuting = await outingService.requestJoin(outing.id, { childName, childAge, emergencyContactName, emergencyContactPhone }); setSharedOutings(prev => prev.map(o => o.id === outing.id ? updatedOuting : o)); setRequestOutingInfo(null); alert(t('alert_outing_request_sent')); } catch(e) { alert("Error requesting join"); } };
  const handleUpdateOutingRequestStatus = async (outingId: string, parentId: string, status: 'accepted' | 'declined') => { try { const updatedOuting = await outingService.updateRequestStatus(outingId, parentId, status); setSharedOutings(prev => prev.map(o => o.id === outingId ? updatedOuting : o)); } catch(e) { alert("Error updating status"); } };
  const handleCreateSkillRequest = async (requestData: any) => { if (!currentUser) return; try { const newSkill = await marketplaceService.create(requestData); setSkillRequests(prev => [newSkill, ...prev]); setIsCreateSkillRequestModalOpen(false); } catch(e) { alert("Error creating skill request"); } };
  const handleMakeSkillOffer = async (request: SkillRequest, offerAmount: number, message: string) => { if (!currentUser) return; try { const updatedSkill = await marketplaceService.makeOffer(request.id, { offerAmount, message }); setSkillRequests(prev => prev.map(r => r.id === request.id ? updatedSkill : r)); setMakeOfferSkillRequestInfo(null); } catch(e) { alert("Error making offer"); } };
  const handleUpdateSkillOfferStatus = async (requestId: string, helperId: string, status: 'accepted' | 'declined') => { try { const updatedSkill = await marketplaceService.updateOfferStatus(requestId, helperId, status); setSkillRequests(prev => prev.map(r => r.id === requestId ? updatedSkill : r)); } catch(e) { alert("Error updating offer"); } };
  const handleReportUser = (userId: string) => alert("User reported. Our team will review the case.");
  const handleNotificationClick = async (notification: Notification) => { try { await notificationService.markRead(notification.id); } catch (e) {} setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n).filter(n => !n.read)); await refreshData(); if (notification.type === 'chat' && notification.relatedId) { const act = activities.find(a => a.id === notification.relatedId); if(act) { setActiveChat({type: 'activity', item: act}); return; } const out = sharedOutings.find(o => o.id === notification.relatedId); if(out) { setActiveChat({type: 'outing', item: out}); return; } const skill = skillRequests.find(s => s.id === notification.relatedId); if(skill) { setActiveChat({type: 'skill', item: skill}); return; } const booking = bookingRequests.find(b => b.id === notification.relatedId); if(booking) { setActiveChat({type: 'booking', item: booking}); return; } } else if (notification.type === 'booking') { navigateTo(Screen.Dashboard); if (notification.relatedId) { const booking = bookingRequests.find(b => b.id === notification.relatedId); if (booking && booking.status === 'accepted') setActiveChat({type: 'booking', item: booking}); } } else if (notification.type === 'outing') navigateTo(Screen.ChildOutings); else if (notification.type === 'skill') navigateTo(Screen.SkillMarketplace); else if (notification.type === 'task') navigateTo(Screen.Dashboard); };
  const handleClearNotifications = async () => { if (currentUser) { try { await notificationService.markAllRead(); setNotifications([]); } catch(e) {} } };


  // UPDATED: currentUserAddedNannies Logic
  const currentUserAddedNannies = useMemo(() => {
    if (currentUser?.userType !== 'parent') return [];
    
    // 1. Manual adds
    const manualNannies = (currentUser.addedNannyIds || []).map(id => approvedNannies.find(n => n.id === id)).filter((n): n is User => !!n);
    
    // 2. Auto-add from Accepted Bookings
    const bookedNannies = bookingRequests
        .filter(req => req.parentId === currentUser.id && req.status === 'accepted')
        .map(req => approvedNannies.find(n => n.id === req.nannyId))
        .filter((n): n is User => !!n);
    
    // Combine and Unique
    const combined = [...manualNannies, ...bookedNannies];
    return Array.from(new Map(combined.map(n => [n.id, n])).values());
  }, [currentUser, approvedNannies, bookingRequests]);

  // Filter bookings for Nanny View based on local hidden state
  const nannyVisibleBookings = useMemo(() => {
     return bookingRequests.filter(req => !hiddenBookingIds.includes(req.id));
  }, [bookingRequests, hiddenBookingIds]);

  // Modified userBookingRequests to use above props
  const userBookingRequests = useMemo(() => {
    if (!currentUser) return [];
    let requests = [];
    if (currentUser.userType === 'parent') {
        requests = bookingRequests.filter(req => req.parentId === currentUser.id);
    } else {
        requests = nannyVisibleBookings.filter(req => req.nannyId === currentUser.id);
    }

    // Enrich with user data
    if (currentUser.userType === 'parent') {
         return requests.map(req => {
             const nanny = approvedNannies.find(n => n.id === req.nannyId);
             return {...req, nanny: nanny || { id: req.nannyId, fullName: 'Nanny', photo: '' } as User}; 
         });
    } else {
         return requests.map(req => ({...req, parent: { id: req.parentId, fullName: req.parentName, photo: '' } as User}));
    }
  }, [currentUser, bookingRequests, nannyVisibleBookings, approvedNannies]);

  // ... (userTasks, renderScreen, showAiAssistant) ...
  const userTasks = useMemo(() => { if (!currentUser) return []; if (currentUser.userType === 'nanny') return tasks.filter(task => task.nannyId === currentUser.id); else return tasks.filter(task => task.parentId === currentUser.id); }, [currentUser, tasks]);

  const renderScreen = () => {
    if (viewingNannyId && currentScreen === Screen.NannyProfileDetail) {
      const nanny = approvedNannies.find(n => n.id === viewingNannyId);
      const hasPendingRequest = currentUser 
        ? bookingRequests.some(req => req.parentId === currentUser.id && req.nannyId === viewingNannyId && req.status === 'pending')
        : false;
      const isAdded = currentUserAddedNannies.some(n => n.id === viewingNannyId);
      return nanny ? <NannyProfileDetailScreen nanny={nanny} onBack={goBack} onContact={handleContactAttempt} onAdd={handleAddNanny} isAdded={!!isAdded} onRequestBooking={handleOpenBookingModal} hasPendingRequest={hasPendingRequest} onReportUser={handleReportUser}/> : null;
    }
    switch (currentScreen) {
      case Screen.Welcome: return <WelcomeScreen onSelectUserType={handleSelectUserType} onLogin={() => navigateTo(Screen.Login)} />;
      case Screen.SignUp: return <SignUpScreen userType={userTypeForSignup} onSignUp={handleSignUp} onBack={goBack} onLogin={() => navigateTo(Screen.Login)} error={error} />;
      case Screen.Login: return <LoginScreen onLogin={handleLogin} onBack={goBack} onSignUp={() => navigateTo(Screen.SignUp)} onForgotPassword={() => navigateTo(Screen.ForgotPassword)} error={error} />;
      case Screen.ForgotPassword: return <ForgotPasswordScreen onBack={goBack} onSubmit={handleForgotPassword} />;
      case Screen.Questionnaire: return currentUser ? <Questionnaire user={currentUser} onSubmit={submitAssessment} error={error} onBack={goBack}/> : null;
      case Screen.Loading: return <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]"><LoadingSpinner /><h2 className="text-2xl font-semibold text-[var(--text-secondary)] mt-6">{t('loading_title')}</h2><p className="text-[var(--text-light)] mt-2">{t('loading_message')}</p></div>;
      case Screen.Result: return currentUser?.assessmentResult ? <ResultScreen result={currentUser.assessmentResult} onContinue={handleContinueFromResult} onRestart={() => navigateTo(Screen.Questionnaire, true)} onBack={goBack} isSuspended={!!(currentUser.suspendedUntil && new Date(currentUser.suspendedUntil) > new Date())} /> : null;
      case Screen.NannyProfileForm: return currentUser ? <NannyProfileForm user={currentUser} onSubmit={handleNannyProfileSubmit} onBack={goBack} /> : null;
      case Screen.ParentProfileForm: return currentUser ? <ParentProfileForm user={currentUser} onSubmit={handleParentProfileSubmit} onBack={goBack} /> : null;
      case Screen.Subscription: return currentUser ? <SubscriptionScreen onSubscribe={handleSubscribe} onBack={goBack} /> : null;
      case Screen.SubscriptionStatus: return currentUser ? <SubscriptionStatusScreen user={currentUser} onCancelSubscription={handleCancelSubscription} onBack={goBack} /> : null;
      case Screen.Dashboard: return currentUser ? <DashboardScreen user={currentUser} addedNannies={currentUserAddedNannies} bookingRequests={userBookingRequests} allTasks={tasks} userTasks={userTasks} sharedOutings={sharedOutings} skillRequests={skillRequests} onCancelSubscription={handleCancelSubscription} onLogout={handleLogout} onSearchNannies={() => navigateTo(Screen.NannyListing)} onRemoveNanny={handleRemoveNanny} onContactNanny={handleContactAttempt} onViewNanny={handleViewNannyProfile} onRateNanny={handleOpenRatingModal} onUpdateBookingStatus={handleUpdateBookingStatus} onOpenTaskModal={handleOpenTaskModal} onUpdateTaskStatus={handleUpdateTaskStatus} onViewActivities={() => navigateTo(Screen.CommunityActivities)} onViewOutings={() => navigateTo(Screen.ChildOutings)} onUpdateOutingRequestStatus={handleUpdateOutingRequestStatus} onViewSkillMarketplace={() => navigateTo(Screen.SkillMarketplace)} onEditProfile={handleEditProfile} onOpenBookingChat={(booking) => setActiveChat({ type: 'booking', item: booking })} onCancelBooking={currentUser.userType === 'parent' ? handleCancelBooking : handleNannyHideBooking} onClearAllBookings={handleClearAllBookings} /> : null;
      case Screen.NannyListing: return <NannyListingScreen nannies={approvedNannies} onBack={goBack} onViewProfile={handleViewNannyProfile} />;
      case Screen.CommunityActivities: return currentUser ? <CommunityActivitiesScreen user={currentUser} activities={activities} onBack={goBack} onCreateActivity={() => setIsCreateActivityModalOpen(true)} onJoinActivity={handleJoinActivity} onOpenChat={(activity) => setActiveChat({ type: 'activity', item: activity })} /> : null;
      case Screen.ChildOutings: const enrichedOutings = sharedOutings.map(o => ({ ...o, isHostVerified: false })); return currentUser ? <ChildOutingScreen user={currentUser} outings={enrichedOutings} onBack={goBack} onCreateOuting={() => setIsCreateOutingModalOpen(true)} onRequestJoin={setRequestOutingInfo} onOpenChat={(outing) => setActiveChat({ type: 'outing', item: outing })} onRateHost={(hostId) => { const host = approvedNannies.find(n => n.id === hostId) || { id: hostId, fullName: 'Host', photo: '' } as User; setRatingTargetUser(host); }} /> : null;
      case Screen.SkillMarketplace: return currentUser ? <SkillMarketplaceScreen user={currentUser} requests={skillRequests} onBack={goBack} onCreateRequest={() => setIsCreateSkillRequestModalOpen(true)} onMakeOffer={setMakeOfferSkillRequestInfo} onUpdateOffer={handleUpdateSkillOfferStatus} onOpenChat={(skill) => setActiveChat({ type: 'skill', item: skill })} /> : null;
      default: return <WelcomeScreen onSelectUserType={handleSelectUserType} onLogin={() => navigateTo(Screen.Login)} />;
    }
  };

  const showAiAssistant = currentUser && (
      currentUser.userType === 'parent' || 
      (currentUser.userType === 'nanny' && currentUser.assessmentResult?.decision === 'Approved' && currentUser.profile)
  );

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Modals */}
      {contactNannyInfo && <ContactModal nanny={contactNannyInfo} onClose={() => setContactNannyInfo(null)} />}
      {ratingTargetUser && <RatingModal targetUser={ratingTargetUser} onClose={() => setRatingTargetUser(null)} onSubmit={(rating, comment) => handleSubmitRating(ratingTargetUser.id, rating, comment)} />}
      {bookingNannyInfo && <BookingRequestModal nanny={bookingNannyInfo} onClose={() => setBookingNannyInfo(null)} onSubmit={handleSubmitBookingRequest} />}
      {taskModalNanny && <TaskModal nanny={taskModalNanny} onClose={() => setTaskModalNanny(null)} onSubmit={handleAddTask} />}
      {isCreateActivityModalOpen && <CreateActivityModal onClose={() => setIsCreateActivityModalOpen(false)} onSubmit={handleCreateActivity} />}
      {isCreateOutingModalOpen && <CreateOutingModal onClose={() => setIsCreateOutingModalOpen(false)} onSubmit={handleCreateOuting} />}
      {requestOutingInfo && <RequestOutingJoinModal outing={requestOutingInfo} onClose={() => setRequestOutingInfo(null)} onSubmit={handleRequestOutingJoin} existingRequests={requestOutingInfo.requests} currentUserId={currentUser?.id || ''} />}
      {isCreateSkillRequestModalOpen && <CreateSkillRequestModal onClose={() => setIsCreateSkillRequestModalOpen(false)} onSubmit={handleCreateSkillRequest} />}
      {makeOfferSkillRequestInfo && <MakeSkillOfferModal request={makeOfferSkillRequestInfo} onClose={() => setMakeOfferSkillRequestInfo(null)} onSubmit={handleMakeSkillOffer} />}
      {activeChat && currentUser && <ChatModal activity={activeChat.type === 'activity' ? activeChat.item as Activity : undefined} outing={activeChat.type === 'outing' ? activeChat.item as SharedOuting : undefined} skillRequest={activeChat.type === 'skill' ? activeChat.item as SkillRequest : undefined} bookingRequest={activeChat.type === 'booking' ? activeChat.item as BookingRequest : undefined} currentUser={currentUser} onClose={() => setActiveChat(null)} onSendMessage={handleSendMessage} onDeleteMessage={handleDeleteMessage} onDeleteAllMessages={handleDeleteAllMessages} onReportUser={handleReportUser} />}
      
      {isSettingsModalOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsModalOpen(false)} 
            noiseReductionEnabled={noiseReductionEnabled}
            onToggleNoiseReduction={() => {
                setNoiseReductionEnabled(!noiseReductionEnabled);
                alert(!noiseReductionEnabled ? "Audio processing enabled for clearer calls." : "Noise reduction disabled.");
            }}
          />
      )}

      <Header 
        isAuthenticated={!!currentUser} 
        user={currentUser} 
        onLogout={handleLogout} 
        onEditProfile={(currentUser?.userType === 'parent' || (currentUser?.userType === 'nanny' && currentUser?.assessmentResult?.decision === 'Approved')) ? handleEditProfile : undefined}
        onViewSubscription={currentUser?.userType === 'parent' ? handleViewSubscription : undefined}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        notifications={currentUser ? notifications.filter(n => !n.read) : []}
        onClearNotifications={handleClearNotifications}
        onNotificationClick={handleNotificationClick}
        noiseReductionEnabled={noiseReductionEnabled}
      />
      <main className="w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 flex-grow">
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg overflow-hidden transition-all duration-500">
           {renderScreen()}
        </div>
      </main>
      
      {showAiAssistant && currentUser && <AiAssistant ref={aiAssistantRef} user={currentUser} currentScreen={currentScreen} />}

      <footer className="text-center p-4 text-[var(--text-accent)] text-sm">
        <p>{t('footer_text')}{' '}<span className="font-bold text-xs animate-rainbow">Moubarak</span>{t('footer_rights_reserved')}</p>
      </footer>
    </div>
  );
};

export default App;