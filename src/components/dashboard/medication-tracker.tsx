"use client";

import type { MedicationState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Pill, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MedicationTrackerProps {
  medication: MedicationState;
  setMedication: React.Dispatch<React.SetStateAction<MedicationState>>;
}

const MedicationTracker = ({ medication, setMedication }: MedicationTrackerProps) => {
  const handleToggle = (period: 'morning' | 'evening') => {
    setMedication(prev => ({
      ...prev,
      [period]: { ...prev[period], taken: !prev[period].taken },
    }));
  };

  const handleTimeChange = (period: 'morning' | 'evening', time: string) => {
    setMedication(prev => ({
      ...prev,
      [period]: { ...prev[period], time },
    }));
  };

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
            checked={medication.morning.taken}
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
            checked={medication.evening.taken}
            onCheckedChange={() => handleToggle('evening')}
            aria-label="Toggle evening medication"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicationTracker;
