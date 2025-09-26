
"use client";

import { useState, useMemo } from 'react';
import type { InjectionState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Syringe, Settings, AlertTriangle, CalendarCheck2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInDays, isToday, parse, parseISO, set } from 'date-fns';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialInjectionState } from '@/lib/data';

const injectionSites = [
    'Abdomen Left',
    'Abdomen Right',
    'Thigh Left',
    'Thigh Right',
    'Arm Left',
    'Arm Right',
];

const LogInjectionDialog = ({ onLog, disabled }: { onLog: (site: string, time: string) => void, disabled: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'));
    const [site, setSite] = useState(injectionSites[0]);

    const handleLog = () => {
        onLog(site, logTime);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" disabled={disabled}>
                    {disabled ? 'Completed Today' : 'Log Injection'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Mounjaro Injection</DialogTitle>
                    <DialogDescription>Select the time and injection site for today's dose.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="injection-time" className="text-right">Time</Label>
                        <Input
                            id="injection-time"
                            type="time"
                            value={logTime}
                            onChange={(e) => setLogTime(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="injection-site" className="text-right">Site</Label>
                         <Select value={site} onValueChange={setSite}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a site" />
                            </SelectTrigger>
                            <SelectContent>
                                {injectionSites.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleLog}>Log Injection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const InjectionTracker = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);
  
  const { data: injectionData } = useDoc<{ injection: InjectionState }>(userDocRef);
  const injection = injectionData?.injection || initialInjectionState;

  const { nextDueDate, status, daysDiff, isTakenToday } = useMemo(() => {
    if (!injection.history) {
      const nextDate = addDays(parseISO(injection.startDate), injection.frequency);
      const diff = differenceInDays(nextDate, new Date());
      let currentStatus: 'due' | 'overdue' | 'upcoming' | 'complete' = 'upcoming';
       if (diff < 0) currentStatus = 'overdue';
       if (diff === 0) currentStatus = 'due';
      return { nextDueDate: nextDate, status: currentStatus, daysDiff: Math.abs(diff), isTakenToday: false };
    }
    const lastInjectionDate = injection.history.length > 0
      ? parseISO(injection.history[injection.history.length - 1].date)
      : parseISO(injection.startDate);

    const nextDate = addDays(lastInjectionDate, injection.frequency);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diff = differenceInDays(nextDate, today);

    let currentStatus: 'due' | 'overdue' | 'upcoming' | 'complete' = 'upcoming';
    if (diff < 0) currentStatus = 'overdue';
    if (diff === 0) currentStatus = 'due';

    const takenToday = injection.history.some(h => isToday(parseISO(h.date)));
    if (takenToday) currentStatus = 'complete';

    return { nextDueDate: nextDate, status: currentStatus, daysDiff: Math.abs(diff), isTakenToday: takenToday };
  }, [injection]);

  const handleLogInjection = (site: string, time: string) => {
    if (!userDocRef) return;
    const [hours, minutes] = time.split(':').map(Number);
    const logDate = set(new Date(), { hours, minutes });

    const updatedHistory = [...(injection.history || []), { id: crypto.randomUUID(), date: logDate.toISOString(), site }];
    setDocumentNonBlocking(userDocRef, { injection: { ...injection, history: updatedHistory } }, { merge: true });
    toast({ title: "Injection Logged!", description: `Logged at ${site} at ${format(logDate, 'h:mm a')}.` });
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
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        {icon}
        <p className="font-bold text-2xl mt-4 font-headline">{title}</p>
        <p className="text-muted-foreground mt-1">{description}</p>
      </CardContent>
      <CardFooter className="flex-col gap-3">
         <LogInjectionDialog onLog={handleLogInjection} disabled={isTakenToday} />
      </CardFooter>
    </Card>
  );
};

export default InjectionTracker;
