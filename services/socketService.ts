import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';
import { authService } from './authService';
import { cryptoService } from './cryptoService';

class SocketService {
    private socket: Socket | null = null;
    public connected: boolean = false;

    private messageHandlers: ((data: { roomId: string, message: ChatMessage }) => void)[] = [];
    private statusHandlers: ((data: any) => void)[] = [];
    private presenceHandlers: ((data: { userId: string, status: 'online' | 'offline', lastSeen?: string }) => void)[] = [];
    private notificationHandlers: ((data: Notification) => void)[] = [];
    private reactionHandlers: ((data: { roomId: string, messageId: string, userId: string, emoji: string, type: 'add' | 'remove' }) => void)[] = [];
    private deleteHandlers: ((data: { roomId: string, messageId: string, isLocalDelete?: boolean }) => void)[] = [];
    private clearHandlers: ((data: { roomId: string }) => void)[] = [];
    private typingHandlers: ((data: { roomId: string, userId: string, userName: string, isTyping: boolean }) => void)[] = [];
    private marketplaceHandlers: ((data: any) => void)[] = [];
    private activityHandlers: ((data: any) => void)[] = [];
    private outingsHandlers: ((data: any) => void)[] = [];
    private bookingsHandlers: ((data: any) => void)[] = [];
    private tasksHandlers: ((data: any) => void)[] = [];

    // WebRTC Handlers
    private callReceivedHandlers: ((data: { from: string, name: string, signal: any }) => void)[] = [];
    private callAcceptedHandlers: ((signal: any) => void)[] = [];
    private iceCandidateHandlers: ((candidate: any) => void)[] = [];
    private callEndedHandlers: (() => void)[] = [];

    async connect(userId?: string) {
        let currentUserId = userId;
        if (!currentUserId) {
            try {
                const profile = await authService.getProfile();
                currentUserId = profile?.id;
            } catch (e) { return; }
        }
        if (!currentUserId) return;

        if (this.socket) {
            // @ts-ignore - Check internal query to see if we need to switch users
            const socketUserId = this.socket.io?.opts?.query?.userId;
            if (this.socket.connected && socketUserId === currentUserId) {
                return;
            }
            // Force disconnect if user changed or invalid state
            this.socket.disconnect();
            this.socket = null;
        }

        const token = localStorage.getItem('token');

        const SOCKET_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token }, // Send JWT for authentication
            query: { userId: currentUserId }, // Keep for backward compatibility if needed, but Gateway will prefer token
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            this.connected = true;
        });

        this.socket.on('disconnect', (reason) => {
            this.connected = false;
        });

        this.socket.on('connect_error', (err) => {
            console.error(`❌ Socket Connection Error:`, err.message);
        });

        this.socket.on('receive_message', (data) => {
            if (!data.message.deleted) {
                data.message.plaintext = cryptoService.decryptMessage(data.message);
            } else {
                data.message.plaintext = "🚫 Message deleted";
            }
            this.messageHandlers.forEach(h => h(data));
        });

        this.socket.on('message_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
        this.socket.on('messages_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
        this.socket.on('user_presence', (data) => this.presenceHandlers.forEach(h => h(data)));
        this.socket.on('notification', (data) => this.notificationHandlers.forEach(h => h(data)));
        this.socket.on('reaction_added', (data) => this.reactionHandlers.forEach(h => h({ ...data, type: 'add' })));
        this.socket.on('reaction_removed', (data) => {
            this.reactionHandlers.forEach(h => h({ ...data, type: 'remove' }));
        });

        this.socket.on('marketplace_update', (data) => {
            this.marketplaceHandlers.forEach(h => h(data));
        });

        this.socket.on('activity_update', (data) => {
            this.activityHandlers.forEach(h => h(data));
        });

        this.socket.on('outings_update', (data) => {
            this.outingsHandlers.forEach(h => h(data));
        });
        this.socket.on('bookings_update', (data) => {
            this.bookingsHandlers.forEach(h => h(data));
        });
        this.socket.on('tasks_update', (data) => {
            this.tasksHandlers.forEach(h => h(data));
        });
        this.socket.on('message_deleted', (data) => this.deleteHandlers.forEach(h => h(data)));
        this.socket.on('message_deleted_for_me', (data) => this.deleteHandlers.forEach(h => h({ ...data, isLocalDelete: true })));
        this.socket.on('chat_cleared', (data) => this.clearHandlers.forEach(h => h(data)));
        this.socket.on('user_typing', (data) => this.typingHandlers.forEach(h => h({ ...data, isTyping: true })));
        this.socket.on('user_stop_typing', (data) => this.typingHandlers.forEach(h => h({ ...data, isTyping: false })));

        // WebRTC Events
        this.socket.on('call_received', (data) => this.callReceivedHandlers.forEach(h => h(data)));
        this.socket.on('call_accepted', (data) => this.callAcceptedHandlers.forEach(h => h(data)));
        this.socket.on('ice_candidate_received', (data) => this.iceCandidateHandlers.forEach(h => h(data)));
        this.socket.on('call_ended', () => this.callEndedHandlers.forEach(h => h()));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }

    joinRoom(roomId: string, userId: string) {
        const emit = () => this.socket?.emit('join_room', { roomId, userId });
        if (this.socket && this.connected) emit();
        else if (this.socket) this.socket.once('connect', emit);
    }

    markMessagesAsSeen(roomId: string, userId: string) {
        // "join_room" event in backend already triggers markMessagesAsSeen
        // But we can also have a dedicated event if we want strictly updates without re-joining
        // For now, re-emitting join_room is safe and idempotent
        this.joinRoom(roomId, userId);
    }

    leaveRoom(roomId: string) {
        if (this.socket) this.socket.emit('leave_room', roomId);
    }

    sendMarkDelivered(roomId: string, messageId: string) {
        if (this.socket && this.connected) {
            this.socket.emit('mark_delivered', { messageId, roomId });
        }
    }

    sendMarkSeen(roomId: string, messageId: string) {
        if (this.socket && this.connected) {
            this.socket.emit('mark_seen', { messageId, roomId });
        }
    }

    sendMessage(roomId: string, message: ChatMessage, callback?: (savedMessage: ChatMessage) => void) {



        // Extra safety: Check Socket.IO's internal connected state, not just our flag
        if (!this.socket || !this.socket.connected) {
            console.error(`❌ [socketService] Socket not truly connected. Attempting reconnect...`);
            if (this.socket) {
                this.socket.connect();
                // Retry after short delay
                setTimeout(() => {
                    if (this.socket?.connected) {
                        console.log(`🔄 [socketService] Reconnected! Retrying send...`);
                        this.doSendMessage(roomId, message, callback);
                    } else {
                        console.error(`❌ [socketService] Still disconnected after retry`);
                    }
                }, 500);
            }
            return;
        }

        this.doSendMessage(roomId, message, callback);
    }

    private doSendMessage(roomId: string, message: ChatMessage, callback?: (savedMessage: ChatMessage) => void) {
        const { ciphertext, mac } = cryptoService.encryptMessage(message.text);

        // CRITICAL FIX: Minimize payload to prevent Socket transport close
        // We only send essential data. The backend populates sender details (photo, name) from senderId.
        // Sending base64 photos through socket event often crashes the connection.
        const minimalMessage = {
            senderId: message.senderId,
            text: ciphertext, // Encrypted
            mac: mac,
            replyTo: message.replyTo
        };

        const encryptedPayload = {
            roomId,
            message: minimalMessage
        };

        const payloadString = JSON.stringify(encryptedPayload);
        const payloadSize = new Blob([payloadString]).size;
        console.log(` [socketService] Payload Size: ${payloadSize} bytes (Approx ${Math.round(payloadSize / 1024)} KB)`);

        if (payloadSize > 1000000) { // 1MB warning
            console.error(`⚠️ [socketService] Payload is HUGE! This might cause disconnect.`);
        }


        this.socket!.emit('send_message', encryptedPayload, (response: any) => {
            console.log(`✅ [socketService] Server ACK received:`, response);
            if (callback && response) {
                response.plaintext = cryptoService.decryptMessage(response);
                callback(response);
            }
        });
    }

    sendTyping(roomId: string, userId: string, userName: string) {
        this.socket?.emit('typing', { roomId, userId, userName });
    }

    // UPDATED: Now requires userName to ensure we remove the correct name from the list
    sendStopTyping(roomId: string, userId: string, userName: string) {
        this.socket?.emit('stop_typing', { roomId, userId, userName });
    }

    sendReaction(roomId: string, messageId: string, userId: string, emoji: string) {
        this.socket?.emit('add_reaction', { roomId, messageId, userId, emoji });
    }

    removeReaction(roomId: string, messageId: string, userId: string, emoji: string) {
        this.socket?.emit('remove_reaction', { roomId, messageId, userId, emoji });
    }

    deleteMessage(roomId: string, messageId: string, userId: string, deleteForMe: boolean = false) {
        this.socket?.emit('delete_message', { roomId, messageId, userId, deleteForMe });
    }

    clearChat(roomId: string) {
        this.socket?.emit('clear_chat', { roomId });
    }

    checkOnlineStatus(userId: string, callback: (data: { status: string, lastSeen: string | null }) => void) {
        if (this.socket && this.connected) {
            this.socket.emit('check_online', userId, (data: any) => {
                callback(data);
            });
        }
    }

    onMessage(handler: (data: { roomId: string, message: ChatMessage }) => void) {
        this.messageHandlers.push(handler);
        return () => { this.messageHandlers = this.messageHandlers.filter(h => h !== handler); };
    }

    onStatusUpdate(handler: (data: any) => void) {
        this.statusHandlers.push(handler);
        return () => { this.statusHandlers = this.statusHandlers.filter(h => h !== handler); };
    }

    onPresenceUpdate(handler: (data: { userId: string, status: 'online' | 'offline', lastSeen?: string }) => void) {
        this.presenceHandlers.push(handler);
        return () => { this.presenceHandlers = this.presenceHandlers.filter(h => h !== handler); };
    }

    onNotification(handler: (data: Notification) => void) {
        this.notificationHandlers.push(handler);
        return () => { this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler); };
    }

    onReaction(handler: (data: any) => void) {
        this.reactionHandlers.push(handler);
        return () => { this.reactionHandlers = this.reactionHandlers.filter(h => h !== handler); };
    }

    onMessageDeleted(handler: (data: any) => void) {
        this.deleteHandlers.push(handler);
        return () => { this.deleteHandlers = this.deleteHandlers.filter(h => h !== handler); };
    }

    onChatCleared(handler: (data: any) => void) {
        this.clearHandlers.push(handler);
        return () => { this.clearHandlers = this.clearHandlers.filter(h => h !== handler); };
    }

    onMarketplaceUpdate(callback: (data: any) => void) {
        this.marketplaceHandlers.push(callback);
        return () => {
            this.marketplaceHandlers = this.marketplaceHandlers.filter(h => h !== callback);
        };
    }

    onActivityUpdate(callback: (data: any) => void) {
        this.activityHandlers.push(callback);
        return () => {
            this.activityHandlers = this.activityHandlers.filter(h => h !== callback);
        };
    }

    onOutingsUpdate(callback: (data: any) => void) {
        this.outingsHandlers.push(callback);
        return () => {
            this.outingsHandlers = this.outingsHandlers.filter(h => h !== callback);
        };
    }

    onBookingsUpdate(callback: (data: any) => void) {
        this.bookingsHandlers.push(callback);
        return () => {
            this.bookingsHandlers = this.bookingsHandlers.filter(h => h !== callback);
        };
    }

    onTasksUpdate(callback: (data: any) => void) {
        this.tasksHandlers.push(callback);
        return () => {
            this.tasksHandlers = this.tasksHandlers.filter(h => h !== callback);
        };
    }

    onTyping(handler: (data: { roomId: string, userId: string, userName: string, isTyping: boolean }) => void) {
        this.typingHandlers.push(handler);
        return () => { this.typingHandlers = this.typingHandlers.filter(h => h !== handler); };
    }

    // --- WebRTC Signaling ---

    callUser(userToCall: string, signalData: any, from: string, name: string, callType: 'video' | 'voice' = 'video') {
        this.socket?.emit('call_user', { userToCall, signalData, from, name, callType });
    }

    answerCall(data: { to: string, signal: any }) {
        this.socket?.emit('answer_call', data);
    }

    sendIceCandidate(to: string, candidate: any) {
        this.socket?.emit('ice_candidate', { to, candidate });
    }

    endCall(to: string) {
        this.socket?.emit('end_call', { to });
    }

    onCallReceived(callback: (data: { from: string, name: string, signal: any, callType?: 'video' | 'voice' }) => void) {
        this.callReceivedHandlers.push(callback);
        return () => { this.callReceivedHandlers = this.callReceivedHandlers.filter(h => h !== callback); };
    }

    onCallAccepted(callback: (signal: any) => void) {
        this.callAcceptedHandlers.push(callback);
        return () => { this.callAcceptedHandlers = this.callAcceptedHandlers.filter(h => h !== callback); };
    }

    onIceCandidateReceived(callback: (candidate: any) => void) {
        this.iceCandidateHandlers.push(callback);
        return () => { this.iceCandidateHandlers = this.iceCandidateHandlers.filter(h => h !== callback); };
    }

    onCallEnded(callback: () => void) {
        this.callEndedHandlers.push(callback);
        return () => { this.callEndedHandlers = this.callEndedHandlers.filter(h => h !== callback); };
    }
}

export const socketService = new SocketService();