
export type TimeOfDay = {
  taken: boolean;
  time: string;
};

export type DatedEntry = {
  date: string; // ISO string
};

export type MedicationEntry = DatedEntry & { 
  period: 'morning' | 'evening';
  time: string; 
};

export type MedicationState = {
  morning: { time: string };
  evening: { time: string };
  history: MedicationEntry[];
};

export type WaterState = {
  history: (DatedEntry & { period: 'morning' | 'afternoon' | 'evening' })[];
};

export type InjectionEntry = DatedEntry & {
  id: string;
  site: string; // e.g., 'Abdomen Left', 'Thigh Right'
};

export type InjectionState = {
  startDate: string; // ISO string
  frequency: number; // in days
  history: InjectionEntry[];
};

export type WorkoutEntry = DatedEntry & {
  id: string;
  type: 'treadmill' | 'resistance';
  startTime: string;
  endTime: string;
};

export type WorkoutState = {
  treadmill: {
    goal: number;
  };
  resistance: {
    goal: number;
  };
  history: WorkoutEntry[];
};

export type MoodEntry = DatedEntry & {
    mood: 'great' | 'good' | 'neutral' | 'bad' | 'awful';
    notes: string;
};

export type MoodState = {
    history: MoodEntry[];
};

export type StressEntry = DatedEntry & {
  level: number; // 1-10
  notes?: string;
};

export type StressState = {
  history: StressEntry[];
};

export type MeditationEntry = DatedEntry & {
    duration: number; // in minutes
};

export type MeditationState = {
    history: MeditationEntry[];
};


// Food tracking types
export type FoodItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodEntry = DatedEntry & {
  id: string;
  mealType: MealType;
  items: FoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  photoUrl?: string; // Base64 data URL for the photo
  analysisMethod: 'photo' | 'barcode' | 'manual';
  timestamp: string; // When the food was consumed
};

export type FoodState = {
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  history: FoodEntry[];
};

// Sleep tracking types
export type SleepStage = 'deep' | 'light' | 'rem' | 'awake';

export type SleepEnvironment = {
  temperature?: number; // Celsius
  noise?: 'quiet' | 'moderate' | 'noisy';
  screenTime?: number; // minutes before bed
  lighting?: 'dark' | 'dim' | 'bright';
};

export type SleepEntry = DatedEntry & {
  id: string;
  bedtime: string; // ISO time
  wakeTime: string; // ISO time
  duration: number; // total minutes
  quality: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  stages?: {
    deep: number; // minutes
    light: number; // minutes
    rem: number; // minutes
    awake: number; // minutes
  };
  environment?: SleepEnvironment;
  notes?: string;
  sleepDebt?: number; // accumulated sleep debt in hours
};

export type SleepState = {
  targetHours: number; // daily sleep goal
  history: SleepEntry[];
};

// Biometrics tracking types
export type BiometricReading = {
  value: number;
  timestamp: string;
  source?: 'manual' | 'device' | 'wearable';
  deviceName?: string;
};

export type BiometricEntry = DatedEntry & {
  id: string;
  heartRate?: BiometricReading[];
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    timestamp: string;
    source?: 'manual' | 'device';
  }[];
  temperature?: BiometricReading[]; // Celsius
  weight?: BiometricReading[]; // kg
  oxygenSaturation?: BiometricReading[]; // SpO2 percentage
  heartRateVariability?: BiometricReading[]; // HRV in ms
  steps?: BiometricReading[];
  respiratoryRate?: BiometricReading[]; // breaths per minute
};

export type BiometricsState = {
  personalInfo: {
    age?: number;
    height?: number; // cm
    biologicalSex?: 'male' | 'female' | 'other';
  };
  targets: {
    weight?: number; // target weight in kg
    restingHeartRate?: number;
    dailySteps?: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      heartRateHigh?: number;
      heartRateLow?: number;
      systolicHigh?: number;
      diastolicHigh?: number;
      temperatureHigh?: number;
      oxygenSaturationLow?: number;
    };
  };
  history: BiometricEntry[];
};

// Social and Community types
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: FriendStatus;
  connectedAt: string;
  lastActivity?: string;
};

export type ChallengeType = 'workout' | 'water' | 'sleep' | 'steps' | 'meditation' | 'streak';

export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  unit: string;
  duration: number; // days
  startDate: string;
  endDate: string;
  participants: string[]; // user IDs
  leaderboard: {
    userId: string;
    name: string;
    progress: number;
    completedAt?: string;
  }[];
  isPublic: boolean;
  createdBy: string;
  prize?: string;
};

export type CommunityPost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'success_story' | 'question' | 'motivation' | 'tip';
  tags: string[];
  likes: string[]; // user IDs
  comments: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
  }[];
  timestamp: string;
  isExpert?: boolean;
};

// Achievement System types
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: 'medication' | 'water' | 'workout' | 'sleep' | 'food' | 'mood' | 'social' | 'streak';
  tier: AchievementTier;
  icon: string;
  requirement: {
    type: 'count' | 'streak' | 'goal' | 'consistency';
    target: number;
    period?: 'day' | 'week' | 'month' | 'year';
  };
  points: number;
  unlockedAt?: string;
  progress: number;
};

export type UserAchievement = {
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isNew: boolean;
};

// Peer Support types
export type AccountabilityPartner = {
  id: string;
  name: string;
  avatar?: string;
  goals: string[];
  matchScore: number;
  connectedAt: string;
  lastCheckIn?: string;
};

export type SupportMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  type: 'encouragement' | 'check_in' | 'milestone' | 'question';
  timestamp: string;
  read: boolean;
};

export type SocialState = {
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
    privacyLevel: 'public' | 'friends' | 'private';
    shareAchievements: boolean;
    shareProgress: boolean;
  };
  friends: Friend[];
  challenges: Challenge[];
  achievements: UserAchievement[];
  communityPosts: CommunityPost[];
  accountabilityPartners: AccountabilityPartner[];
  messages: SupportMessage[];
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
};

export type AllData = {
  medication: MedicationState;
  water: WaterState;
  injection: InjectionState;
  workout: WorkoutState;
  mood: MoodState;
  stress: StressState;
  meditation: MeditationState;
  food: FoodState;
  sleep: SleepState;
  biometrics: BiometricsState;
  social: SocialState;
};
