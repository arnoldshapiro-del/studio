
import type {
  MedicationState,
  WaterState,
  InjectionState,
  WorkoutState,
  MoodState,
  StressState,
  MeditationState,
  FoodState,
  SleepState,
  BiometricsState,
  SocialState,
  AnalyticsState,
} from './types';

export const initialMedicationState: MedicationState = {
  morning: { time: '08:00' },
  evening: { time: '20:00' },
  history: [],
};

export const initialWaterState: WaterState = {
  history: [],
};

export const initialInjectionState: InjectionState = {
  startDate: new Date().toISOString(),
  frequency: 7,
  history: [],
};

export const initialWorkoutState: WorkoutState = {
  treadmill: {
    goal: 4,
  },
  resistance: {
    goal: 2,
  },
  history: [],
};

export const initialMoodState: MoodState = {
    history: [],
};

export const initialStressState: StressState = {
  history: [],
};

export const initialMeditationState: MeditationState = {
    history: [],
};

export const initialFoodState: FoodState = {
  dailyGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  },
  history: [],
};

export const initialSleepState: SleepState = {
  targetHours: 8,
  history: [],
};

export const initialBiometricsState: BiometricsState = {
  personalInfo: {},
  targets: {
    dailySteps: 10000,
  },
  alerts: {
    enabled: false,
    thresholds: {
      heartRateHigh: 100,
      heartRateLow: 60,
      systolicHigh: 140,
      diastolicHigh: 90,
      temperatureHigh: 38.5,
      oxygenSaturationLow: 95,
    },
  },
  history: [],
};

export const initialSocialState: SocialState = {
  profile: {
    displayName: 'Health Enthusiast',
    privacyLevel: 'friends',
    shareAchievements: true,
    shareProgress: true,
  },
  friends: [],
  challenges: [],
  achievements: [],
  communityPosts: [],
  accountabilityPartners: [],
  messages: [],
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
};

export const initialAnalyticsState: AnalyticsState = {
  reports: [],
  patterns: [],
  anomalies: [],
  correlations: [],
  wellnessScores: [],
  priorityActions: [],
  preferences: {
    dashboardWidgets: ['wellness-score', 'priority-actions', 'trends', 'correlations'],
    reportFrequency: 'monthly',
    anomalyAlerts: true,
    shareWithProvider: false,
  },
};
