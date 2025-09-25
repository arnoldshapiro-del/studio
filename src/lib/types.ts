export type TimeOfDay = {
  taken: boolean;
  time: string;
};

export type MedicationState = {
  morning: TimeOfDay;
  evening: TimeOfDay;
};

export type WaterState = {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

export type InjectionState = {
  startDate: string; // ISO string
  frequency: number; // in days
  history: string[]; // Array of ISO strings
};

export type WorkoutState = {
  treadmill: {
    sessionsThisWeek: number;
    goal: number;
  };
  resistance: {
    sessionsThisWeek: number;
    goal: number;
  };
};

export type AllData = {
  medication: MedicationState;
  water: WaterState;
  injection: InjectionState;
  workout: WorkoutState;
};
