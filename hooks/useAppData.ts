import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';
import { outingService } from '../services/outingService';
import { marketplaceService } from '../services/marketplaceService';
import { bookingService } from '../services/bookingService';
import { notificationService } from '../services/notificationService';
import { taskService } from '../services/taskService';
import { User, Activity, SharedOuting, SkillRequest, BookingRequest, Notification, Task } from '../types';

export const useAppData = (currentUser: User | null) => {
    const [approvedNannies, setApprovedNannies] = useState<User[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [sharedOutings, setSharedOutings] = useState<SharedOuting[]>([]);
    const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

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
        } catch (e) {
            console.error("Error fetching data", e);
        }
    }, [currentUser]);

    useEffect(() => { refreshData(); }, [refreshData]);

    return {
        approvedNannies, setApprovedNannies,
        activities, setActivities,
        sharedOutings, setSharedOutings,
        skillRequests, setSkillRequests,
        bookingRequests, setBookingRequests,
        notifications, setNotifications,
        tasks, setTasks,
        refreshData
    };
};