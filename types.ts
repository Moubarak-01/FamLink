export interface Question {
  id: number;
  type: 'single-choice' | 'multiple-choice' | 'open-ended';
  text: string;
  options: string[];
}

export interface Answer {
  questionId: number;
  answer: string | string[]; // string for single/open, string[] for multiple
}

export type Decision = 'Approved' | 'Rejected';

export interface AssessmentResult {
  score: number;
  feedback: string;
  decision: Decision;
}

export interface NannyProfile {
  phone: string;
  rating: number;
  location: string;
  description: string;
  experience: string; // Should be a number as a string, e.g., "5"
  certifications: string[];
  availability: string;
  availableDates?: string[]; // Array of dates in 'YYYY-MM-DD' format
}

export interface Rating {
  parentId: string;
  ratingValue: number;
  comment?: string;
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
  status: 'pending' | 'accepted' | 'declined';
  messages?: ChatMessage[];
}

export interface Task {
  id: string;
  parentId: string;
  nannyId: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
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
  timestamp?: number; // Keep for backward compatibility if needed
  createdAt?: string; // Add field from MongoDB schema
  relatedId?: string; // ID of the booking, task, etc.
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string; // In a real app, this would be a hash
  userType: UserType;
  isVerified?: boolean; // New verification badge status
  photo?: string; // URL or base64
  phone?: string; // Added phone number field
  assessmentResult?: AssessmentResult;
  assessmentAttempts?: number;
  suspendedUntil?: string; // ISO string
  profile?: Partial<NannyProfile>;
  subscription?: Subscription;
  addedNannyIds?: string[];
  ratings?: Rating[];
  // Fields for parent profile & matching
  location?: string;
  interests?: ActivityCategory[];
  children?: Child[];
  skillsToTeach?: SkillCategory[];
}

export type ActivityCategory = 'walks' | 'playdates' | 'workout' | 'shopping' | 'studying' | 'dads' | 'other';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto: string;
    text: string;
    timestamp: number;
}

export interface Activity {
  id: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  category: ActivityCategory;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  participants: string[]; // array of user IDs
  messages?: ChatMessage[];
}

export interface OutingRequest {
    parentId: string;
    parentName: string;
    childName: string;
    childAge: number;
    emergencyContactName: string; // New
    emergencyContactPhone: string; // New
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
    liveLocationEnabled?: boolean; // New
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    maxChildren: number;
    costDetails: string;
    requests: OutingRequest[];
    messages?: ChatMessage[];
}

export type SkillCategory = 'cooking' | 'cleaning' | 'tutoring' | 'tech' | 'crafts' | 'other';

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

export type Plan =
  | 'parent_monthly'
  | 'parent_yearly';

export interface Subscription {
  plan: Plan;
  status: 'active' | 'canceled';
  renewalDate: string;
}

export enum Screen {
  Welcome,
  SignUp,
  Login,
  ForgotPassword,
  Questionnaire,
  Loading,
  Result,
  NannyProfileForm,
  ParentProfileForm,
  Subscription,
  SubscriptionStatus,
  Dashboard,
  NannyListing,
  NannyProfileDetail,
  CommunityActivities,
  ChildOutings,
  SkillMarketplace,
}