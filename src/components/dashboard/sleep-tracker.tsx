'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Moon, 
  Sun, 
  Clock, 
  Star, 
  TrendingUp, 
  AlertCircle,
  Thermometer,
  Volume2,
  Smartphone
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import type { SleepState, SleepEntry, SleepEnvironment } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VoiceButton } from '@/components/ui/voice-button';
import { VoiceCommand } from '@/lib/voice-commands';
import { format, isToday, parseISO, differenceInMinutes, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface SleepTrackerProps {
  sleepData: SleepState;
  userDocRef: DocumentReference | null;
}

const SleepTracker = ({ sleepData, userDocRef }: SleepTrackerProps) => {
  const { toast } = useToast();
  
  // Today's sleep entry
  const todaySleep = sleepData.history.find(entry => 
    isToday(new Date(entry.date))
  );

  // Form states
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [quality, setQuality] = useState<number>(3);
  const [environment, setEnvironment] = useState<SleepEnvironment>({});
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('log');

  // Calculate sleep debt and statistics
  const recentEntries = sleepData.history
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = subDays(new Date(), 7);
      return entryDate >= weekAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const averageSleep = recentEntries.length > 0 
    ? recentEntries.reduce((sum, entry) => sum + entry.duration, 0) / recentEntries.length / 60
    : sleepData.targetHours;

  const sleepDebt = recentEntries.reduce((debt, entry) => {
    const targetMinutes = sleepData.targetHours * 60;
    const shortfall = Math.max(0, targetMinutes - entry.duration);
    return debt + shortfall;
  }, 0) / 60; // Convert to hours

  // Load today's entry if exists
  useEffect(() => {
    if (todaySleep) {
      setBedtime(todaySleep.bedtime.slice(0, 5));
      setWakeTime(todaySleep.wakeTime.slice(0, 5));
      setQuality(todaySleep.quality);
      setEnvironment(todaySleep.environment || {});
      setNotes(todaySleep.notes || '');
    }
  }, [todaySleep]);

  const calculateDuration = (bedtimeStr: string, wakeTimeStr: string): number => {
    const today = new Date();
    const bedtimeDate = new Date(today);
    const wakeTimeDate = new Date(today);

    const [bedHour, bedMin] = bedtimeStr.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTimeStr.split(':').map(Number);

    bedtimeDate.setHours(bedHour, bedMin, 0, 0);
    wakeTimeDate.setHours(wakeHour, wakeMin, 0, 0);

    // If wake time is earlier than bedtime, assume it's the next day
    if (wakeTimeDate <= bedtimeDate) {
      wakeTimeDate.setDate(wakeTimeDate.getDate() + 1);
    }

    return differenceInMinutes(wakeTimeDate, bedtimeDate);
  };

  const handleSaveSleep = async () => {
    if (!userDocRef) return;

    const duration = calculateDuration(bedtime, wakeTime);
    
    const newEntry: SleepEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      bedtime: `${bedtime}:00`,
      wakeTime: `${wakeTime}:00`,
      duration,
      quality: quality as 1 | 2 | 3 | 4 | 5,
      environment,
      notes: notes.trim() || undefined,
      sleepDebt: sleepDebt + Math.max(0, (sleepData.targetHours * 60 - duration) / 60),
    };

    try {
      const updatedHistory = todaySleep 
        ? sleepData.history.map(entry => 
            isToday(new Date(entry.date)) ? newEntry : entry
          )
        : [...sleepData.history, newEntry];

      await setDocumentNonBlocking(userDocRef, { 
        sleep: { ...sleepData, history: updatedHistory } 
      }, { merge: true });

      toast({
        title: 'Sleep Logged Successfully!',
        description: `${Math.round(duration / 60 * 10) / 10} hours with quality rating ${quality}/5`,
      });

      setActiveTab('stats');
    } catch (error) {
      console.error('Error logging sleep:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Log Sleep',
        description: 'Please try again.',
      });
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    if (command.action === 'log_sleep') {
      const sleepHours = command.data?.hours || 8;
      const sleepQuality = command.data?.quality || 3;
      
      // Calculate bedtime based on current time and sleep duration
      const now = new Date();
      const bedtimeCalc = new Date(now.getTime() - (sleepHours * 60 * 60 * 1000));
      
      setBedtime(format(bedtimeCalc, 'HH:mm'));
      setWakeTime(format(now, 'HH:mm'));
      setQuality(sleepQuality);
      
      toast({
        title: 'Sleep Data Updated',
        description: `Set ${sleepHours} hours of sleep with quality ${sleepQuality}/5`,
      });
    }
  };

  const getQualityColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-green-500';
      case 5: return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Not Rated';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sleep Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Moon className="text-primary" />
            Sleep Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {todaySleep ? `${Math.round(todaySleep.duration / 60 * 10) / 10}h` : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Last Night</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(averageSleep * 10) / 10}h</div>
              <div className="text-sm text-muted-foreground">7-Day Average</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold", sleepDebt > 2 ? "text-red-500" : sleepDebt > 0 ? "text-orange-500" : "text-green-500")}>
                {sleepDebt > 0 ? `+${Math.round(sleepDebt * 10) / 10}h` : '0h'}
              </div>
              <div className="text-sm text-muted-foreground">Sleep Debt</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold", todaySleep ? getQualityColor(todaySleep.quality) : "text-gray-500")}>
                {todaySleep ? `${todaySleep.quality}/5` : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Quality</div>
            </div>
          </div>

          {/* Sleep Goal Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Daily Goal: {sleepData.targetHours}h</span>
              <span>{todaySleep ? Math.round(todaySleep.duration / 60 * 10) / 10 : 0}h / {sleepData.targetHours}h</span>
            </div>
            <Progress 
              value={todaySleep ? (todaySleep.duration / 60 / sleepData.targetHours) * 100 : 0} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sleep Tracker */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="log" className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Log Sleep
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="environment" className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Environment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Clock className="text-primary" />
                Sleep Log
              </CardTitle>
              <VoiceButton 
                onCommand={handleVoiceCommand}
                activityType="sleep"
                size="sm"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedtime">Bedtime</Label>
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="bedtime"
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waketime">Wake Time</Label>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="waketime"
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Duration display */}
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.round(calculateDuration(bedtime, wakeTime) / 60 * 10) / 10}h
                </div>
                <div className="text-sm text-muted-foreground">Sleep Duration</div>
              </div>

              {/* Quality rating */}
              <div className="space-y-3">
                <Label>Sleep Quality</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[quality]}
                    onValueChange={([value]) => setQuality(value)}
                    max={5}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Star className={cn("w-4 h-4", getQualityColor(quality))} fill="currentColor" />
                    <span className={cn("font-medium", getQualityColor(quality))}>
                      {quality}/5 {getQualityLabel(quality)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="sleep-notes">Notes (Optional)</Label>
                <Textarea
                  id="sleep-notes"
                  placeholder="How did you sleep? Any factors that affected your rest?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSleep} className="w-full">
                {todaySleep ? 'Update Sleep Log' : 'Save Sleep Log'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Moon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sleep data available.</p>
                  <p className="text-sm">Start logging your sleep to see patterns!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEntries.slice(0, 7).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {format(new Date(entry.date), 'EEEE, MMM d')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.bedtime.slice(0, 5)} → {entry.wakeTime.slice(0, 5)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {Math.round(entry.duration / 60 * 10) / 10}h
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className={cn("w-3 h-3", getQualityColor(entry.quality))} fill="currentColor" />
                          <span className="text-xs">{entry.quality}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature */}
                <div className="space-y-2">
                  <Label>Room Temperature (°C)</Label>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="20"
                      value={environment.temperature || ''}
                      onChange={(e) => setEnvironment(prev => ({
                        ...prev,
                        temperature: e.target.value ? Number(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>

                {/* Noise Level */}
                <div className="space-y-2">
                  <Label>Noise Level</Label>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <Select 
                      value={environment.noise || ''} 
                      onValueChange={(value) => setEnvironment(prev => ({
                        ...prev,
                        noise: value as 'quiet' | 'moderate' | 'noisy' | undefined
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select noise level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiet">Quiet</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="noisy">Noisy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Screen Time */}
                <div className="space-y-2">
                  <Label>Screen Time Before Bed (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="30"
                      value={environment.screenTime || ''}
                      onChange={(e) => setEnvironment(prev => ({
                        ...prev,
                        screenTime: e.target.value ? Number(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>

                {/* Lighting */}
                <div className="space-y-2">
                  <Label>Lighting</Label>
                  <Select 
                    value={environment.lighting || ''} 
                    onValueChange={(value) => setEnvironment(prev => ({
                      ...prev,
                      lighting: value as 'dark' | 'dim' | 'bright' | undefined
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lighting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="dim">Dim</SelectItem>
                      <SelectItem value="bright">Bright</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sleep Debt Alert */}
              {sleepDebt > 1 && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800">Sleep Debt Detected</div>
                    <div className="text-sm text-orange-700">
                      You have {Math.round(sleepDebt * 10) / 10} hours of sleep debt. Consider going to bed earlier tonight.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SleepTracker;