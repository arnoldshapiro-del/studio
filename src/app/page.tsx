"use client";

import { useEffect, useMemo, useState } from 'react';
import type { MedicationState, WaterState, InjectionState, WorkoutState, AllData } from '@/lib/types';
import { initialMedicationState, initialWaterState, initialInjectionState, initialWorkoutState } from '@/lib/data';

import Header from '@/components/header';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import MedicationTracker from '@/components/dashboard/medication-tracker';
import WaterTracker from '@/components/dashboard/water-tracker';
import InjectionTracker from '@/components/dashboard/injection-tracker';
import WorkoutTracker from '@/components/dashboard/workout-tracker';
import AiInsights from '@/components/dashboard/ai-insights';
import AiRecommendations from '@/components/dashboard/ai-recommendations';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/firebase/firestore/use-doc';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Changed to point to a specific document 'data' inside the user's collection
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);

  const { data: userData, isLoading: userDataLoading } = useDoc<AllData>(userDocRef);

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

  useEffect(() => {
    if (!userDataLoading && userData) {
      setMedication(userData.medication || initialMedicationState);
      setWater(userData.water || initialWaterState);
      setInjection(userData.injection || initialInjectionState);
      setWorkout(userData.workout || initialWorkoutState);
    }
  }, [userData, userDataLoading]);

  useEffect(() => {
    if (userDocRef && !userDataLoading) {
      // Only write if there is a user and the initial data has been loaded or is empty
      if (user) {
        setDocumentNonBlocking(userDocRef, allData, { merge: true });
      }
    }
  }, [allData, userDocRef, userDataLoading, user]);

  useEffect(() => {
    if (!user && !isUserLoading) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

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
