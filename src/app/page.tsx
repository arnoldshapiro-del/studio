
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { AllData, WorkoutEntry, StressEntry } from '@/lib/types';
import { initialMedicationState, initialWaterState, initialInjectionState, initialWorkoutState, initialMoodState, initialStressState, initialMeditationState } from '@/lib/data';

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
import FoodTracker from '@/components/dashboard/food-tracker';
import StressWellness from '@/components/dashboard/stress-wellness';
import Settings from '@/components/settings';
import Help from '@/components/help';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/firebase/firestore/use-doc';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Calendar from '@/components/dashboard/calendar';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { BarChart, CheckSquare, HelpCircle, LayoutDashboard, Settings as SettingsIcon, Utensils, BrainCircuit, Users } from 'lucide-react';


export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeView, setActiveView] = useState('dashboard');

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);

  const { data: userData, isLoading: userDataLoading } = useDoc<AllData>(userDocRef);

  const allData = useMemo(() => {
    if (userData) {
      return {
        medication: userData.medication || initialMedicationState,
        water: userData.water || initialWaterState,
        injection: userData.injection || initialInjectionState,
        workout: userData.workout || initialWorkoutState,
        mood: userData.mood || initialMoodState,
        stress: userData.stress || initialStressState,
        meditation: userData.meditation || initialMeditationState,
      };
    }
    return {
      medication: initialMedicationState,
      water: initialWaterState,
      injection: initialInjectionState,
      workout: initialWorkoutState,
      mood: initialMoodState,
      stress: initialStressState,
      meditation: initialMeditationState,
    };
  }, [userData]);


  const handleUpdateWorkout = (updatedEntry: WorkoutEntry) => {
    if (!userDocRef) return;
    const updatedHistory = allData.workout.history.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry);
    setDocumentNonBlocking(userDocRef, { workout: { ...allData.workout, history: updatedHistory } }, { merge: true });
  };

  const handleDeleteWorkout = (entryId: string) => {
     if (!userDocRef) return;
    const updatedHistory = allData.workout.history.filter(entry => entry.id !== entryId);
    setDocumentNonBlocking(userDocRef, { workout: { ...allData.workout, history: updatedHistory } }, { merge: true });
  };

  useEffect(() => {
    if (!user && !isUserLoading) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || userDataLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className='flex flex-1'>
        <Sidebar>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard">
                        <LayoutDashboard />
                        <span>Dashboard</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('trackers')} isActive={activeView === 'trackers'} tooltip="Daily Trackers">
                        <CheckSquare />
                        <span>Daily Trackers</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('food')} isActive={activeView === 'food'} tooltip="Food">
                        <Utensils />
                        <span>Food</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('stress')} isActive={activeView === 'stress'} tooltip="Stress & Wellness">
                        <BrainCircuit />
                        <span>Stress</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('progress')} isActive={activeView === 'progress'} tooltip="Progress">
                        <BarChart />
                        <span>Progress</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('community')} isActive={activeView === 'community'} tooltip="Community">
                        <Users />
                        <span>Community</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('settings')} isActive={activeView === 'settings'} tooltip="Settings">
                        <SettingsIcon />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveView('help')} isActive={activeView === 'help'} tooltip="Help">
                        <HelpCircle />
                        <span>Help</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </Sidebar>
        <SidebarInset>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {activeView !== 'help' && activeView !== 'settings' && <DashboardHeader />}
          <div className='mt-8'>
            {activeView === 'dashboard' && (
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
            )}

            {activeView === 'trackers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <MedicationTracker />
                <WaterTracker />
                <InjectionTracker />
                <WorkoutTracker />
                <MoodTracker />
                <div className="md:col-span-2 lg:col-span-1 lg:row-start-auto">
                  <AiInsights allData={allData} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <AiRecommendations workoutData={allData.workout} />
                </div>
              </div>
            )}
            
            {activeView === 'food' && (
                <FoodTracker />
            )}
            
            {activeView === 'community' && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Community Features Coming Soon!</h2>
                    <p className="text-muted-foreground mt-2">Connect with friends, join challenges, and stay motivated together.</p>
                </div>
            )}

            {activeView === 'stress' && (
              <StressWellness />
            )}

            {activeView === 'progress' && (
                <ProgressCharts allData={allData} />
            )}

            {activeView === 'settings' && (
                <Settings 
                  allData={allData} 
                />
            )}

            {activeView === 'help' && (
                <Help />
            )}
          </div>
        </main>
        </SidebarInset>
      </div>
    </div>
    </SidebarProvider>
  );
}

    
