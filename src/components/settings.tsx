
'use client';

import { useState } from 'react';
import type { AllData, WorkoutState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, Settings as SettingsIcon, FileText } from 'lucide-react';
import HealthReport from './health-report';

interface SettingsProps {
  workout: WorkoutState;
  setWorkout: React.Dispatch<React.SetStateAction<WorkoutState>>;
  allData: AllData;
}

const Settings = ({ workout, setWorkout, allData }: SettingsProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const handleGoalChange = (type: 'treadmill' | 'resistance', value: number) => {
    setWorkout(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        goal: value,
      },
    }));
  };

  const handleSaveChanges = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your workout goals have been updated.',
    });
  };

  return (
    <div>
        <div className="flex items-center gap-2 mb-8">
            <SettingsIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>

        <div className="flex border-b mb-6">
            <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('general')}
            >
                <Dumbbell className="inline-block mr-2 h-4 w-4" />
                Workout Goals
            </button>
            <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('reports')}
            >
                <FileText className="inline-block mr-2 h-4 w-4" />
                Health Reports
            </button>
        </div>
        
        {activeTab === 'general' && (
             <Card>
                <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Dumbbell className="text-primary" />
                    Weekly Workout Goals
                </CardTitle>
                <CardDescription>
                    Set your weekly goals for treadmill and resistance training sessions.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="treadmill-goal">Treadmill Sessions</Label>
                    <Input
                        id="treadmill-goal"
                        type="number"
                        min="0"
                        value={workout.treadmill.goal}
                        onChange={e => handleGoalChange('treadmill', parseInt(e.target.value, 10) || 0)}
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="resistance-goal">Resistance Training Sessions</Label>
                    <Input
                        id="resistance-goal"
                        type="number"
                        min="0"
                        value={workout.resistance.goal}
                        onChange={e => handleGoalChange('resistance', parseInt(e.target.value, 10) || 0)}
                    />
                    </div>
                </div>
                </CardContent>
                <CardFooter>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                </CardFooter>
            </Card>
        )}

        {activeTab === 'reports' && (
            <HealthReport allData={allData} />
        )}
    </div>
  );
};

export default Settings;
