
"use client";

import { useMemo } from 'react';
import type { AllData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Flame, Droplet, Pill } from 'lucide-react';
import { differenceInCalendarDays, parseISO, startOfDay, subDays, format } from 'date-fns';

interface StreaksTrackerProps {
  allData: AllData;
}

const calculateStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0;

  const sortedUniqueDays = [...new Set(dates.map(d => format(parseISO(d), 'yyyy-MM-dd')))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedUniqueDays.length === 0) return 0;

  let streak = 0;
  const today = startOfDay(new Date());
  const mostRecentDate = startOfDay(parseISO(sortedUniqueDays[0]));

  const diffFromToday = differenceInCalendarDays(today, mostRecentDate);

  if (diffFromToday > 1) {
    return 0; // Streak broken
  }

  if (diffFromToday <= 1) {
    streak = 1;
    for (let i = 1; i < sortedUniqueDays.length; i++) {
      const currentDate = startOfDay(parseISO(sortedUniqueDays[i - 1]));
      const previousDate = startOfDay(parseISO(sortedUniqueDays[i]));
      if (differenceInCalendarDays(currentDate, previousDate) === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
};

const StreakItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: number }) => (
  <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
    <Icon className="h-8 w-8 text-primary" />
    <div className="flex-grow">
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-muted-foreground">{value} day{value === 1 ? '' : 's'}</p>
    </div>
    <div className="text-2xl font-bold font-headline text-primary">{value}</div>
  </div>
);

const StreaksTracker = ({ allData }: StreaksTrackerProps) => {
  const medicationStreak = useMemo(() => {
    const morningDates = allData.medication.history.filter(h => h.period === 'morning').map(h => h.date);
    const eveningDates = allData.medication.history.filter(h => h.period === 'evening').map(h => h.date);
    // For medication, consider the day complete if both doses were taken
    const completeDays = morningDates.filter(md => eveningDates.some(ed => format(parseISO(md), 'yyyy-MM-dd') === format(parseISO(ed), 'yyyy-MM-dd')));
    return calculateStreak(completeDays);
  }, [allData.medication.history]);

  const waterStreak = useMemo(() => {
     // For water, consider the day complete if all 3 were taken
    const waterByDay = allData.water.history.reduce((acc, h) => {
        const day = format(parseISO(h.date), 'yyyy-MM-dd');
        if (!acc[day]) acc[day] = new Set();
        acc[day].add(h.period);
        return acc;
    }, {} as Record<string, Set<string>>);

    const completeDays = Object.entries(waterByDay)
        .filter(([, periods]) => periods.size === 3)
        .map(([day]) => day);

    return calculateStreak(completeDays);
  }, [allData.water.history]);
  
  const workoutStreak = useMemo(() => {
     const workoutDates = allData.workout.history.map(h => h.date);
     return calculateStreak(workoutDates);
  }, [allData.workout.history])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Flame className="text-primary" />
          Current Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StreakItem icon={Pill} label="Medication" value={medicationStreak} />
        <StreakItem icon={Droplet} label="Water Intake" value={waterStreak} />
        <StreakItem icon={Flame} label="Workouts" value={workoutStreak} />
      </CardContent>
    </Card>
  );
};

export default StreaksTracker;
