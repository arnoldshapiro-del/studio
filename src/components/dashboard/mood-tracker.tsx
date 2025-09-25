
"use client";

import { useState } from 'react';
import type { MoodState, MoodEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Smile, Frown, Meh, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, parseISO } from 'date-fns';

interface MoodTrackerProps {
  mood: MoodState;
  setMood: React.Dispatch<React.SetStateAction<MoodState>>;
}

type MoodOption = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

const moodOptions: { value: MoodOption; label: string; icon: React.ElementType }[] = [
  { value: 'great', label: 'Great', icon: Smile },
  { value: 'good', label: 'Good', icon: Smile },
  { value: 'neutral', label: 'Neutral', icon: Meh },
  { value: 'bad', label: 'Bad', icon: Frown },
  { value: 'awful', label: 'Awful', icon: Frown },
];

const MoodTracker = ({ mood, setMood }: MoodTrackerProps) => {
  const todayMoodEntry = mood.history.find(entry => isToday(parseISO(entry.date)));

  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(todayMoodEntry?.mood || null);
  const [notes, setNotes] = useState(todayMoodEntry?.notes || '');

  const handleMoodSelect = (moodValue: MoodOption) => {
    setSelectedMood(moodValue);
    const today = new Date().toISOString();
    setMood(prev => {
      const history = prev.history.filter(entry => !isToday(parseISO(entry.date)));
      return {
        ...prev,
        history: [...history, { date: today, mood: moodValue, notes }],
      };
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (selectedMood) {
      const today = new Date().toISOString();
      setMood(prev => {
        const history = prev.history.filter(entry => !isToday(parseISO(entry.date)));
        return {
          ...prev,
          history: [...history, { date: today, mood: selectedMood, notes: newNotes }],
        };
      });
    }
  };

  const getMoodColor = (moodValue: MoodOption) => {
    switch (moodValue) {
      case 'great': return 'bg-green-500 hover:bg-green-600';
      case 'good': return 'bg-lime-500 hover:bg-lime-600';
      case 'neutral': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'bad': return 'bg-orange-500 hover:bg-orange-600';
      case 'awful': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-secondary';
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <HeartPulse className="text-primary" />
          How are you feeling?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-around">
          {moodOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full flex flex-col items-center gap-1",
                selectedMood === value && `${getMoodColor(value)} text-white`
              )}
              onClick={() => handleMoodSelect(value)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
        <div>
          <Label htmlFor="mood-notes">Notes (optional)</Label>
          <Textarea
            id="mood-notes"
            placeholder="Any thoughts on why you feel this way?"
            value={notes}
            onChange={handleNotesChange}
            disabled={!selectedMood}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodTracker;
