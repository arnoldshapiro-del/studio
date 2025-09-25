
'use client';

import { useState, useMemo } from 'react';
import type { AllData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, parseISO, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';

interface HealthReportProps {
  allData: AllData;
}

const HealthReport = ({ allData }: HealthReportProps) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredData = useMemo(() => {
    if (!date?.from || !date?.to) return null;
    
    const interval = { start: date.from, end: date.to };

    const filterHistory = <T extends { date: string }>(history: T[] | undefined) => 
      (history || []).filter(entry => isWithinInterval(parseISO(entry.date), interval));
    
    return {
        medication: filterHistory(allData.medication.history),
        water: filterHistory(allData.water.history),
        workout: filterHistory(allData.workout.history),
        mood: filterHistory(allData.mood.history),
        stress: filterHistory(allData.stress.history),
    }
  }, [allData, date]);

  const reportSummary = useMemo(() => {
    if (!filteredData) return null;

    const medDosesTaken = filteredData.medication.length;
    
    const waterByPeriod = filteredData.water.reduce((acc, curr) => {
        acc[curr.period] = (acc[curr.period] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const workoutsByType = filteredData.workout.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const moodCounts = filteredData.mood.reduce((acc, curr) => {
        acc[curr.mood] = (acc[curr.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const averageStress = filteredData.stress.length > 0 
        ? filteredData.stress.reduce((sum, curr) => sum + curr.level, 0) / filteredData.stress.length
        : 0;

    return { medDosesTaken, waterByPeriod, workoutsByType, moodCounts, averageStress: averageStress.toFixed(1) };
  }, [filteredData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Generate Health Report</CardTitle>
        <CardDescription>Select a date range to generate a summary of your health data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                <Download className="mr-2 h-4 w-4" />
                Export as PDF (Coming Soon)
            </Button>
        </div>

        {reportSummary && (
            <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold font-headline">Report Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Medication</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>Total Doses Taken: <span className="font-bold">{reportSummary.medDosesTaken}</span></p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Water Intake</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>Morning: <span className="font-bold">{reportSummary.waterByPeriod.morning || 0}</span></p>
                           <p>Afternoon: <span className="font-bold">{reportSummary.waterByPeriod.afternoon || 0}</span></p>
                           <p>Evening: <span className="font-bold">{reportSummary.waterByPeriod.evening || 0}</span></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Workouts</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>Treadmill: <span className="font-bold">{reportSummary.workoutsByType.treadmill || 0}</span> sessions</p>
                           <p>Resistance: <span className="font-bold">{reportSummary.workoutsByType.resistance || 0}</span> sessions</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Stress & Mood</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Average Stress: <span className="font-bold">{reportSummary.averageStress}</span> / 10</p>
                            <div className="mt-2 text-sm">
                                {Object.entries(reportSummary.moodCounts).map(([mood, count]) => (
                                    <div key={mood} className="flex justify-between">
                                        <span className="capitalize">{mood}:</span>
                                        <span className="font-bold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthReport;
