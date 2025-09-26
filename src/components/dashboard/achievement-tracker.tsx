'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Crown, 
  Target, 
  Flame,
  Award,
  Medal,
  Zap,
  CheckCircle2,
  Lock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { 
  SocialState, 
  Achievement, 
  UserAchievement, 
  AchievementTier,
  AllData 
} from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO, subDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface AchievementTrackerProps {
  socialData: SocialState;
  allHealthData: AllData;
  userDocRef: DocumentReference | null;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Medication achievements
  {
    id: 'med_first_dose',
    title: 'First Dose',
    description: 'Log your first medication',
    category: 'medication',
    tier: 'bronze',
    icon: '💊',
    requirement: { type: 'count', target: 1 },
    points: 10,
    progress: 0,
  },
  {
    id: 'med_week_streak',
    title: 'Medication Master',
    description: 'Take medication consistently for 7 days',
    category: 'medication',
    tier: 'silver',
    icon: '🎯',
    requirement: { type: 'streak', target: 7, period: 'day' },
    points: 50,
    progress: 0,
  },
  {
    id: 'med_month_streak',
    title: 'Consistency Champion',
    description: 'Take medication consistently for 30 days',
    category: 'medication',
    tier: 'gold',
    icon: '👑',
    requirement: { type: 'streak', target: 30, period: 'day' },
    points: 200,
    progress: 0,
  },

  // Water achievements
  {
    id: 'water_first_glass',
    title: 'First Drop',
    description: 'Log your first glass of water',
    category: 'water',
    tier: 'bronze',
    icon: '💧',
    requirement: { type: 'count', target: 1 },
    points: 10,
    progress: 0,
  },
  {
    id: 'water_hydration_hero',
    title: 'Hydration Hero',
    description: 'Complete daily water goal for 7 days',
    category: 'water',
    tier: 'silver',
    icon: '🏊',
    requirement: { type: 'goal', target: 7, period: 'day' },
    points: 75,
    progress: 0,
  },

  // Workout achievements
  {
    id: 'workout_first_session',
    title: 'Getting Started',
    description: 'Complete your first workout',
    category: 'workout',
    tier: 'bronze',
    icon: '🏃',
    requirement: { type: 'count', target: 1 },
    points: 15,
    progress: 0,
  },
  {
    id: 'workout_week_warrior',
    title: 'Weekly Warrior',
    description: 'Complete 5 workouts in a week',
    category: 'workout',
    tier: 'silver',
    icon: '💪',
    requirement: { type: 'count', target: 5, period: 'week' },
    points: 100,
    progress: 0,
  },
  {
    id: 'workout_fitness_fanatic',
    title: 'Fitness Fanatic',
    description: 'Complete 20 workouts in a month',
    category: 'workout',
    tier: 'gold',
    icon: '🔥',
    requirement: { type: 'count', target: 20, period: 'month' },
    points: 300,
    progress: 0,
  },

  // Sleep achievements
  {
    id: 'sleep_first_log',
    title: 'Sleep Tracker',
    description: 'Log your first night of sleep',
    category: 'sleep',
    tier: 'bronze',
    icon: '🌙',
    requirement: { type: 'count', target: 1 },
    points: 10,
    progress: 0,
  },
  {
    id: 'sleep_quality_week',
    title: 'Quality Sleeper',
    description: 'Maintain 4+ sleep quality for a week',
    category: 'sleep',
    tier: 'silver',
    icon: '⭐',
    requirement: { type: 'goal', target: 7, period: 'day' },
    points: 80,
    progress: 0,
  },

  // Food achievements
  {
    id: 'food_first_meal',
    title: 'Nutrition Novice',
    description: 'Log your first meal',
    category: 'food',
    tier: 'bronze',
    icon: '🍎',
    requirement: { type: 'count', target: 1 },
    points: 10,
    progress: 0,
  },
  {
    id: 'food_balanced_week',
    title: 'Balanced Eater',
    description: 'Meet calorie goals for 7 days',
    category: 'food',
    tier: 'gold',
    icon: '🥗',
    requirement: { type: 'goal', target: 7, period: 'day' },
    points: 150,
    progress: 0,
  },

  // Mood achievements
  {
    id: 'mood_first_check',
    title: 'Mood Awareness',
    description: 'Log your first mood',
    category: 'mood',
    tier: 'bronze',
    icon: '😊',
    requirement: { type: 'count', target: 1 },
    points: 10,
    progress: 0,
  },
  {
    id: 'mood_positive_week',
    title: 'Positive Vibes',
    description: 'Log good+ moods for 7 days',
    category: 'mood',
    tier: 'silver',
    icon: '🌟',
    requirement: { type: 'goal', target: 7, period: 'day' },
    points: 60,
    progress: 0,
  },

  // Streak achievements
  {
    id: 'streak_perfect_week',
    title: 'Perfect Week',
    description: 'Complete all daily activities for 7 days',
    category: 'streak',
    tier: 'gold',
    icon: '🎊',
    requirement: { type: 'streak', target: 7, period: 'day' },
    points: 250,
    progress: 0,
  },
  {
    id: 'streak_unstoppable',
    title: 'Unstoppable',
    description: 'Maintain a 30-day health streak',
    category: 'streak',
    tier: 'platinum',
    icon: '💎',
    requirement: { type: 'streak', target: 30, period: 'day' },
    points: 500,
    progress: 0,
  },

  // Social achievements
  {
    id: 'social_first_challenge',
    title: 'Challenge Accepted',
    description: 'Join your first community challenge',
    category: 'social',
    tier: 'bronze',
    icon: '🤝',
    requirement: { type: 'count', target: 1 },
    points: 20,
    progress: 0,
  },
  {
    id: 'social_motivator',
    title: 'Community Motivator',
    description: 'Help 5 people with encouragement',
    category: 'social',
    tier: 'silver',
    icon: '💝',
    requirement: { type: 'count', target: 5 },
    points: 100,
    progress: 0,
  },
];

const AchievementTracker = ({ socialData, allHealthData, userDocRef }: AchievementTrackerProps) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Calculate achievement progress based on health data
  const calculateAchievementProgress = (achievement: Achievement): number => {
    const { category, requirement } = achievement;
    
    switch (category) {
      case 'medication':
        if (requirement.type === 'count') {
          return allHealthData.medication.history.length >= requirement.target ? 100 : (allHealthData.medication.history.length / requirement.target) * 100;
        }
        if (requirement.type === 'streak') {
          return Math.min((socialData.currentStreak / requirement.target) * 100, 100);
        }
        break;
        
      case 'water':
        if (requirement.type === 'count') {
          return allHealthData.water.history.length >= requirement.target ? 100 : (allHealthData.water.history.length / requirement.target) * 100;
        }
        break;
        
      case 'workout':
        if (requirement.type === 'count') {
          const workoutCount = allHealthData.workout.history.length;
          return workoutCount >= requirement.target ? 100 : (workoutCount / requirement.target) * 100;
        }
        break;
        
      case 'food':
        if (requirement.type === 'count') {
          return allHealthData.food.history.length >= requirement.target ? 100 : (allHealthData.food.history.length / requirement.target) * 100;
        }
        break;
        
      case 'sleep':
        if (requirement.type === 'count') {
          return allHealthData.sleep.history.length >= requirement.target ? 100 : (allHealthData.sleep.history.length / requirement.target) * 100;
        }
        break;
        
      case 'mood':
        if (requirement.type === 'count') {
          return allHealthData.mood.history.length >= requirement.target ? 100 : (allHealthData.mood.history.length / requirement.target) * 100;
        }
        break;
        
      case 'social':
        if (achievement.id === 'social_first_challenge') {
          return socialData.challenges.length >= 1 ? 100 : 0;
        }
        break;
        
      default:
        return 0;
    }
    
    return 0;
  };

  // Update achievements and check for newly unlocked ones
  useEffect(() => {
    const updatedAchievements = ACHIEVEMENT_DEFINITIONS.map(achievement => {
      const progress = calculateAchievementProgress(achievement);
      const existingUserAchievement = socialData.achievements.find(ua => ua.achievementId === achievement.id);
      
      return {
        ...achievement,
        progress,
        unlockedAt: progress >= 100 ? (existingUserAchievement?.unlockedAt || new Date().toISOString()) : undefined,
      };
    });

    // Find newly unlocked achievements
    const newlyUnlocked = updatedAchievements.filter(achievement => 
      achievement.progress >= 100 && 
      !socialData.achievements.some(ua => ua.achievementId === achievement.id)
    );

    if (newlyUnlocked.length > 0 && userDocRef) {
      // Add new achievements to user data
      const newUserAchievements: UserAchievement[] = newlyUnlocked.map(achievement => ({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        progress: 100,
        isNew: true,
      }));

      const updatedSocialData = {
        ...socialData,
        achievements: [...socialData.achievements, ...newUserAchievements],
        totalPoints: socialData.totalPoints + newlyUnlocked.reduce((sum, ach) => sum + ach.points, 0),
      };

      setDocumentNonBlocking(userDocRef, { social: updatedSocialData }, { merge: true });
      
      // Show celebration toast
      newlyUnlocked.forEach(achievement => {
        toast({
          title: '🎉 Achievement Unlocked!',
          description: `${achievement.icon} ${achievement.title} - ${achievement.description}`,
        });
      });

      setNewAchievements(newlyUnlocked);
    }

    setAchievements(updatedAchievements);
  }, [allHealthData, socialData, userDocRef, toast]);

  const getTierColor = (tier: AchievementTier) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'silver': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'gold': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'platinum': return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTierIcon = (tier: AchievementTier) => {
    switch (tier) {
      case 'bronze': return <Medal className="w-4 h-4" />;
      case 'silver': return <Award className="w-4 h-4" />;
      case 'gold': return <Trophy className="w-4 h-4" />;
      case 'platinum': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medication': return 'text-blue-500';
      case 'water': return 'text-cyan-500';
      case 'workout': return 'text-green-500';
      case 'sleep': return 'text-purple-500';
      case 'food': return 'text-orange-500';
      case 'mood': return 'text-pink-500';
      case 'social': return 'text-indigo-500';
      case 'streak': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Trophy className="text-primary" />
            Achievement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{socialData.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Longest Streak</div>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Level Progress</span>
              <span className="text-sm text-muted-foreground">
                Level {Math.floor(socialData.totalPoints / 100) + 1}
              </span>
            </div>
            <Progress 
              value={(socialData.totalPoints % 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{socialData.totalPoints % 100} points</span>
              <span>Next level: {100 - (socialData.totalPoints % 100)} points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Unlocked ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Locked ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {unlockedAchievements.slice(-3).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements yet.</p>
                    <p className="text-sm">Start tracking to earn your first badge!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unlockedAchievements.slice(-3).reverse().map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.title}</div>
                          <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        </div>
                        <Badge className={getTierColor(achievement.tier)}>
                          {getTierIcon(achievement.tier)}
                          {achievement.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['medication', 'water', 'workout', 'sleep', 'food', 'mood'].map((category) => {
                    const categoryAchievements = achievements.filter(a => a.category === category);
                    const unlockedCount = categoryAchievements.filter(a => a.unlockedAt).length;
                    const totalCount = categoryAchievements.length;
                    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn("text-sm font-medium capitalize", getCategoryColor(category))}>
                            {category}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {unlockedCount}/{totalCount}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="unlocked">
          <Card>
            <CardHeader>
              <CardTitle>Unlocked Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {unlockedAchievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements unlocked yet.</p>
                  <p className="text-sm">Keep tracking your health to unlock your first achievement!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unlockedAchievements.map((achievement) => (
                    <div key={achievement.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{achievement.title}</span>
                            <Badge className={getTierColor(achievement.tier)}>
                              {getTierIcon(achievement.tier)}
                              {achievement.tier}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-green-600 font-medium">✓ Completed</span>
                            <span className="text-muted-foreground">
                              {achievement.unlockedAt && format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-600">+{achievement.points}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Achievements in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedAchievements.filter(a => a.progress > 0).map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{achievement.title}</span>
                          <Badge className={getTierColor(achievement.tier)}>
                            {getTierIcon(achievement.tier)}
                            {achievement.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(achievement.progress)}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">+{achievement.points}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locked">
          <Card>
            <CardHeader>
              <CardTitle>Locked Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4 opacity-60">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl grayscale">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{achievement.title}</span>
                          <Badge className={cn(getTierColor(achievement.tier), "opacity-60")}>
                            {getTierIcon(achievement.tier)}
                            {achievement.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-muted-foreground">+{achievement.points}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementTracker;