"use client";

import { useState, useMemo } from 'react';
import type { InjectionState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Syringe, Settings, AlertTriangle, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, differenceInDays, isToday, isPast, parseISO } from 'date-fns';

interface InjectionTrackerProps {
  injection: InjectionState;
  setInjection: React.Dispatch<React.SetStateAction<InjectionState>>;
}

const InjectionTracker = ({ injection, setInjection }: InjectionTrackerProps) => {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    startDate: format(parseISO(injection.startDate), 'yyyy-MM-dd'),
    frequency: injection.frequency,
  });

  const { nextDueDate, status, daysDiff, isTakenToday } = useMemo(() => {
    const lastInjectionDate = injection.history.length > 0
      ? parseISO(injection.history[injection.history.length - 1])
      : parseISO(injection.startDate);

    const nextDate = addDays(lastInjectionDate, injection.frequency);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diff = differenceInDays(nextDate, today);

    let currentStatus: 'due' | 'overdue' | 'upcoming' | 'complete' = 'upcoming';
    if (diff < 0) currentStatus = 'overdue';
    if (diff === 0) currentStatus = 'due';

    const takenToday = injection.history.some(h => isToday(parseISO(h)));
    if (takenToday) currentStatus = 'complete';

    return { nextDueDate: nextDate, status: currentStatus, daysDiff: Math.abs(diff), isTakenToday: takenToday };
  }, [injection]);

  const handleLogInjection = () => {
    setInjection(prev => ({
      ...prev,
      history: [...prev.history, new Date().toISOString()],
    }));
    toast({ title: "Injection Logged!", description: "Great job staying on track." });
  };
  
  const handleSaveSettings = () => {
    const newStartDate = new Date(tempSettings.startDate);
    setInjection(prev => ({
      ...prev,
      startDate: newStartDate.toISOString(),
      frequency: tempSettings.frequency,
      history: [], // Reset history when settings change
    }));
    setIsSettingsOpen(false);
    toast({ title: "Settings Saved", description: "Your injection schedule has been updated." });
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
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Injection Settings</DialogTitle>
              <DialogDescription>Adjust your weekly injection schedule.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start-date" className="text-right">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={tempSettings.startDate}
                  onChange={(e) => setTempSettings({ ...tempSettings, startDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">Frequency</Label>
                <Select
                  value={String(tempSettings.frequency)}
                  onValueChange={(val) => setTempSettings({ ...tempSettings, frequency: Number(val) })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 8, 9, 10, 11, 12, 13, 14].map(day => (
                      <SelectItem key={day} value={String(day)}>Every {day} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        {icon}
        <p className="font-bold text-2xl mt-4 font-headline">{title}</p>
        <p className="text-muted-foreground mt-1">{description}</p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleLogInjection}
          disabled={isTakenToday}
        >
          {isTakenToday ? 'Completed' : 'Log Injection'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InjectionTracker;
