
"use client";

import type { MedicationState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Pill, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { isToday, parseISO } from 'date-fns';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { initialMedicationState } from '@/lib/data';

const MedicationTracker = () => {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'data', 'latest');
  }, [user, firestore]);

  const { data: medicationData } = useDoc<{ medication: MedicationState }>(userDocRef);
  const medication = medicationData?.medication || initialMedicationState;

  const handleToggle = (period: 'morning' | 'evening') => {
    if (!userDocRef) return;

    const today = new Date().toISOString();
    const time = medication[period].time;
    const isTaken = medication.history.some(h => h.period === period && isToday(parseISO(h.date)));
    
    let updatedHistory;
    if (isTaken) {
      updatedHistory = medication.history.filter(h => !(h.period === period && isToday(parseISO(h.date))));
    } else {
      updatedHistory = [...medication.history, { period, date: today, time }];
    }
    
    setDocumentNonBlocking(userDocRef, { medication: { ...medication, history: updatedHistory } }, { merge: true });
  };

  const handleTimeChange = (period: 'morning' | 'evening', time: string) => {
    if (!userDocRef) return;
    const updatedMedication = {
      ...medication,
      [period]: { ...medication[period], time },
    };
    setDocumentNonBlocking(userDocRef, { medication: updatedMedication }, { merge: true });
  };

  const isMorningTaken = medication.history.some(h => h.period === 'morning' && isToday(parseISO(h.date)));
  const isEveningTaken = medication.history.some(h => h.period === 'evening' && isToday(parseISO(h.date)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Pill className="text-primary" />
          Medication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
          <div>
            <p className="font-semibold">Morning Dose</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={medication.morning.time}
                onChange={(e) => handleTimeChange('morning', e.target.value)}
                className="w-32 h-8"
                aria-label="Morning medication time"
              />
            </div>
          </div>
          <Switch
            checked={isMorningTaken}
            onCheckedChange={() => handleToggle('morning')}
            aria-label="Toggle morning medication"
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
          <div>
            <p className="font-semibold">Evening Dose</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={medication.evening.time}
                onChange={(e) => handleTimeChange('evening', e.target.value)}
                className="w-32 h-8"
                aria-label="Evening medication time"
              />
            </div>
          </div>
          <Switch
            checked={isEveningTaken}
            onCheckedChange={() => handleToggle('evening')}
            aria-label="Toggle evening medication"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicationTracker;
