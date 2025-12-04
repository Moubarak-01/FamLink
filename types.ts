// types.ts

export interface Question {
  id: number;
  type: 'single-choice' | 'multiple-choice' | 'open-ended';
  text: string;
  options: string[];
}

export interface Answer {
  questionId: number;
  answer: string | string[];
}

export type Decision = 'Approved' | 'Rejected';

export interface AssessmentResult {
  score: number;
  feedback: string;
  decision: Decision;
}

export interface LocationData {
  address: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface NannyProfile {
  phone: string;
  rating: number;
  ratingCount: number; // <-- ADDED THIS FIELD
  location: LocationData | string; 
  description: string;
  experience: string;
  certifications: string[];
  availability: string;
  availableDates?: string[];
}

export interface Rating {
  parentId: string;
  ratingValue: number;
  comment?: string;
}

// Feature 2: Message Status
export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text: string; // <-- Now stores ciphertext
  plaintext?: string; // <-- New field for decrypted message
  mac?: string; // <-- New field for Message Authentication Code
  timestamp: number;
  status: MessageStatus;
}

export interface BookingRequest {
  id: string;
  parentId: string;
  parentName: string;
  nannyId: string;
  nannyName?: string;
  nannyPhoto?: string;
  date: string;
  startTime: string;
  endTime: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  messages?: ChatMessage[];
}

export interface Task {
  id: string;
  parentId: string;
  nannyId: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  keepPermanently?: boolean;
}

export interface Child {
  name: string;
  age: number;
}

export type NotificationType = 'booking' | 'task' | 'system' | 'chat' | 'outing' | 'skill';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt?: string;
  timestamp?: number;
  relatedId?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  userType: UserType;
  isVerified?: boolean;
  photo?: string;
  phone?: string;
  assessmentResult?: AssessmentResult;
  suspendedUntil?: string;
  profile?: Partial<NannyProfile>;
  subscription?: Subscription;
  addedNannyIds?: string[];
  ratings?: Rating[];
  location?: LocationData | string;
  interests?: ActivityCategory[];
  children?: Child[];
  skillsToTeach?: SkillCategory[];
}

export type ActivityCategory = 'walks' | 'playdates' | 'workout' | 'shopping' | 'studying' | 'dads' | 'other';
export type SkillCategory = 'cooking' | 'cleaning' | 'tutoring' | 'tech' | 'crafts' | 'other';

export interface Activity {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  category: ActivityCategory;
  description: string;
  location: string;
  date: string;
  time: string;
  participants: string[];
  messages?: ChatMessage[];
}

export interface OutingRequest {
    parentId: string;
    parentName: string;
    childName: string;
    childAge: number;
    emergencyContactName: string;
    emergencyContactPhone: string;
    status: 'pending' | 'accepted' | 'declined';
}

export interface SharedOuting {
    id: string;
    hostId: string;
    hostName: string;
    hostPhoto: string;
    title: string;
    description: string;
    location: string;
    liveLocationEnabled?: boolean;
    date: string;
    time: string;
    maxChildren: number;
    costDetails: string;
    requests: OutingRequest[];
    messages?: ChatMessage[];
}

export interface SkillOffer {
    helperId: string;
    helperName: string;
    helperPhoto: string;
    offerAmount: number;
    message: string;
    status: 'pending' | 'accepted' | 'declined';
}

export interface SkillRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterPhoto: string;
    category: SkillCategory;
    title: string;
    description: string;
    location: string;
    budget: number;
    status: 'open' | 'in_progress' | 'completed';
    offers: SkillOffer[];
    messages?: ChatMessage[];
}

export type UserType = 'parent' | 'nanny';
export type Plan = 'parent_monthly' | 'parent_yearly';

export interface Subscription {
  plan: Plan;
  status: 'active' | 'canceled';
  renewalDate: string;
}

export enum Screen {
  Welcome, SignUp, Login, ForgotPassword, Questionnaire, Loading, Result,
  NannyProfileForm, ParentProfileForm, Subscription, SubscriptionStatus,
  Dashboard, NannyListing, NannyProfileDetail, CommunityActivities,
  ChildOutings, SkillMarketplace,
}