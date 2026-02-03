
import { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from '../firebase-config';
import { api } from '../services/api';
// Note: adjusting import based on api.ts location being in root/services or src/services
// If api.ts is in root/services, import should be '../services/api' from src/hooks

const usePushNotifications = (userId?: string) => {
    const [notification, setNotification] = useState<any>(null);

    useEffect(() => {
        if (userId) {
            // Request permission and get token
            requestForToken().then(token => {
                if (token) {
                    // Send token to backend
                    api.post('/users/push-token', { token })
                        .catch(err => console.error('Failed to sync FCM token', err));
                }
            });

            // Listen for foreground messages
            const unsubscribe = onMessageListener().then((payload: any) => {
                setNotification({
                    title: payload.notification?.title,
                    body: payload.notification?.body,
                });
                // Optional: Trigger a toast or sound here
                const audio = new Audio('/notification.mp3'); // Ensure this file exists or remove
                audio.play().catch(() => { });
            });
        }
    }, [userId]);

    return { notification };
};

export default usePushNotifications;
