
"use client";

import type { WaterState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GlassWater, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isToday, parseISO } from 'date-fns';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialWaterState } from '@/lib/data';
import { VoiceButton } from '@/components/ui/voice-button';
import { VoiceCommand } from '@/lib/voice-commands';
import { useToast } from '@/hooks/use-toast';

const WaterTracker = () => {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);
  
  const { data: waterData } = useDoc<{ water: WaterState }>(userDocRef);
  const water = waterData?.water || initialWaterState;
  
  const handleToggle = (period: 'morning' | 'afternoon' | 'evening') => {
    if(!userDocRef) return;

    const today = new Date().toISOString();
    const isTaken = water.history.some(h => h.period === period && isToday(parseISO(h.date)));

    let updatedHistory;
    if (isTaken) {
      updatedHistory = water.history.filter(h => !(h.period === period && isToday(parseISO(h.date))));
    } else {
      updatedHistory = [...water.history, { period, date: today }];
    }

    setDocumentNonBlocking(userDocRef, { water: { ...water, history: updatedHistory } }, { merge: true });
  };

  const waterOptions: { period: 'morning' | 'afternoon' | 'evening'; label: string }[] = [
    { period: 'morning', label: 'Morning' },
    { period: 'afternoon', label: 'Afternoon' },
    { period: 'evening', label: 'Evening' },
  ];
  
  const isTaken = (period: 'morning' | 'afternoon' | 'evening') => {
    return water.history.some(h => h.period === period && isToday(parseISO(h.date)));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <GlassWater className="text-primary" />
          Water Intake
        </CardTitle>
        <p className="text-sm text-muted-foreground">16 oz each</p>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        {waterOptions.map(({ period, label }) => (
          <Button
            key={period}
            variant={isTaken(period) ? 'default' : 'outline'}
            onClick={() => handleToggle(period)}
            className={cn(
              "flex-1 justify-start text-left h-16 flex-col items-start p-3 transition-all duration-300",
              isTaken(period) && "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
            aria-pressed={isTaken(period)}
          >
            <div className="flex items-center gap-2 w-full">
              <p className="font-semibold flex-1">{label}</p>
              {isTaken(period) && <CheckCircle2 className="w-5 h-5" />}
            </div>
            <p className="text-xs font-normal opacity-70">
              {isTaken(period) ? 'Completed!' : 'Mark as done'}
            </p>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default WaterTracker;
