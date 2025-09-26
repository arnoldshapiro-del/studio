
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
