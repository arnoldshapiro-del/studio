
"use client";

import { useState, useMemo } from 'react';
import type { InjectionState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Syringe, Settings, AlertTriangle, CalendarCheck2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInDays, isToday, parseISO, set } from 'date-fns';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialInjectionState } from '@/lib/data';

const InjectionTracker = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'));
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);
  
  const { data: injectionData } = useDoc<{ injection: InjectionState }>(userDocRef);
  const injection = injectionData?.injection || initialInjectionState;


  const { nextDueDate, status, daysDiff, isTakenToday } = useMemo(() => {
    if (!injection.startDate) {
        return { nextDueDate: new Date(), status: 'upcoming', daysDiff: 0, isTakenToday: false };
    }

    const lastInjectionDate = injection.history && injection.history.length > 0
      ? parseISO(injection.history[injection.history.length - 1].date)
      : parseISO(injection.startDate);

    const nextDate = addDays(lastInjectionDate, injection.frequency || 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diff = differenceInDays(nextDate, today);

    let currentStatus: 'due' | 'overdue' | 'upcoming' | 'complete' = 'upcoming';
    if (diff < 0) currentStatus = 'overdue';
    if (diff === 0) currentStatus = 'due';

    const takenToday = injection.history && injection.history.some(h => isToday(parseISO(h.date)));
    if (takenToday) currentStatus = 'complete';

    return { nextDueDate: nextDate, status: currentStatus, daysDiff: Math.abs(diff), isTakenToday: takenToday };
  }, [injection]);

  const handleLogInjection = () => {
    if (!userDocRef) return;
    const [hours, minutes] = logTime.split(':').map(Number);
    const logDate = set(new Date(), { hours, minutes });

    const updatedHistory = [...(injection.history || []), { id: crypto.randomUUID(), date: logDate.toISOString() }];
    setDocumentNonBlocking(userDocRef, { injection: { ...injection, history: updatedHistory } }, { merge: true });
    toast({ title: "Injection Logged!", description: `Logged at ${format(logDate, 'h:mm a')}. Great job staying on track.` });
  };
  
  const getStatusContent = () => {
    switch (status) {
      case 'overdue':
        return {
          icon: <AlertTriangle className="h-10 w-10 text-destructive" />,
          title: "Overdue",
          description: `Your injection is ${daysDiff} day${daysDiff > 1 ? 's' : ''} overdue.`,
        };
      case 'due':
        return {
          icon: <Syringe className="h-10 w-10 text-primary" />,
          title: "Due Today",
          description: `Time for your injection.`,
        };
      case 'upcoming':
        return {
          icon: <CalendarCheck2 className="h-10 w-10 text-muted-foreground" />,
          title: "Upcoming",
          description: `Next dose in ${daysDiff} day${daysDiff > 1 ? 's' : ''} on ${format(nextDueDate, 'MMM d')}.`,
        };
       case 'complete':
        return {
            icon: <CalendarCheck2 className="h-10 w-10 text-green-500" />,
            title: "Completed Today!",
            description: `Next dose on ${format(nextDueDate, 'MMM d')}.`,
        };
    }
  };

  const { icon, title, description } = getStatusContent();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Syringe className="text-primary" />
          Mounjaro Shot
        </CardTitle>
        <p className="text-sm text-muted-foreground">Every {injection.frequency || 7} days</p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        {icon}
        <p className="font-bold text-2xl mt-4 font-headline">{title}</p>
        <p className="text-muted-foreground mt-1">{description}</p>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        {!isTakenToday && (status === 'due' || status === 'overdue') && (
          <div className="flex items-center gap-2 w-full">
            <Label htmlFor="injection-time" className="sr-only">Injection Time</Label>
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Input
              id="injection-time"
              type="time"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="flex-1"
            />
          </div>
        )}
        <Button
          className="w-full"
          onClick={handleLogInjection}
          disabled={isTakenToday}
        >
          {isTakenToday ? 'Completed Today' : 'Log Injection'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InjectionTracker;
