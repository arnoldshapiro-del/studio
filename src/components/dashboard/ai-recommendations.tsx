
"use client";

import { useState, useTransition } from 'react';
import type { WorkoutState } from '@/lib/types';
import { getRecommendationsAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { isThisWeek, parseISO } from 'date-fns';

interface AiRecommendationsProps {
  workoutData: WorkoutState;
}

const AiRecommendations = ({ workoutData }: AiRecommendationsProps) => {
  const [isPending, startTransition] = useTransition();
  const [recommendations, setRecommendations] = useState<{ recommendedSchedule: string; justification: string } | null>(null);
  const [preferences, setPreferences] = useState('I prefer to workout in the morning and like a mix of cardio and strength.');

  const handleGenerateRecommendations = () => {
    startTransition(async () => {
      const getSessionsThisWeek = (type: 'treadmill' | 'resistance') => {
        return workoutData.history.filter(h => h.type === type && isThisWeek(parseISO(h.date), { weekStartsOn: 1 })).length;
      }
      const treadmillSessionsThisWeek = getSessionsThisWeek('treadmill');
      const resistanceSessionsThisWeek = getSessionsThisWeek('resistance');

      const formattedData = {
        userRoutineData: `Treadmill: ${treadmillSessionsThisWeek}/${workoutData.treadmill.goal} sessions. Resistance: ${resistanceSessionsThisWeek}/${workoutData.resistance.goal} sessions.`,
        userPreferences: preferences,
      };
      const result = await getRecommendationsAction(formattedData);
      if (typeof result !== 'string') {
        setRecommendations(result);
      } else {
        setRecommendations({ recommendedSchedule: 'Error', justification: result });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Lightbulb className="text-primary" />
          Optimal Workout Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="preferences">Your Workout Preferences</Label>
          <Textarea 
            id="preferences"
            placeholder="e.g., I prefer morning workouts, I want to focus on cardio..."
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
        </div>
        
        {isPending && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        {recommendations && !isPending && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-semibold font-headline">Recommended Schedule</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recommendations.recommendedSchedule}</p>
            </div>
            <div>
              <h4 className="font-semibold font-headline">Justification</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recommendations.justification}</p>
            </div>
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleGenerateRecommendations}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : 'Get Recommendations'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AiRecommendations;
