"use client";

import type { WorkoutState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Footprints, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WorkoutTrackerProps {
  workout: WorkoutState;
  setWorkout: React.Dispatch<React.SetStateAction<WorkoutState>>;
}

const WorkoutTracker = ({ workout, setWorkout }: WorkoutTrackerProps) => {

  const handleLogWorkout = (type: 'treadmill' | 'resistance') => {
    setWorkout(prev => {
      const currentSessions = prev[type].sessionsThisWeek;
      const goal = prev[type].goal;
      return {
        ...prev,
        [type]: {
          ...prev[type],
          sessionsThisWeek: currentSessions < goal ? currentSessions + 1 : currentSessions,
        }
      };
    });
  };

  const treadmillProgress = (workout.treadmill.sessionsThisWeek / workout.treadmill.goal) * 100;
  const resistanceProgress = (workout.resistance.sessionsThisWeek / workout.resistance.goal) * 100;

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
              {workout.treadmill.sessionsThisWeek} / {workout.treadmill.goal} sessions
            </p>
          </div>
          <Progress value={treadmillProgress} className="h-2" />
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => handleLogWorkout('treadmill')}
            disabled={workout.treadmill.sessionsThisWeek >= workout.treadmill.goal}
          >
            Log 20min Treadmill Session
          </Button>
        </div>

        {/* Resistance Training Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-muted-foreground" />
              <p className="font-semibold">Resistance Training</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {workout.resistance.sessionsThisWeek} / {workout.resistance.goal} sessions
            </p>
          </div>
          <Progress value={resistanceProgress} className="h-2" />
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => handleLogWorkout('resistance')}
            disabled={workout.resistance.sessionsThisWeek >= workout.resistance.goal}
          >
            Log 30-60min Resistance Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutTracker;
