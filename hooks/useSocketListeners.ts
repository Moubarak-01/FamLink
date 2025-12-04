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
        // 1. Update Active Chat if open
        setActiveChat((prev: any) => {
            if (prev && prev.item.id === roomId) {
                const exists = prev.item.messages?.some((m: ChatMessage) => m.id === message.id);
                if (exists) return prev;
                
                if (message.senderId !== currentUser.id) {
                    socketService.markSeen(roomId, currentUser.id);
                }

                return { ...prev, item: { ...prev.item, messages: [...(prev.item.messages || []), message] } };
            }
            // If not open, mark as delivered
            if (message.senderId !== currentUser.id) {
                socketService.markDelivered(roomId, currentUser.id);
            }
            return prev;
        });

        // 2. Update Lists
        setActivities(prev => handleUpdateList(prev, roomId, message));
        setSharedOutings(prev => handleUpdateList(prev, roomId, message));
        setSkillRequests(prev => handleUpdateList(prev, roomId, message));
        setBookingRequests(prev => handleUpdateList(prev, roomId, message));

        // 3. Notification
        if (message.senderId !== currentUser.id) {
             setNotifications(prev => [{
                 id: `notif-${Date.now()}`,
                 userId: currentUser.id,
                 message: `New message from ${message.senderName.split(' ')[0]}`,
                 type: 'chat',
                 read: false,
                 createdAt: new Date().toISOString(),
                 relatedId: roomId
             }, ...prev]);
        }
    });

    const unsubscribeStatus = socketService.onMessageStatusUpdate(({ roomId, status }) => {
        const updateMsgs = (msgs: ChatMessage[] = []) => msgs.map(m => 
             m.senderId === currentUser.id ? { ...m, status: status as any } : m
        );

        setActiveChat((prev: any) => {
            if (prev && prev.item.id === roomId) {
                return { ...prev, item: { ...prev.item, messages: updateMsgs(prev.item.messages) } };
            }
            return prev;
        });

        const updateListStatus = (list: any[]) => list.map(item => 
            item.id === roomId ? { ...item, messages: updateMsgs(item.messages) } : item
        );
        setActivities(prev => updateListStatus(prev));
        setSharedOutings(prev => updateListStatus(prev));
        setSkillRequests(prev => updateListStatus(prev));
        setBookingRequests(prev => updateListStatus(prev));
    });

    return () => { unsubscribeMsg(); unsubscribeStatus(); };
  }, [currentUser, activeChatId]);
};