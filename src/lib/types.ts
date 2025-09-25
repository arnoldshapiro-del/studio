
export type TimeOfDay = {
  taken: boolean;
  time: string;
};

export type DatedEntry = {
  date: string; // ISO string
};

export type MedicationState = {
  morning: { time: string };
  evening: { time: string };
  history: (DatedEntry & { period: 'morning' | 'evening' })[];
};

export type WaterState = {
  history: (DatedEntry & { period: 'morning' | 'afternoon' | 'evening' })[];
};

export type InjectionState = {
  startDate: string; // ISO string
  frequency: number; // in days
  history: string[]; // Array of ISO strings for dates
};

export type WorkoutState = {
  treadmill: {
    goal: number;
  };
  resistance: {
    goal: number;
  };
  history: (DatedEntry & { type: 'treadmill' | 'resistance' })[];
};

export type AllData = {
  medication: MedicationState;
  water: WaterState;
  injection: InjectionState;
  workout: WorkoutState;
};
