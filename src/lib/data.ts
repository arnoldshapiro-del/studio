import type {
  MedicationState,
  WaterState,
  InjectionState,
  WorkoutState,
} from './types';

export const initialMedicationState: MedicationState = {
  morning: { taken: false, time: '08:00' },
  evening: { taken: false, time: '20:00' },
};

export const initialWaterState: WaterState = {
  morning: false,
  afternoon: false,
  evening: false,
};

export const initialInjectionState: InjectionState = {
  startDate: new Date().toISOString(),
  frequency: 7,
  history: [],
};

export const initialWorkoutState: WorkoutState = {
  treadmill: {
    sessionsThisWeek: 0,
    goal: 4,
  },
  resistance: {
    sessionsThisWeek: 0,
    goal: 2,
  },
};
