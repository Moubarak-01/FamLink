import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/marketplaceService';
import { activityService } from '../services/activityService';
import { bookingService } from '../services/bookingService';
import { notificationService } from '../services/notificationService';
import { taskService } from '../services/taskService';
import { outingService } from '../services/outingService';

// Ensure we are importing the FRONTEND services, not backend
// Checking imports... assuming services/*.ts are the frontend ones.

export const useActivities = () => {
    return useQuery({
        queryKey: ['activities'],
        queryFn: () => activityService.getAll(),
        staleTime: 1000 * 60 * 5, // 5 minutes (unless invalidated)
    });
};

export const useSkillRequests = () => {
    return useQuery({
        queryKey: ['skillRequests'],
        queryFn: () => marketplaceService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useBookings = (userId: string) => {
    return useQuery({
        queryKey: ['bookings', userId],
        // Assuming getAll returns bookings for the user based on Auth token
        queryFn: () => bookingService.getAll(),
        enabled: !!userId,
    });
};

export const useNotifications = (userId: string) => {
    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: () => notificationService.getAll(),
        enabled: !!userId,
    });
};

export const useTasks = (userId: string) => {
    return useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => taskService.getAll(),
        enabled: !!userId,
    });
};

export const useSharedOutings = () => {
    return useQuery({
        queryKey: ['outings'],
        queryFn: () => outingService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
};
