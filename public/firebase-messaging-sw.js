importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyB-OezLdY-HJYS95rdDwfAyNusKU6qCwgA",
    authDomain: "famlink-4ad30.firebaseapp.com",
    projectId: "famlink-4ad30",
    storageBucket: "famlink-4ad30.firebasestorage.app",
    messagingSenderId: "1062689766708",
    appId: "1:1062689766708:web:7cc5f5f28ea7ccf424f961",
    measurementId: "G-XQEM8PFT9Z"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
