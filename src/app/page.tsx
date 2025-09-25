"use client";

import { useState, useMemo } from 'react';
import type { MedicationState, WaterState, InjectionState, WorkoutState } from '@/lib/types';
import {
  initialMedicationState,
  initialWaterState,
  initialInjectionState,
  initialWorkoutState,
} from '@/lib/data';

import Header from '@/components/header';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import MedicationTracker from '@/components/dashboard/medication-tracker';
import WaterTracker from '@/components/dashboard/water-tracker';
import InjectionTracker from '@/components/dashboard/injection-tracker';
import WorkoutTracker from '@/components/dashboard/workout-tracker';
import AiInsights from '@/components/dashboard/ai-insights';
import AiRecommendations from '@/components/dashboard/ai-recommendations';

export default function Home() {
  const [medication, setMedication] = useState<MedicationState>(initialMedicationState);
  const [water, setWater] = useState<WaterState>(initialWaterState);
  const [injection, setInjection] = useState<InjectionState>(initialInjectionState);
  const [workout, setWorkout] = useState<WorkoutState>(initialWorkoutState);
  
  const allData = useMemo(() => ({
    medication,
    water,
    injection,
    workout
  }), [medication, water, injection, workout]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <MedicationTracker medication={medication} setMedication={setMedication} />
          <WaterTracker water={water} setWater={setWater} />
          <InjectionTracker injection={injection} setInjection={setInjection} />
          <WorkoutTracker workout={workout} setWorkout={setWorkout} />
          <div className="md:col-span-2 lg:col-span-1 lg:row-start-2">
             <AiInsights allData={allData} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <AiRecommendations workoutData={workout} />
          </div>
        </div>
      </main>
    </div>
  );
}
