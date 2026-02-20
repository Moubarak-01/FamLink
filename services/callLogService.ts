import { authService } from './authService';

const API_URL = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/call-logs` : 'http://localhost:3001/api/call-logs';

export interface CallLogEntry {
    id: string;
    callerId: string;
    callerName: string;
    callerPhoto?: string;
    receiverId: string;
    receiverName: string;
    receiverPhoto?: string;
    callType: 'video' | 'voice';
    status: 'missed' | 'completed' | 'rejected' | 'no_answer';
    duration: number;
    startedAt: string;
    endedAt?: string;
    createdAt: string;
}

export interface CallStats {
    totalCalls: number;
    missedCalls: number;
    completedCalls: number;
    totalDuration: number;
}

class CallLogService {
    private async getHeaders(): Promise<Headers> {
        const profile = await authService.getProfile();
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        return headers;
    }

    async getCallHistory(userId: string, limit = 50): Promise<CallLogEntry[]> {
        try {
            const response = await fetch(`${API_URL}/${userId}?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch call history');
            return response.json();
        } catch (error) {
            console.error('Error fetching call history:', error);
            return [];
        }
    }

    async getCallStats(userId: string): Promise<CallStats | null> {
        try {
            const response = await fetch(`${API_URL}/${userId}/stats`);
            if (!response.ok) throw new Error('Failed to fetch call stats');
            return response.json();
        } catch (error) {
            console.error('Error fetching call stats:', error);
            return null;
        }
    }

    async clearCallHistory(userId: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/${userId}`, {
                method: 'DELETE',
            });
            return response.ok;
        } catch (error) {
            console.error('Error clearing call history:', error);
            return false;
        }
    }

    formatDuration(seconds: number): string {
        if (seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatCallTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
}

export const callLogService = new CallLogService();
