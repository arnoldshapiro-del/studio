
import type {
  MedicationState,
  WaterState,
  InjectionState,
  WorkoutState,
  MoodState,
  StressState,
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
