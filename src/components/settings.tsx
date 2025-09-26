
'use client';

import { useState, useEffect }from 'react';
import type { WorkoutState, MedicationState, InjectionState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Settings as SettingsIcon, Pill, Syringe } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialWorkoutState, initialMedicationState, initialInjectionState } from '@/lib/data';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, parseISO } from 'date-fns';

type AllSettings = {
    workout: WorkoutState;
    medication: MedicationState;
    injection: InjectionState;
}

const Settings = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);
  
  const { data: userData } = useDoc<AllSettings>(userDocRef);
  
  const [workout, setWorkout] = useState<WorkoutState>(initialWorkoutState);
  const [medication, setMedication] = useState<MedicationState>(initialMedicationState);
  const [injection, setInjection] = useState<InjectionState>(initialInjectionState);
  
  useEffect(() => {
      if (userData) {
          setWorkout(userData.workout || initialWorkoutState);
          setMedication(userData.medication || initialMedicationState);
          setInjection(userData.injection || initialInjectionState);
      }
  }, [userData]);

  const handleSaveChanges = () => {
    if (!userDocRef) return;
    const updatedSettings = {
        workout,
        medication,
        injection: {
            ...injection,
            // When settings change, it's often best to reset history to avoid confusion
            history: [],
        }
    };
    setDocumentNonBlocking(userDocRef, updatedSettings, { merge: true });
    toast({
      title: 'Settings Saved',
      description: 'Your new settings have been saved successfully.',
    });
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>

        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Pill className="text-primary" />
                Medication Schedule
            </CardTitle>
            <CardDescription>
                Set the default times for your daily medication doses.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="morning-time">Morning Dose Time</Label>
                        <Input
                            id="morning-time"
                            type="time"
                            value={medication.morning.time}
                            onChange={e => setMedication(prev => ({...prev, morning: { time: e.target.value }}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="evening-time">Evening Dose Time</Label>
                        <Input
                            id="evening-time"
                            type="time"
                            value={medication.evening.time}
                            onChange={e => setMedication(prev => ({...prev, evening: { time: e.target.value }}))}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Syringe className="text-primary" />
                    Injection Schedule
                </CardTitle>
                <CardDescription>
                    Configure your injection start date and frequency. This will reset your injection history.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="injection-start-date">Start Date</Label>
                    <Input
                        id="injection-start-date"
                        type="date"
                        value={injection.startDate ? format(parseISO(injection.startDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => setInjection(prev => ({ ...prev, startDate: new Date(e.target.value).toISOString() }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="injection-frequency">Frequency</Label>
                    <Select
                        value={String(injection.frequency)}
                        onValueChange={(val) => setInjection(prev => ({...prev, frequency: Number(val)}))}
                    >
                        <SelectTrigger id="injection-frequency">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            {[7, 8, 9, 10, 11, 12, 13, 14].map(day => (
                            <SelectItem key={day} value={String(day)}>Every {day} days</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Dumbbell className="text-primary" />
                Weekly Workout Goals
            </CardTitle>
            <CardDescription>
                Set your weekly goals for treadmill and resistance training sessions.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="treadmill-goal">Treadmill Sessions / Week</Label>
                <Input
                    id="treadmill-goal"
                    type="number"
                    min="0"
                    value={workout.treadmill.goal}
                    onChange={e => setWorkout(prev => ({...prev, treadmill: { goal: parseInt(e.target.value, 10) || 0}}))}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="resistance-goal">Resistance Sessions / Week</Label>
                <Input
                    id="resistance-goal"
                    type="number"
                    min="0"
                    value={workout.resistance.goal}
                    onChange={e => setWorkout(prev => ({...prev, resistance: { goal: parseInt(e.target.value, 10) || 0}}))}
                />
                </div>
            </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button onClick={handleSaveChanges} size="lg">Save All Settings</Button>
        </div>
    </div>
  );
};

export default Settings;
