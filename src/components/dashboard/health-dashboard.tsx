'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Brain,
  Droplets,
  Moon,
  Utensils,
  BarChart3,
  Calendar,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { 
  AllData, 
  AnalyticsState, 
  WellnessScore, 
  PriorityAction,
  HealthMetric
} from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO, startOfDay, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface HealthDashboardProps {
  allHealthData: AllData;
  userDocRef: DocumentReference | null;
}

const HealthDashboard = ({ allHealthData, userDocRef }: HealthDashboardProps) => {
  const { toast } = useToast();
  
  // Calculate today's wellness score
  const calculateWellnessScore = (): WellnessScore => {
    const today = new Date().toISOString();
    
    // Component scores (0-100)
    const medicationScore = (() => {
      const todayMeds = allHealthData.medication.history.filter(h => isToday(new Date(h.date)));
      return Math.min((todayMeds.length / 2) * 100, 100); // Assuming 2 daily meds
    })();

    const waterScore = (() => {
      const todayWater = allHealthData.water.history.filter(h => isToday(new Date(h.date)));
      return Math.min((todayWater.length / 3) * 100, 100); // 3 glasses target
    })();

    const workoutScore = (() => {
      const todayWorkouts = allHealthData.workout.history.filter(h => isToday(new Date(h.date)));
      return todayWorkouts.length > 0 ? 100 : 0;
    })();

    const sleepScore = (() => {
      const lastSleep = allHealthData.sleep.history
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (!lastSleep) return 0;
      const efficiency = (lastSleep.duration / 60) / allHealthData.sleep.targetHours;
      return Math.min(efficiency * 100, 100);
    })();

    const foodScore = (() => {
      const todayFood = allHealthData.food.history.filter(h => isToday(new Date(h.date)));
      return Math.min((todayFood.length / 3) * 100, 100); // 3 meals target
    })();

    const moodScore = (() => {
      const todayMood = allHealthData.mood.history.filter(h => isToday(new Date(h.date)));
      if (todayMood.length === 0) return 50; // neutral if no data
      const latestMood = todayMood[todayMood.length - 1];
      const moodValue = latestMood.mood === 'great' ? 100 : 
                       latestMood.mood === 'good' ? 80 :
                       latestMood.mood === 'neutral' ? 60 :
                       latestMood.mood === 'bad' ? 40 : 20;
      return moodValue;
    })();

    const biometricsScore = (() => {
      const todayBio = allHealthData.biometrics.history.filter(h => isToday(new Date(h.date)));
      return todayBio.length > 0 ? 100 : 0;
    })();

    const components = {
      medication: medicationScore,
      water: waterScore,
      workout: workoutScore,
      sleep: sleepScore,
      food: foodScore,
      mood: moodScore,
      biometrics: biometricsScore,
    };

    // Calculate overall score with weights
    const weights = {
      medication: 0.25,
      water: 0.15,
      workout: 0.15,
      sleep: 0.20,
      food: 0.15,
      mood: 0.10,
      biometrics: 0.05,
    };

    const overall = Object.entries(components).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as HealthMetric]);
    }, 0);

    return {
      date: today,
      overall: Math.round(overall),
      components,
      factors: {
        consistency: allHealthData.social.currentStreak * 10, // Convert streak to score
        goal_achievement: overall,
        trend: 0, // Would need historical data
        balance: Math.min(...Object.values(components)), // Lowest component score
      },
    };
  };

  // Generate priority actions based on current data
  const generatePriorityActions = (): PriorityAction[] => {
    const actions: PriorityAction[] = [];
    const todayMeds = allHealthData.medication.history.filter(h => isToday(new Date(h.date)));
    const todayWater = allHealthData.water.history.filter(h => isToday(new Date(h.date)));
    const todayWorkouts = allHealthData.workout.history.filter(h => isToday(new Date(h.date)));
    const todayMood = allHealthData.mood.history.filter(h => isToday(new Date(h.date)));

    // Medication reminders
    if (todayMeds.length < 2) {
      actions.push({
        id: 'med-reminder',
        title: 'Take Medication',
        description: todayMeds.length === 0 ? 'Take your morning medication' : 'Take your evening medication',
        priority: 'high',
        category: 'medication',
        completed: false,
      });
    }

    // Water intake
    if (todayWater.length < 3) {
      actions.push({
        id: 'water-reminder',
        title: 'Hydrate',
        description: `Drink water - ${3 - todayWater.length} glasses remaining`,
        priority: 'medium',
        category: 'water',
        completed: false,
      });
    }

    // Exercise reminder
    if (todayWorkouts.length === 0) {
      actions.push({
        id: 'exercise-reminder',
        title: 'Get Moving',
        description: 'Complete your daily workout',
        priority: 'medium',
        category: 'workout',
        completed: false,
      });
    }

    // Mood check
    if (todayMood.length === 0) {
      actions.push({
        id: 'mood-checkin',
        title: 'Mood Check-in',
        description: 'Log how you\'re feeling today',
        priority: 'low',
        category: 'mood',
        completed: false,
      });
    }

    return actions;
  };

  const wellnessScore = useMemo(() => calculateWellnessScore(), [allHealthData]);
  const priorityActions = useMemo(() => generatePriorityActions(), [allHealthData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-500 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-500 bg-blue-100 border-blue-200';
      default: return 'text-gray-500 bg-gray-100 border-gray-200';
    }
  };

  const getMetricIcon = (metric: HealthMetric) => {
    switch (metric) {
      case 'medication': return <Heart className="w-4 h-4" />;
      case 'water': return <Droplets className="w-4 h-4" />;
      case 'workout': return <Activity className="w-4 h-4" />;
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'mood': return <Brain className="w-4 h-4" />;
      case 'biometrics': return <BarChart3 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const completeAction = async (actionId: string) => {
    // Mock completion for demo
    toast({
      title: 'Action Completed!',
      description: 'Great job staying on track with your health goals.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Wellness Score Hero */}
      <Card className={cn("border-2", getScoreBgColor(wellnessScore.overall))}>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Zap className="text-primary" />
            Today's Wellness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-current">
                <div className={cn("text-4xl font-bold", getScoreColor(wellnessScore.overall))}>
                  {wellnessScore.overall}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className="text-sm font-medium bg-white px-2 py-1 rounded-full border">
                  {wellnessScore.overall >= 80 ? 'Excellent' : 
                   wellnessScore.overall >= 60 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Component Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(wellnessScore.components).map(([metric, score]) => (
              <div key={metric} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={cn("p-2 rounded-full", getScoreBgColor(score))}>
                    {getMetricIcon(metric as HealthMetric)}
                  </div>
                </div>
                <div className={cn("text-lg font-bold", getScoreColor(score))}>{Math.round(score)}</div>
                <div className="text-xs text-muted-foreground capitalize">{metric}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Bell className="text-primary" />
              Priority Actions
            </CardTitle>
            <Badge variant="outline">{priorityActions.length} pending</Badge>
          </CardHeader>
          <CardContent>
            {priorityActions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-green-600">All caught up!</p>
                <p className="text-sm">You're on track with your health goals today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priorityActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center p-1 rounded-full bg-secondary">
                      {getMetricIcon(action.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{action.title}</span>
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeAction(action.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Streak */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-full">
                    <Target className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium">Current Streak</div>
                    <div className="text-sm text-muted-foreground">Consecutive days</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {allHealthData.social.currentStreak}
                </div>
              </div>

              {/* This Week Progress */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Weekly Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(), 'MMM d')} week
                  </span>
                </div>
                
                {(['medication', 'water', 'workout', 'sleep'] as HealthMetric[]).map((metric) => {
                  const weekData = allHealthData[metric].history?.filter(h => {
                    const entryDate = new Date(h.date);
                    const weekAgo = subDays(new Date(), 7);
                    return entryDate >= weekAgo;
                  }) || [];
                  
                  const progress = Math.min((weekData.length / 7) * 100, 100);
                  
                  return (
                    <div key={metric} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{metric}</span>
                        <span>{weekData.length}/7</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>

              {/* Health Insights */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">AI Insight</div>
                    <div className="text-xs text-blue-700">
                      {wellnessScore.overall >= 80 
                        ? "You're maintaining excellent health habits! Keep up the great work."
                        : wellnessScore.overall >= 60
                        ? "Good progress! Focus on consistency to improve your wellness score."
                        : "Consider prioritizing medication and sleep for better overall health."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Clock className="text-primary" />
            Today's Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Render today's activities chronologically */}
            {allHealthData.medication.history.filter(h => isToday(new Date(h.date)))
              .concat(allHealthData.water.history.filter(h => isToday(new Date(h.date))))
              .concat(allHealthData.workout.history.filter(h => isToday(new Date(h.date))))
              .concat(allHealthData.mood.history.filter(h => isToday(new Date(h.date))))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activities logged today yet.</p>
                <p className="text-sm">Start tracking to see your timeline!</p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <div className="font-medium">Activity timeline coming soon!</div>
                <div className="text-sm">Track your daily activities to see patterns.</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthDashboard;