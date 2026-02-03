
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);

    onModuleInit() {
        try {
            const serviceAccountPath = path.resolve(process.cwd(), 'firebase-adminsdk.json');
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath),
                });
                this.logger.log('Firebase Admin Initialized successfully');
            }
        } catch (error) {
            this.logger.error('Error initializing Firebase Admin:', error);
        }
    }

    async sendToDevice(token: string, title: string, body: string, data?: any) {
        try {
            if (!token) return;

            const payload: admin.messaging.TokenMessage = {
                token: token,
                notification: {
                    title: title,
                    body: body,
                },
                data: data || {},
            };

            await admin.messaging().send(payload);
            this.logger.log(`Notification sent to ${token}`);
        } catch (error) {
            this.logger.error(`Error sending notification to ${token}`, error);
        }
    }
}
