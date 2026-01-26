/**
 * API Configuration
 * Central configuration for API endpoints
 */

// Base URL for the backend API
// Change this to your production URL when deploying

export const API_BASE_URL = __DEV__
  ? 'http://10.42.56.165:5000/api/v1'
  : 'https://your-production-api.com/api/v1';

// For iOS Simulator, use 'http://localhost:5000/api/v1'
// For physical device, use your computer's local IP

// API Version
export const API_VERSION = 'v1';

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    VERIFY_TOKEN: '/auth/verify-token',
    ME: '/auth/me',
    FCM_TOKEN: '/auth/fcm-token',
    LOGOUT: '/auth/logout',
    DELETE_ACCOUNT: '/auth/account',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    COMPLETE_PROFILE: '/users/complete-profile',
    LOCATION: '/users/location',
    SWITCH_MODE: '/users/switch-mode',
    TOGGLE_AVAILABILITY: '/users/toggle-availability',
    NEARBY_WORKERS: '/users/nearby-workers',
    SEARCH: '/users/search',
    GET_BY_ID: (id: string) => `/users/${id}`,
  },
  
  // Jobs
  JOBS: {
    CREATE: '/jobs',
    MY_JOBS: '/jobs/my-jobs',
    AVAILABLE: '/jobs/available',
    GET_BY_ID: (id: string) => `/jobs/${id}`,
    UPDATE: (id: string) => `/jobs/${id}`,
    CANCEL: (id: string) => `/jobs/${id}/cancel`,
    CLOSE: (id: string) => `/jobs/${id}/close`,
    APPLICANTS: (id: string) => `/jobs/${id}/applicants`,
  },
  
  // Applications
  APPLICATIONS: {
    APPLY: '/applications/apply',
    MY_APPLICATIONS: '/applications/my-applications',
    ACCEPTED_JOBS: '/applications/accepted-jobs',
    INCOMING_REQUESTS: '/applications/incoming-requests',
    HANDLE: (id: string) => `/applications/${id}`,
    WITHDRAW: (id: string) => `/applications/${id}`,
    COMPLETE: (id: string) => `/applications/accepted/${id}/complete`,
    RATE: (id: string) => `/applications/accepted/${id}/rate`,
  },
  
  // Skill Posts
  SKILL_POSTS: {
    CREATE: '/skill-posts',
    LIST: '/skill-posts',
    MY_POSTS: '/skill-posts/my-posts',
    GET_BY_ID: (id: string) => `/skill-posts/${id}`,
    UPDATE: (id: string) => `/skill-posts/${id}`,
    DELETE: (id: string) => `/skill-posts/${id}`,
    REQUEST: (id: string) => `/skill-posts/${id}/request`,
  },
  
  // Chat
  CHAT: {
    ROOMS: '/chat',
    GET_ROOM: (id: string) => `/chat/${id}`,
    MESSAGES: (id: string) => `/chat/${id}/messages`,
    SEND: (id: string) => `/chat/${id}/message`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    DELETE: (id: string) => `/notifications/${id}`,
    DELETE_ALL: '/notifications',
  },
};
