
"use client";

import { useMemo } from 'react';
import type { AllData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Line, ComposedChart } from 'recharts';
import { subDays, format, isAfter, parseISO } from 'date-fns';
import { Footprints, Droplet, Zap } from 'lucide-react';

interface ProgressChartsProps {
  allData: AllData;
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];
const MOOD_TO_VALUE: Record<string, number> = { 'awful': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'great': 5 };
const VALUE_TO_MOOD: Record<number, string> = { 1: 'Awful', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Great' };


const ProgressCharts = ({ allData }: ProgressChartsProps) => {

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
  }, []);
  
  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => subDays(new Date(), i)).reverse();
  }, []);

  const workoutChartData = useMemo(() => {
    return last7Days.map(day => {
      const treadmill = allData.workout.history.find(h => format(parseISO(h.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && h.type === 'treadmill');
      const resistance = allData.workout.history.find(h => format(parseISO(h.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && h.type === 'resistance');
      return {
        date: format(day, 'EEE'),
        treadmill: treadmill ? 1 : 0,
        resistance: resistance ? 1 : 0,
      };
    });
  }, [allData.workout.history, last7Days]);

  const waterChartData = useMemo(() => {
    const data: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0 };
    allData.water.history.forEach(h => {
        if (isAfter(parseISO(h.date), subDays(new Date(), 30))) {
            const period = h.period.charAt(0).toUpperCase() + h.period.slice(1);
            if (data[period] !== undefined) {
                data[period]++;
            }
        }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [allData.water.history]);
  
  const moodAndStressChartData = useMemo(() => {
    const entries = [...allData.mood.history, ...allData.stress.history]
      .filter(h => isAfter(parseISO(h.date), subDays(new Date(), 30)))
      .reduce((acc, h) => {
        const day = format(parseISO(h.date), 'yyyy-MM-dd');
        if (!acc[day]) {
          acc[day] = { mood: null, stress: null };
        }
        if ('mood' in h) {
            acc[day].mood = MOOD_TO_VALUE[h.mood];
        }
        if ('level' in h) {
            acc[day].stress = h.level;
        }
        return acc;
      }, {} as Record<string, { mood: number | null, stress: number | null }>);

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM d'),
        mood: entries[dayStr]?.mood || null,
        stress: entries[dayStr]?.stress || null,
      };
    });
  }, [allData.mood.history, allData.stress.history, last30Days]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Footprints className="text-primary" />
            Weekly Workout Consistency
          </CardTitle>
          <CardDescription>
            Your workout sessions over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-64">
            <BarChart data={workoutChartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="treadmill" fill="var(--color-chart-1)" radius={4} name="Treadmill" />
              <Bar dataKey="resistance" fill="var(--color-chart-2)" radius={4} name="Resistance" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Droplet className="text-primary" />
            Water Intake Distribution
          </CardTitle>
           <CardDescription>
            Distribution of your water intake over the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
            <ChartContainer config={{
                morning: { label: 'Morning' },
                afternoon: { label: 'Afternoon' },
                evening: { label: 'Evening' },
            }} className="h-64">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={waterChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                         {waterChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Zap className="text-primary" />
                30-Day Stress & Mood Correlation
            </CardTitle>
            <CardDescription>
                How your stress levels and mood have trended over the last 30 days.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-64">
                <ComposedChart data={moodAndStressChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={10} 
                        interval={3}
                    />
                    <YAxis yAxisId="stress" orientation="left" domain={[1, 10]} ticks={[1, 5, 10]} allowDecimals={false} label={{ value: 'Stress', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="mood" orientation="right" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(val) => VALUE_TO_MOOD[val]} allowDecimals={false} label={{ value: 'Mood', angle: 90, position: 'insideRight' }} />
                    <ChartTooltip
                         content={
                            <ChartTooltipContent
                                labelFormatter={(label) => `Data for ${label}`}
                                formatter={(value, name) => {
                                    if (name === 'mood' && typeof value === 'number') {
                                        return `${VALUE_TO_MOOD[value]} (${value})`;
                                    }
                                    return value;
                                }}
                            />
                        }
                    />
                    <Bar yAxisId="stress" dataKey="stress" fill="var(--color-chart-2)" radius={4} name="Stress Level" barSize={10} />
                    <Line yAxisId="mood" type="monotone" dataKey="mood" stroke="var(--color-chart-1)" strokeWidth={2} name="Mood Rating" dot={false} connectNulls />
                </ComposedChart>
            </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProgressCharts;
