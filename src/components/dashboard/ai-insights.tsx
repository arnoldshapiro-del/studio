
"use client";

import { useState, useTransition } from 'react';
import type { AllData } from '@/lib/types';
import { getInsightsAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { isThisWeek, parseISO } from 'date-fns';

interface AiInsightsProps {
  allData: AllData;
}

const AiInsights = ({ allData }: AiInsightsProps) => {
  const [isPending, startTransition] = useTransition();
  const [insights, setInsights] = useState<string>('');

  const handleGenerateInsights = () => {
    startTransition(async () => {
      const getSessionsThisWeek = (type: 'treadmill' | 'resistance') => {
        return allData.workout.history.filter(h => h.type === type && isThisWeek(parseISO(h.date), { weekStartsOn: 1 })).length;
      }
      const treadmillSessionsThisWeek = getSessionsThisWeek('treadmill');
      const resistanceSessionsThisWeek = getSessionsThisWeek('resistance');

      const formattedData = {
        medicationData: `Morning taken: ${allData.medication.history.some(h => h.period === 'morning')} at ${allData.medication.morning.time}. Evening taken: ${allData.medication.history.some(h => h.period === 'evening')} at ${allData.medication.evening.time}.`,
        waterIntakeData: `Morning: ${allData.water.history.some(h => h.period === 'morning') ? 'Yes' : 'No'}. Afternoon: ${allData.water.history.some(h => h.period === 'afternoon') ? 'Yes' : 'No'}. Evening: ${allData.water.history.some(h => h.period === 'evening') ? 'Yes' : 'No'}.`,
        workoutData: `Treadmill: ${treadmillSessionsThisWeek}/${allData.workout.treadmill.goal} sessions. Resistance: ${resistanceSessionsThisWeek}/${allData.workout.resistance.goal} sessions.`,
        moodData: `Recent moods: ${allData.mood.history.slice(-5).map(h => h.mood).join(', ')}`
      };
      const result = await getInsightsAction(formattedData);
      setInsights(result);
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Sparkles className="text-primary" />
          Personalized Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {isPending ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : insights ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click the button below to generate AI-powered insights based on your tracked activities.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleGenerateInsights}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : 'Generate Insights'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AiInsights;
