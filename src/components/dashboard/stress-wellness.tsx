
'use client';

import { useState, useEffect } from 'react';
import type { StressState } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BrainCircuit, Zap, Wind } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StressWellnessProps {
  stress: StressState;
  setStress: React.Dispatch<React.SetStateAction<StressState>>;
}

const BoxBreathingAnimation = () => {
  const [instruction, setInstruction] = useState('Get Ready...');

  useEffect(() => {
    const sequence = [
      { text: 'Breathe In', duration: 4000 },
      { text: 'Hold', duration: 4000 },
      { text: 'Breathe Out', duration: 4000 },
      { text: 'Hold', duration: 4000 },
    ];

    let currentIndex = 0;
    setInstruction('Get Ready...');

    const timer = setTimeout(() => {
        const run = () => {
            setInstruction(sequence[currentIndex].text);
            const nextIndex = (currentIndex + 1) % sequence.length;
            currentIndex = nextIndex;
        };
        run(); // run immediately
        const interval = setInterval(run, 4000);
        return () => clearInterval(interval);
    }, 2000);


    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-background rounded-lg">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 border-2 border-primary/30 rounded-lg"></div>
        <div className="absolute inset-0 rounded-lg animate-box-breathing border-2 border-primary"></div>
      </div>
      <p className="text-xl font-semibold text-primary animate-fade-in-out">{instruction}</p>
      <style jsx>{`
        @keyframes breath {
          0%, 100% { transform: scale(0.8); }
          50% { transform: scale(1); }
        }
        @keyframes box-breathing {
          0% { clip-path: inset(0 100% 100% 0); } /* Top-left corner */
          25% { clip-path: inset(0 0 100% 0); }   /* Top edge */
          50% { clip-path: inset(0 0 0 0); }      /* Full box */
          75% { clip-path: inset(0 0 0 0); }      /* Hold full */
          100% { clip-path: inset(0 100% 100% 0); }
        }
        .animate-box-breathing {
          animation: box-breathing 16s linear infinite;
        }
         @keyframes fade-in-out {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-fade-in-out {
          animation: fade-in-out 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};


const StressWellness = ({ stress, setStress }: StressWellnessProps) => {
    const { toast } = useToast();
    const todayStressEntry = stress.history.find(entry => isToday(parseISO(entry.date)));
    const [stressLevel, setStressLevel] = useState<number>(todayStressEntry?.level || 5);
    const [showBreathing, setShowBreathing] = useState(false);

    const handleStressLog = () => {
        const today = new Date().toISOString();
        setStress(prev => {
            const history = prev.history.filter(entry => !isToday(parseISO(entry.date)));
            return {
                ...prev,
                history: [...history, { date: today, level: stressLevel }],
            };
        });
        toast({ title: 'Stress Level Logged', description: `You've logged a stress level of ${stressLevel}.` });
    };
    
    if (showBreathing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                        <Wind className="text-primary" />
                        Guided Box Breathing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <BoxBreathingAnimation />
                    <Button variant="outline" className="w-full mt-4" onClick={() => setShowBreathing(false)}>End Session</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Zap className="text-primary" />
                    Daily Stress Check-in
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="stress-slider" className="text-center block mb-4">
                        On a scale of 1-10, how stressed do you feel right now?
                    </Label>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">1</span>
                        <Slider
                            id="stress-slider"
                            min={1}
                            max={10}
                            step={1}
                            value={[stressLevel]}
                            onValueChange={(value) => setStressLevel(value[0])}
                        />
                        <span className="text-sm font-medium">10</span>
                    </div>
                    <p className="text-center text-5xl font-bold mt-4 font-headline text-primary">{stressLevel}</p>
                </div>
                <Button className="w-full" onClick={handleStressLog}>Log Stress Level</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <BrainCircuit className="text-primary" />
                    Quick Relief
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center h-full">
                <p className="text-muted-foreground mb-4">Feeling overwhelmed? Try a quick guided breathing exercise to calm your mind.</p>
                <Button onClick={() => setShowBreathing(true)}>
                    <Wind className="mr-2" /> Start Box Breathing
                </Button>
            </CardContent>
        </Card>
        </div>
    );
};

export default StressWellness;
