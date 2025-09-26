'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  Eye,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Lightbulb,
  Zap,
  Calendar,
  Clock,
  Sun,
  CloudRain,
  Snowflake,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Activity,
  Heart,
  Moon,
  Droplets,
  Utensils,
  Search,
  Filter,
  Download,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { 
  AllData, 
  AnalyticsState,
  Pattern,
  Correlation,
  Anomaly,
  HealthMetric,
  DataPoint
} from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO, subDays, subWeeks, subMonths, getDay, getHours, getMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface AnalyticsInsightsProps {
  allHealthData: AllData;
  analyticsData: AnalyticsState;
  userDocRef: DocumentReference | null;
}

const AnalyticsInsights = ({ allHealthData, analyticsData, userDocRef }: AnalyticsInsightsProps) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('patterns');
  const [analysisTimeframe, setAnalysisTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  // Generate patterns from health data
  const generatePatterns = (): Pattern[] => {
    const patterns: Pattern[] = [];
    
    // Weekly patterns - analyze day of week trends
    const medicationByDay = Array(7).fill(0);
    const workoutsByDay = Array(7).fill(0);
    const moodByDay = Array(7).fill([]).map(() => []);

    allHealthData.medication.history.forEach(entry => {
      const dayOfWeek = getDay(new Date(entry.date));
      medicationByDay[dayOfWeek]++;
    });

    allHealthData.workout.history.forEach(entry => {
      const dayOfWeek = getDay(new Date(entry.date));
      workoutsByDay[dayOfWeek]++;
    });

    allHealthData.mood.history.forEach(entry => {
      const dayOfWeek = getDay(new Date(entry.date));
      moodByDay[dayOfWeek].push(entry.mood);
    });

    // Find peak workout days
    const peakWorkoutDay = workoutsByDay.indexOf(Math.max(...workoutsByDay));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (Math.max(...workoutsByDay) > 0) {
      patterns.push({
        id: 'workout_peak_day',
        type: 'weekly',
        metric: 'workout',
        description: `You're most active on ${dayNames[peakWorkoutDay]}s with ${workoutsByDay[peakWorkoutDay]} workouts recorded`,
        confidence: 0.85,
        recommendation: `Consider scheduling challenging workouts on ${dayNames[peakWorkoutDay]}s when you're naturally more motivated`,
        detectedAt: new Date().toISOString(),
      });
    }

    // Seasonal patterns - analyze monthly trends
    const sleepByMonth = Array(12).fill([]).map(() => []);
    allHealthData.sleep.history.forEach(entry => {
      const month = getMonth(new Date(entry.date));
      sleepByMonth[month].push(entry.duration / 60);
    });

    const avgSleepByMonth = sleepByMonth.map(monthData => 
      monthData.length > 0 ? monthData.reduce((sum: number, duration: number) => sum + duration, 0) / monthData.length : 0
    );

    const maxSleepMonth = avgSleepByMonth.indexOf(Math.max(...avgSleepByMonth));
    const minSleepMonth = avgSleepByMonth.indexOf(Math.min(...avgSleepByMonth.filter(avg => avg > 0)));

    if (avgSleepByMonth.filter(avg => avg > 0).length >= 2) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      patterns.push({
        id: 'sleep_seasonal',
        type: 'seasonal',
        metric: 'sleep',
        description: `Sleep patterns vary seasonally: best in ${monthNames[maxSleepMonth]} (${avgSleepByMonth[maxSleepMonth].toFixed(1)}h), lowest in ${monthNames[minSleepMonth]} (${avgSleepByMonth[minSleepMonth].toFixed(1)}h)`,
        confidence: 0.7,
        recommendation: `Prepare for seasonal changes by adjusting sleep schedule in advance`,
        detectedAt: new Date().toISOString(),
      });
    }

    // Daily patterns - analyze time-of-day trends
    const moodByHour = Array(24).fill([]).map(() => []);
    allHealthData.mood.history.forEach(entry => {
      const hour = getHours(new Date(entry.date));
      const moodScore = entry.mood === 'great' ? 5 : 
                       entry.mood === 'good' ? 4 :
                       entry.mood === 'neutral' ? 3 :
                       entry.mood === 'bad' ? 2 : 1;
      moodByHour[hour].push(moodScore);
    });

    const avgMoodByHour = moodByHour.map(hourData => 
      hourData.length > 0 ? hourData.reduce((sum: number, score: number) => sum + score, 0) / hourData.length : 0
    );

    const peakMoodHour = avgMoodByHour.indexOf(Math.max(...avgMoodByHour));
    if (Math.max(...avgMoodByHour) > 0) {
      patterns.push({
        id: 'mood_daily_peak',
        type: 'daily',
        metric: 'mood',
        description: `Your mood peaks around ${peakMoodHour}:00 with an average score of ${avgMoodByHour[peakMoodHour].toFixed(1)}/5`,
        confidence: 0.75,
        recommendation: `Schedule important activities around ${peakMoodHour}:00 when you feel your best`,
        detectedAt: new Date().toISOString(),
      });
    }

    return patterns;
  };

  // Generate correlations between different health metrics
  const generateCorrelations = (): Correlation[] => {
    const correlations: Correlation[] = [];

    // Sleep-Mood correlation
    const sleepMoodPairs: Array<{sleep: number, mood: number}> = [];
    
    allHealthData.sleep.history.forEach(sleepEntry => {
      const sleepDate = sleepEntry.date.split('T')[0];
      const moodEntry = allHealthData.mood.history.find(mood => 
        mood.date.split('T')[0] === sleepDate
      );
      
      if (moodEntry) {
        const moodScore = moodEntry.mood === 'great' ? 5 : 
                         moodEntry.mood === 'good' ? 4 :
                         moodEntry.mood === 'neutral' ? 3 :
                         moodEntry.mood === 'bad' ? 2 : 1;
        sleepMoodPairs.push({
          sleep: sleepEntry.duration / 60,
          mood: moodScore
        });
      }
    });

    if (sleepMoodPairs.length >= 3) {
      // Simple correlation calculation
      const n = sleepMoodPairs.length;
      const sumX = sleepMoodPairs.reduce((sum, pair) => sum + pair.sleep, 0);
      const sumY = sleepMoodPairs.reduce((sum, pair) => sum + pair.mood, 0);
      const sumXY = sleepMoodPairs.reduce((sum, pair) => sum + pair.sleep * pair.mood, 0);
      const sumX2 = sleepMoodPairs.reduce((sum, pair) => sum + pair.sleep * pair.sleep, 0);
      const sumY2 = sleepMoodPairs.reduce((sum, pair) => sum + pair.mood * pair.mood, 0);
      
      const correlation = (n * sumXY - sumX * sumY) / 
        Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      if (!isNaN(correlation)) {
        correlations.push({
          metrics: ['sleep', 'mood'],
          coefficient: correlation,
          strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak',
          direction: correlation > 0 ? 'positive' : 'negative',
          significance: Math.abs(correlation)
        });
      }
    }

    // Workout-Sleep correlation
    const workoutSleepPairs: Array<{workout: number, sleep: number}> = [];
    
    allHealthData.workout.history.forEach(workoutEntry => {
      const workoutDate = workoutEntry.date.split('T')[0];
      // Look for sleep on the same night or next day
      const sleepEntry = allHealthData.sleep.history.find(sleep => {
        const sleepDate = sleep.date.split('T')[0];
        return sleepDate === workoutDate;
      });
      
      if (sleepEntry) {
        workoutSleepPairs.push({
          workout: workoutEntry.duration || 30, // default duration if not specified
          sleep: sleepEntry.duration / 60
        });
      }
    });

    if (workoutSleepPairs.length >= 3) {
      const n = workoutSleepPairs.length;
      const sumX = workoutSleepPairs.reduce((sum, pair) => sum + pair.workout, 0);
      const sumY = workoutSleepPairs.reduce((sum, pair) => sum + pair.sleep, 0);
      const sumXY = workoutSleepPairs.reduce((sum, pair) => sum + pair.workout * pair.sleep, 0);
      const sumX2 = workoutSleepPairs.reduce((sum, pair) => sum + pair.workout * pair.workout, 0);
      const sumY2 = workoutSleepPairs.reduce((sum, pair) => sum + pair.sleep * pair.sleep, 0);
      
      const correlation = (n * sumXY - sumX * sumY) / 
        Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      if (!isNaN(correlation)) {
        correlations.push({
          metrics: ['workout', 'sleep'],
          coefficient: correlation,
          strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak',
          direction: correlation > 0 ? 'positive' : 'negative',
          significance: Math.abs(correlation)
        });
      }
    }

    return correlations;
  };

  // Detect anomalies in health data
  const detectAnomalies = (): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    
    // Sleep duration anomalies
    const recentSleep = allHealthData.sleep.history
      .filter(entry => new Date(entry.date) >= subDays(new Date(), 30))
      .map(entry => entry.duration / 60);

    if (recentSleep.length >= 5) {
      const avgSleep = recentSleep.reduce((sum, duration) => sum + duration, 0) / recentSleep.length;
      const stdDev = Math.sqrt(recentSleep.reduce((sum, duration) => sum + Math.pow(duration - avgSleep, 2), 0) / recentSleep.length);
      
      const latestSleep = recentSleep[recentSleep.length - 1];
      const zScore = Math.abs((latestSleep - avgSleep) / stdDev);
      
      if (zScore > 2) { // More than 2 standard deviations
        anomalies.push({
          id: `sleep_anomaly_${Date.now()}`,
          metric: 'sleep',
          value: latestSleep,
          expectedRange: [avgSleep - stdDev, avgSleep + stdDev],
          severity: zScore > 3 ? 'high' : 'medium',
          date: new Date().toISOString(),
          description: `Sleep duration (${latestSleep.toFixed(1)}h) is ${zScore > 3 ? 'significantly' : 'notably'} different from your average (${avgSleep.toFixed(1)}h)`,
          recommendation: latestSleep > avgSleep ? 'Monitor if this indicates oversleeping' : 'Consider improving sleep hygiene'
        });
      }
    }

    return anomalies;
  };

  const patterns = useMemo(() => generatePatterns(), [allHealthData]);
  const correlations = useMemo(() => generateCorrelations(), [allHealthData]);
  const anomalies = useMemo(() => detectAnomalies(), [allHealthData]);

  const getMetricIcon = (metric: HealthMetric) => {
    switch (metric) {
      case 'medication': return <Heart className="w-4 h-4 text-red-500" />;
      case 'water': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'workout': return <Activity className="w-4 h-4 text-green-500" />;
      case 'sleep': return <Moon className="w-4 h-4 text-purple-500" />;
      case 'food': return <Utensils className="w-4 h-4 text-orange-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'seasonal': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'weekly': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'daily': return <Clock className="w-4 h-4 text-green-500" />;
      case 'trend': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default: return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCorrelationIcon = (direction: string) => {
    switch (direction) {
      case 'positive': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'negative': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-100 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'weak': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Brain className="text-primary" />
            Health Analytics & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{patterns.length}</div>
              <div className="text-sm text-muted-foreground">Patterns Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{correlations.length}</div>
              <div className="text-sm text-muted-foreground">Correlations Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{anomalies.length}</div>
              <div className="text-sm text-muted-foreground">Anomalies Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {patterns.length > 0 ? Math.round(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="correlations" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Correlations
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detected Patterns</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={analysisTimeframe} onValueChange={(value: any) => setAnalysisTimeframe(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns detected yet.</p>
                  <p className="text-sm">Keep tracking your health to discover meaningful patterns!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern) => (
                    <Card key={pattern.id} className="border-l-4 border-l-blue-400">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {getPatternIcon(pattern.type)}
                            {getMetricIcon(pattern.metric)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium capitalize">{pattern.type} Pattern</span>
                              <Badge className={getStrengthColor(pattern.confidence > 0.8 ? 'strong' : pattern.confidence > 0.6 ? 'moderate' : 'weak')}>
                                {Math.round(pattern.confidence * 100)}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                            {pattern.recommendation && (
                              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                                <p className="text-xs text-blue-700">{pattern.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle>Health Metric Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              {correlations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No significant correlations found yet.</p>
                  <p className="text-sm">More data needed to identify relationships between metrics.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {correlations.map((correlation, index) => (
                    <Card key={index} className="border-l-4 border-l-green-400">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {getMetricIcon(correlation.metrics[0])}
                            {getCorrelationIcon(correlation.direction)}
                            {getMetricIcon(correlation.metrics[1])}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium capitalize">
                                {correlation.metrics[0]} ↔ {correlation.metrics[1]}
                              </span>
                              <Badge className={getStrengthColor(correlation.strength)}>
                                {correlation.strength} correlation
                              </Badge>
                              <Badge variant="outline">
                                {correlation.direction} ({correlation.coefficient > 0 ? '+' : ''}{correlation.coefficient.toFixed(2)})
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {correlation.direction === 'positive' 
                                ? `Higher ${correlation.metrics[0]} tends to correlate with higher ${correlation.metrics[1]}`
                                : `Higher ${correlation.metrics[0]} tends to correlate with lower ${correlation.metrics[1]}`
                              }
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Significance:</span>
                              <Progress value={correlation.significance * 100} className="w-24 h-2" />
                              <span className="text-xs text-muted-foreground">{Math.round(correlation.significance * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Health Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium text-green-600">No anomalies detected!</p>
                  <p className="text-sm">Your health metrics are within expected ranges.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly) => (
                    <Card key={anomaly.id} className="border-l-4 border-l-orange-400">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={cn("w-5 h-5 mt-0.5", 
                            anomaly.severity === 'high' ? 'text-red-500' :
                            anomaly.severity === 'medium' ? 'text-orange-500' :
                            'text-yellow-500')} 
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium capitalize">{anomaly.metric} Anomaly</span>
                              <Badge className={getSeverityColor(anomaly.severity)}>
                                {anomaly.severity} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                            <div className="text-xs text-muted-foreground mb-2">
                              Expected range: {anomaly.expectedRange[0].toFixed(1)} - {anomaly.expectedRange[1].toFixed(1)} | 
                              Actual: {anomaly.value.toFixed(1)}
                            </div>
                            {anomaly.recommendation && (
                              <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                <Target className="w-4 h-4 text-orange-500 mt-0.5" />
                                <p className="text-xs text-orange-700">{anomaly.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Personalized Recommendations */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800 mb-2">Personalized Recommendations</div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {patterns.length > 0 && patterns[0].recommendation && (
                          <li>• {patterns[0].recommendation}</li>
                        )}
                        {correlations.some(c => c.metrics.includes('sleep') && c.metrics.includes('mood')) && (
                          <li>• Your sleep and mood are connected - prioritize consistent sleep for better emotional well-being</li>
                        )}
                        {allHealthData.workout.history.length > 0 && (
                          <li>• Keep up the great work with exercise - it's positively impacting your overall health</li>
                        )}
                        <li>• Continue consistent tracking to unlock more personalized insights</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800 mb-2">Optimization Opportunities</div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Track mood more consistently to identify emotional patterns</li>
                        <li>• Log sleep environment factors for better sleep quality insights</li>
                        <li>• Add biometric measurements for comprehensive health monitoring</li>
                        <li>• Consider tracking stress levels to understand impact on other metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Data Quality Insights */}
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-2">Data Quality Assessment</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['medication', 'sleep', 'workout'] as HealthMetric[]).map((metric) => {
                          const dataCount = allHealthData[metric].history?.length || 0;
                          const quality = dataCount >= 20 ? 'Excellent' : dataCount >= 10 ? 'Good' : dataCount >= 5 ? 'Fair' : 'Limited';
                          const qualityColor = dataCount >= 20 ? 'text-green-600' : dataCount >= 10 ? 'text-blue-600' : dataCount >= 5 ? 'text-yellow-600' : 'text-red-600';
                          
                          return (
                            <div key={metric} className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                {getMetricIcon(metric)}
                              </div>
                              <div className={cn("text-sm font-medium", qualityColor)}>{quality}</div>
                              <div className="text-xs text-muted-foreground capitalize">{metric} ({dataCount} entries)</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsInsights;