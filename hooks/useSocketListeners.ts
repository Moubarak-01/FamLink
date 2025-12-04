import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { User, ChatMessage, Notification, Activity, SharedOuting, SkillRequest, BookingRequest } from '../types';

interface UseSocketListenersProps {
  currentUser: User | null;
  activeChatId: string | null;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  setSharedOutings: React.Dispatch<React.SetStateAction<SharedOuting[]>>;
  setSkillRequests: React.Dispatch<React.SetStateAction<SkillRequest[]>>;
  setBookingRequests: React.Dispatch<React.SetStateAction<BookingRequest[]>>;
  setActiveChat: React.Dispatch<React.SetStateAction<any>>;
}

export const useSocketListeners = ({
  currentUser,
  activeChatId,
  setNotifications,
  setActivities,
  setSharedOutings,
  setSkillRequests,
  setBookingRequests,
  setActiveChat
}: UseSocketListenersProps) => {

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeNotif = socketService.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev]);
    });

    const handleUpdateList = (list: any[], roomId: string, message: ChatMessage) => {
        return list.map(item => {
            if (item.id === roomId) {
                const exists = item.messages?.some((m: ChatMessage) => m.id === message.id);
                return exists ? item : { ...item, messages: [...(item.messages || []), message] };
            }
            return item;
        });
    };

    const unsubscribeMsg = socketService.onMessage(({ roomId, message }) => {
        setActiveChat((prev: any) => {
            if (prev && prev.item.id === roomId) {
                const exists = prev.item.messages?.some((m: ChatMessage) => m.id === message.id);
                if (exists) return prev;
                return { ...prev, item: { ...prev.item, messages: [...(prev.item.messages || []), message] } };
            }
            return prev;
        });

        setActivities(prev => handleUpdateList(prev, roomId, message));
        setSharedOutings(prev => handleUpdateList(prev, roomId, message));
        setSkillRequests(prev => handleUpdateList(prev, roomId, message));
        setBookingRequests(prev => handleUpdateList(prev, roomId, message));
    });

    return () => { 
        unsubscribeNotif(); 
        unsubscribeMsg(); 
    };
  }, [currentUser]);
};