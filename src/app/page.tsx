
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { AllData, WorkoutEntry } from '@/lib/types';
import { initialMedicationState, initialWaterState, initialInjectionState, initialWorkoutState, initialMoodState } from '@/lib/data';

import Header from '@/components/header';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import MedicationTracker from '@/components/dashboard/medication-tracker';
import WaterTracker from '@/components/dashboard/water-tracker';
import InjectionTracker from '@/components/dashboard/injection-tracker';
import WorkoutTracker from '@/components/dashboard/workout-tracker';
import MoodTracker from '@/components/dashboard/mood-tracker';
import StreaksTracker from '@/components/dashboard/streaks-tracker';
import AiInsights from '@/components/dashboard/ai-insights';
import AiRecommendations from '@/components/dashboard/ai-recommendations';
import ProgressCharts from '@/components/dashboard/progress-charts';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/firebase/firestore/use-doc';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Calendar from '@/components/dashboard/calendar';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);

  const { data: userData, isLoading: userDataLoading } = useDoc<AllData>(userDocRef);

  const [medication, setMedication] = useState(initialMedicationState);
  const [water, setWater] = useState(initialWaterState);
  const [injection, setInjection] = useState(initialInjectionState);
  const [workout, setWorkout] = useState(initialWorkoutState);
  const [mood, setMood] = useState(initialMoodState);
  
  const allData: AllData = useMemo(() => ({
    medication,
    water,
    injection,
    workout,
    mood
  }), [medication, water, injection, workout, mood]);

  const handleUpdateWorkout = (updatedEntry: WorkoutEntry) => {
    setWorkout(prev => ({
      ...prev,
      history: prev.history.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
    }));
  };

  const handleDeleteWorkout = (entryId: string) => {
    setWorkout(prev => ({
      ...prev,
      history: prev.history.filter(entry => entry.id !== entryId)
    }));
  };

  useEffect(() => {
    if (!userDataLoading && userData) {
      setMedication(userData.medication || initialMedicationState);
      setWater(userData.water || initialWaterState);
      setInjection(userData.injection || initialInjectionState);
      setWorkout(userData.workout || initialWorkoutState);
      setMood(userData.mood || initialMoodState);
    }
  }, [userData, userDataLoading]);

  useEffect(() => {
    if (userDocRef && !userDataLoading) {
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
        <Tabs defaultValue="dashboard" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="trackers">Daily Trackers</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Calendar 
                  allData={allData} 
                  onUpdateWorkout={handleUpdateWorkout}
                  onDeleteWorkout={handleDeleteWorkout}
                />
              </div>
              <div className="lg:col-span-1">
                <StreaksTracker allData={allData} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="trackers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <MedicationTracker medication={medication} setMedication={setMedication} />
              <WaterTracker water={water} setWater={setWater} />
              <InjectionTracker injection={injection} setInjection={setInjection} />
              <WorkoutTracker workout={workout} setWorkout={setWorkout} />
              <MoodTracker mood={mood} setMood={setMood} />
              <div className="md:col-span-2 lg:col-span-1 lg:row-start-auto">
                <AiInsights allData={allData} />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <AiRecommendations workoutData={workout} />
              </div>
            </div>
          </TabsContent>
           <TabsContent value="progress">
              <ProgressCharts allData={allData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
