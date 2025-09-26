
'use client';

import { useState, useMemo } from 'react';
import type { AllData } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { addDays, format, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, FileDown, Activity, Droplet, Pill, Dumbbell, Smile, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import ProgressCharts from './dashboard/progress-charts';

interface HealthReportProps {
  allData: AllData;
}

const HealthReport = ({ allData }: HealthReportProps) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    if (!date?.from || !date?.to) return allData;

    const interval = { start: date.from, end: date.to };
    const filterHistory = <T extends { date: string }>(history: T[]) =>
      history.filter(entry => isWithinInterval(parseISO(entry.date), interval));

    return {
      medication: { ...allData.medication, history: filterHistory(allData.medication.history) },
      water: { ...allData.water, history: filterHistory(allData.water.history) },
      injection: { ...allData.injection, history: filterHistory(allData.injection.history) },
      workout: { ...allData.workout, history: filterHistory(allData.workout.history) },
      mood: { ...allData.mood, history: filterHistory(allData.mood.history) },
      stress: { ...allData.stress, history: filterHistory(allData.stress.history) },
      meditation: { ...allData.meditation, history: filterHistory(allData.meditation.history) },
    };
  }, [allData, date]);
  
  const reportDurationDays = useMemo(() => {
      if(!date?.from || !date?.to) return 0;
      return differenceInDays(date.to, date.from) + 1;
  }, [date]);

  const medicationAdherence = useMemo(() => {
      const { history } = filteredData.medication;
      const expectedDoses = reportDurationDays * 2;
      if (expectedDoses === 0) return { morning: 0, evening: 0, overall: 0 };
      
      const morningTaken = history.filter(h => h.period === 'morning').length;
      const eveningTaken = history.filter(h => h.period === 'evening').length;
      
      const morningAdherence = reportDurationDays > 0 ? (morningTaken / reportDurationDays) * 100 : 0;
      const eveningAdherence = reportDurationDays > 0 ? (eveningTaken / reportDurationDays) * 100 : 0;
      const overallAdherence = expectedDoses > 0 ? ((morningTaken + eveningTaken) / expectedDoses) * 100 : 0;

      return {
          morning: Math.round(morningAdherence),
          evening: Math.round(eveningAdherence),
          overall: Math.round(overallAdherence),
      }
  }, [filteredData.medication, reportDurationDays]);


  const workoutSummary = useMemo(() => {
      const total = filteredData.workout.history.length;
      const treadmill = filteredData.workout.history.filter(h => h.type === 'treadmill').length;
      const resistance = filteredData.workout.history.filter(h => h.type === 'resistance').length;
      return { total, treadmill, resistance };
  }, [filteredData.workout]);

  const waterSummary = useMemo(() => {
      const total = filteredData.water.history.length;
      const avg = reportDurationDays > 0 ? (total / reportDurationDays).toFixed(1) : 0;
      return { total, avg };
  }, [filteredData.water, reportDurationDays]);

  const moodSummary = useMemo(() => {
      const moodCounts = filteredData.mood.history.reduce((acc, curr) => {
          acc[curr.mood] = (acc[curr.mood] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      const mostFrequent = Object.keys(moodCounts).length > 0 ? Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0][0] : 'N/A';
      return { mostFrequent };
  }, [filteredData.mood]);

  const stressSummary = useMemo(() => {
      const levels = filteredData.stress.history.map(h => h.level);
      if (levels.length === 0) return { avg: 0 };
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
      return { avg: avg.toFixed(1) };
  }, [filteredData.stress]);

  return (
    <div>
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
                <Activity className="h-8 w-8" />
                <h1 className="text-3xl font-bold font-headline">Health Reports</h1>
            </div>
            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                 <Button disabled>
                    <FileDown className="mr-2" />
                    Export as PDF
                </Button>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Pill /> Medication Adherence</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold font-headline text-primary">{medicationAdherence.morning}%</p>
                        <p className="text-sm text-muted-foreground">Morning</p>
                    </div>
                     <div>
                        <p className="text-3xl font-bold font-headline text-primary">{medicationAdherence.evening}%</p>
                        <p className="text-sm text-muted-foreground">Evening</p>
                    </div>
                     <div>
                        <p className="text-3xl font-bold font-headline">{medicationAdherence.overall}%</p>
                        <p className="text-sm text-muted-foreground">Overall</p>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Dumbbell /> Workouts</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-3xl font-bold font-headline">{workoutSummary.total}</p>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Droplet /> Water Intake</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-3xl font-bold font-headline">{waterSummary.avg}</p>
                    <p className="text-sm text-muted-foreground">Avg. Glasses / Day</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Smile /> Mood</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-3xl font-bold font-headline capitalize">{moodSummary.mostFrequent}</p>
                    <p className="text-sm text-muted-foreground">Most Frequent</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Zap /> Stress</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                     <p className="text-3xl font-bold font-headline">{stressSummary.avg}</p>
                    <p className="text-sm text-muted-foreground">Avg. Level / Day</p>
                </CardContent>
            </Card>
       </div>
       
       <ProgressCharts allData={filteredData} />

        <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>**Disclaimer:** This report is generated based on self-reported data. It is intended for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        </div>
    </div>
  );
};

export default HealthReport;
