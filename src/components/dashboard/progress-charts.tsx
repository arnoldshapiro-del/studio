
"use client";

import { useMemo } from 'react';
import type { AllData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { subDays, format, isAfter, parseISO } from 'date-fns';
import { Footprints, Droplet } from 'lucide-react';

interface ProgressChartsProps {
  allData: AllData;
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];

const ProgressCharts = ({ allData }: ProgressChartsProps) => {

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
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
    const data = { morning: 0, afternoon: 0, evening: 0 };
    allData.water.history.forEach(h => {
        if (isAfter(parseISO(h.date), subDays(new Date(), 30))) {
            data[h.period]++;
        }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [allData.water.history]);

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
            <ChartContainer config={{}} className="h-64">
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
    </div>
  );
};

export default ProgressCharts;
