
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyB-OezLdY-HJYS95rdDwfAyNusKU6qCwgA",
    authDomain: "famlink-4ad30.firebaseapp.com",
    projectId: "famlink-4ad30",
    storageBucket: "famlink-4ad30.firebasestorage.app",
    messagingSenderId: "1062689766708",
    appId: "1:1062689766708:web:7cc5f5f28ea7ccf424f961",
    measurementId: "G-XQEM8PFT9Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging);
        if (currentToken) {

            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
