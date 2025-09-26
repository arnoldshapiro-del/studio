
"use client";

import type { WorkoutState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Footprints, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { isThisWeek, parseISO } from 'date-fns';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useState } from 'react';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialWorkoutState } from '@/lib/data';

const LogWorkoutDialog = ({ type, onLog, goal, sessionsThisWeek }: { type: 'treadmill' | 'resistance', onLog: (startTime: string, endTime: string) => void, goal: number, sessionsThisWeek: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:20');

  const handleLog = () => {
    onLog(startTime, endTime);
    setIsOpen(false);
  };

  const defaultDurationText = type === 'treadmill' ? '20min' : '30-60min';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          disabled={sessionsThisWeek >= goal}
        >
          Log {defaultDurationText} {type === 'treadmill' ? 'Treadmill' : 'Resistance'} Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log {type === 'treadmill' ? 'Treadmill' : 'Resistance'} Workout</DialogTitle>
          <DialogDescription>
            Specify the start and end time for your workout session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              Start Time
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">
              End Time
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleLog}>Log Workout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const WorkoutTracker = () => {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);
  
  const { data: workoutData } = useDoc<{ workout: WorkoutState }>(userDocRef);
  const workout = workoutData?.workout || initialWorkoutState;

  const handleLogWorkout = (type: 'treadmill' | 'resistance', startTime: string, endTime: string) => {
    if (!userDocRef) return;
    
    const today = new Date().toISOString();
    const newHistory = [...workout.history, { 
      id: crypto.randomUUID(), 
      type, 
      date: today,
      startTime,
      endTime,
    }];

    setDocumentNonBlocking(userDocRef, { workout: { ...workout, history: newHistory } }, { merge: true });
  };
  
  const getSessionsThisWeek = (type: 'treadmill' | 'resistance') => {
    return workout.history.filter(h => h.type === type && isThisWeek(parseISO(h.date), { weekStartsOn: 1 })).length;
  }

  const treadmillSessionsThisWeek = getSessionsThisWeek('treadmill');
  const resistanceSessionsThisWeek = getSessionsThisWeek('resistance');

  const treadmillProgress = (treadmillSessionsThisWeek / workout.treadmill.goal) * 100;
  const resistanceProgress = (resistanceSessionsThisWeek / workout.resistance.goal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Footprints className="text-primary" />
          Weekly Workouts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Treadmill Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Treadmill</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {treadmillSessionsThisWeek} / {workout.treadmill.goal} sessions
            </p>
          </div>
          <Progress value={treadmillProgress} className="h-2" />
          <LogWorkoutDialog
            type="treadmill"
            onLog={(start, end) => handleLogWorkout('treadmill', start, end)}
            goal={workout.treadmill.goal}
            sessionsThisWeek={treadmillSessionsThisWeek}
          />
        </div>

        {/* Resistance Training Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Resistance Training</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {resistanceSessionsThisWeek} / {workout.resistance.goal} sessions
            </p>
          </div>
          <Progress value={resistanceProgress} className="h-2" />
           <LogWorkoutDialog
            type="resistance"
            onLog={(start, end) => handleLogWorkout('resistance', start, end)}
            goal={workout.resistance.goal}
            sessionsThisWeek={resistanceSessionsThisWeek}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutTracker;
