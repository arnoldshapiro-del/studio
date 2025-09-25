
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

export type AllData = {
  medication: MedicationState;
  water: WaterState;
  injection: InjectionState;
  workout: WorkoutState;
  mood: MoodState;
};
