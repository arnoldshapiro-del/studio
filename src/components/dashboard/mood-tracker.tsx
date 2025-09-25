
"use client";

import { useState, useEffect } from 'react';
import type { MoodState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Smile, Frown, Meh, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, parseISO } from 'date-fns';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

interface MoodTrackerProps {
  mood: MoodState;
}

type MoodOption = 'great' | 'good' | 'neutral' | 'bad' | 'awful';

const moodOptions: { value: MoodOption; label: string; icon: React.ElementType }[] = [
  { value: 'great', label: 'Great', icon: Smile },
  { value: 'good', label: 'Good', icon: Smile },
  { value: 'neutral', label: 'Neutral', icon: Meh },
  { value: 'bad', label: 'Bad', icon: Frown },
  { value: 'awful', label: 'Awful', icon: Frown },
];

const MoodTracker = ({ mood }: MoodTrackerProps) => {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);

  const todayMoodEntry = mood.history.find(entry => isToday(parseISO(entry.date)));

  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (todayMoodEntry) {
      setSelectedMood(todayMoodEntry.mood);
      setNotes(todayMoodEntry.notes || '');
    } else {
      setSelectedMood(null);
      setNotes('');
    }
  }, [todayMoodEntry]);


  const updateMoodInFirestore = (moodValue: MoodOption, moodNotes: string) => {
    if (!userDocRef) return;
    const today = new Date().toISOString();
    const history = mood.history.filter(entry => !isToday(parseISO(entry.date)));
    const newHistory = [...history, { date: today, mood: moodValue, notes: moodNotes }];
    setDocumentNonBlocking(userDocRef, { mood: { history: newHistory } }, { merge: true });
  };

  const handleMoodSelect = (moodValue: MoodOption) => {
    setSelectedMood(moodValue);
    updateMoodInFirestore(moodValue, notes);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (selectedMood) {
      updateMoodInFirestore(selectedMood, newNotes);
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
