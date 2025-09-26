'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText,
  Download,
  Share2,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Activity,
  Heart,
  Moon,
  Utensils,
  Droplets,
  User,
  Stethoscope,
  FileBarChart,
  Clock,
  Target
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
import { Separator } from '@/components/ui/separator';
import type { 
  AllData, 
  HealthReport,
  AnalyticsState,
  HealthMetric,
  Correlation
} from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO, subDays, subWeeks, subMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HealthReportsProps {
  allHealthData: AllData;
  analyticsData: AnalyticsState;
  userDocRef: DocumentReference | null;
}

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

const HealthReports = ({ allHealthData, analyticsData, userDocRef }: HealthReportsProps) => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('generate');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Generate comprehensive health report
  const generateHealthReport = (period: ReportPeriod): HealthReport => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
    }

    // Filter data for the period
    const periodData = {
      medication: allHealthData.medication.history.filter(h => new Date(h.date) >= startDate),
      water: allHealthData.water.history.filter(h => new Date(h.date) >= startDate),
      workout: allHealthData.workout.history.filter(h => new Date(h.date) >= startDate),
      sleep: allHealthData.sleep.history.filter(h => new Date(h.date) >= startDate),
      food: allHealthData.food.history.filter(h => new Date(h.date) >= startDate),
      mood: allHealthData.mood.history.filter(h => new Date(h.date) >= startDate),
      biometrics: allHealthData.biometrics.history.filter(h => new Date(h.date) >= startDate),
    };

    const totalDays = differenceInDays(now, startDate);

    // Calculate medication adherence
    const expectedMedDoses = totalDays * 2; // Assuming 2 doses per day
    const actualMedDoses = periodData.medication.length;
    const medicationAdherence = expectedMedDoses > 0 ? (actualMedDoses / expectedMedDoses) * 100 : 0;

    // Calculate averages and trends
    const avgSleep = periodData.sleep.length > 0 
      ? periodData.sleep.reduce((sum, entry) => sum + entry.duration, 0) / periodData.sleep.length / 60
      : 0;

    const avgSleepQuality = periodData.sleep.length > 0
      ? periodData.sleep.reduce((sum, entry) => sum + entry.quality, 0) / periodData.sleep.length
      : 0;

    const workoutFrequency = periodData.workout.length;
    const avgWorkoutDuration = periodData.workout.length > 0
      ? periodData.workout.reduce((sum, entry) => sum + (entry.duration || 0), 0) / periodData.workout.length
      : 0;

    // Calculate nutrition metrics
    const foodEntries = periodData.food;
    const avgCalories = foodEntries.length > 0
      ? foodEntries.reduce((sum, entry) => sum + entry.total.calories, 0) / foodEntries.length
      : 0;

    const calorieGoalsMet = foodEntries.filter(entry => 
      Math.abs(entry.total.calories - allHealthData.food.dailyGoals.calories) <= 200
    ).length;

    // Generate correlations (simplified for demo)
    const correlations: Correlation[] = [
      {
        metrics: ['sleep', 'mood'],
        coefficient: 0.7,
        strength: 'strong',
        direction: 'positive',
        significance: 0.85,
      },
      {
        metrics: ['workout', 'sleep'],
        coefficient: 0.5,
        strength: 'moderate',
        direction: 'positive',
        significance: 0.65,
      },
    ];

    // Calculate overall health score
    const overallScore = Math.round([
      medicationAdherence,
      (avgSleep / allHealthData.sleep.targetHours) * 100,
      Math.min((workoutFrequency / (totalDays * 0.7)) * 100, 100), // Assuming 70% workout target
      (avgSleepQuality / 5) * 100,
      Math.min((calorieGoalsMet / Math.max(totalDays, 1)) * 100, 100),
    ].reduce((sum, score) => sum + score, 0) / 5);

    return {
      id: `report_${Date.now()}`,
      generatedAt: now.toISOString(),
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        overallScore,
        keyMetrics: {
          medication: {
            average: medicationAdherence,
            trend: medicationAdherence >= 80 ? 'improving' : 'stable',
            adherence: medicationAdherence,
          },
          water: {
            average: periodData.water.length / Math.max(totalDays, 1),
            trend: 'stable',
            adherence: Math.min((periodData.water.length / (totalDays * 3)) * 100, 100),
          },
          workout: {
            average: workoutFrequency / Math.max(totalDays, 1),
            trend: 'improving',
            adherence: Math.min((workoutFrequency / (totalDays * 0.7)) * 100, 100),
          },
          sleep: {
            average: avgSleep,
            trend: avgSleep >= allHealthData.sleep.targetHours ? 'improving' : 'stable',
            adherence: Math.min((avgSleep / allHealthData.sleep.targetHours) * 100, 100),
          },
          food: {
            average: avgCalories,
            trend: 'stable',
            adherence: Math.min((calorieGoalsMet / Math.max(totalDays, 1)) * 100, 100),
          },
          mood: {
            average: periodData.mood.length / Math.max(totalDays, 1),
            trend: 'stable',
            adherence: Math.min((periodData.mood.length / totalDays) * 100, 100),
          },
          biometrics: {
            average: periodData.biometrics.length / Math.max(totalDays, 1),
            trend: 'stable',
            adherence: Math.min((periodData.biometrics.length / totalDays) * 100, 100),
          },
        },
        achievements: allHealthData.social.achievements.length > 0 
          ? [`Unlocked ${allHealthData.social.achievements.length} achievements`]
          : [],
        concerns: [
          ...(medicationAdherence < 80 ? ['Medication adherence below target'] : []),
          ...(avgSleep < allHealthData.sleep.targetHours ? ['Sleep duration below target'] : []),
          ...(workoutFrequency < totalDays * 0.5 ? ['Exercise frequency could be improved'] : []),
        ],
      },
      sections: {
        medicationAdherence: {
          percentage: medicationAdherence,
          missed: Math.max(0, expectedMedDoses - actualMedDoses),
          streaks: allHealthData.social.longestStreak,
        },
        lifestyleFactors: {
          sleep: {
            average: avgSleep,
            quality: avgSleepQuality,
          },
          exercise: {
            frequency: workoutFrequency,
            duration: avgWorkoutDuration,
          },
          nutrition: {
            caloryGoalsMet: calorieGoalsMet,
            balance: avgCalories / allHealthData.food.dailyGoals.calories,
          },
        },
        correlations,
        recommendations: [
          ...(medicationAdherence < 90 ? ['Consider setting medication reminders'] : []),
          ...(avgSleep < 7 ? ['Aim for 7-9 hours of sleep nightly'] : []),
          ...(workoutFrequency < totalDays * 0.5 ? ['Increase physical activity frequency'] : []),
          'Continue tracking for better health insights',
          'Maintain consistency in daily health routines',
        ],
      },
    };
  };

  const handleGenerateReport = async () => {
    if (!userDocRef) return;

    setGeneratingReport(true);
    
    try {
      const report = generateHealthReport(reportPeriod);
      
      const updatedAnalytics = {
        ...analyticsData,
        reports: [...analyticsData.reports, report],
      };

      await setDocumentNonBlocking(userDocRef, {
        analytics: updatedAnalytics
      }, { merge: true });

      toast({
        title: 'Report Generated!',
        description: `Your ${reportPeriod}ly health report is ready for review.`,
      });

      setShowGenerateDialog(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Report',
        description: 'Please try again.',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportToPDF = (report: HealthReport) => {
    // Mock PDF export for demo
    toast({
      title: 'PDF Export',
      description: 'Report export feature coming soon! Your report would be downloaded as a professional PDF.',
    });
  };

  const shareWithProvider = (report: HealthReport) => {
    // Mock sharing for demo
    toast({
      title: 'Shared with Provider',
      description: 'Your health report has been securely shared with your healthcare provider.',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="w-4 h-4 text-gray-500 rotate-90" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricIcon = (metric: HealthMetric) => {
    switch (metric) {
      case 'medication': return <Heart className="w-5 h-5 text-red-500" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'workout': return <Activity className="w-5 h-5 text-green-500" />;
      case 'sleep': return <Moon className="w-5 h-5 text-purple-500" />;
      case 'food': return <Utensils className="w-5 h-5 text-orange-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const recentReport = analyticsData.reports.length > 0 
    ? analyticsData.reports[analyticsData.reports.length - 1] 
    : null;

  return (
    <div className="space-y-6">
      {/* Reports Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <FileText className="text-primary" />
            Health Reports Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analyticsData.reports.length}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {recentReport ? Math.round(recentReport.summary.overallScore) : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Latest Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {recentReport ? recentReport.summary.concerns.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Health Concerns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {analyticsData.preferences.shareWithProvider ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Provider Sharing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Health Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Report Period</Label>
                  <Select value={reportPeriod} onValueChange={(value: ReportPeriod) => setReportPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Report Type</Label>
                  <Select defaultValue="comprehensive">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                      <SelectItem value="medication">Medication Focus</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle Focus</SelectItem>
                      <SelectItem value="summary">Executive Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Report Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg">
                  {(['medication', 'sleep', 'workout', 'food'] as HealthMetric[]).map((metric) => {
                    const data = allHealthData[metric].history || [];
                    const recentData = data.filter(h => {
                      const entryDate = new Date(h.date);
                      const cutoff = reportPeriod === 'week' ? subWeeks(new Date(), 1) :
                                   reportPeriod === 'month' ? subMonths(new Date(), 1) :
                                   reportPeriod === 'quarter' ? subMonths(new Date(), 3) :
                                   subMonths(new Date(), 12);
                      return entryDate >= cutoff;
                    });
                    
                    return (
                      <div key={metric} className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {getMetricIcon(metric)}
                        </div>
                        <div className="text-lg font-bold">{recentData.length}</div>
                        <div className="text-xs text-muted-foreground capitalize">{metric} entries</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={handleGenerateReport} 
                className="w-full"
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}ly Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports generated yet.</p>
                  <p className="text-sm">Generate your first health report to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData.reports.slice(-3).reverse().map((report) => (
                    <Card key={report.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="font-semibold mb-1">
                              Health Report - {format(new Date(report.generatedAt), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Period: {format(new Date(report.period.start), 'MMM d')} - {format(new Date(report.period.end), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-2xl font-bold", getScoreColor(report.summary.overallScore))}>
                              {Math.round(report.summary.overallScore)}
                            </div>
                            <div className="text-xs text-muted-foreground">Overall Score</div>
                          </div>
                        </div>

                        {/* Key Metrics Summary */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                          {Object.entries(report.summary.keyMetrics).slice(0, 6).map(([metric, data]) => (
                            <div key={metric} className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                {getMetricIcon(metric as HealthMetric)}
                              </div>
                              <div className="text-sm font-medium">{Math.round(data.adherence)}%</div>
                              <div className="text-xs text-muted-foreground capitalize">{metric}</div>
                            </div>
                          ))}
                        </div>

                        {/* Achievements & Concerns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Key Achievements
                            </div>
                            {report.summary.achievements.length === 0 ? (
                              <div className="text-xs text-muted-foreground">No specific achievements this period</div>
                            ) : (
                              <ul className="text-xs space-y-1">
                                {report.summary.achievements.slice(0, 3).map((achievement, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              Areas for Improvement
                            </div>
                            {report.summary.concerns.length === 0 ? (
                              <div className="text-xs text-muted-foreground">No concerns identified</div>
                            ) : (
                              <ul className="text-xs space-y-1">
                                {report.summary.concerns.slice(0, 3).map((concern, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-orange-500" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToPDF(report)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareWithProvider(report)}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share with Provider
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Default Report Frequency</Label>
                  <Select defaultValue={analyticsData.preferences.reportFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Share with Healthcare Provider</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically share reports with your healthcare team
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={analyticsData.preferences.shareWithProvider}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Include Biometric Data</div>
                      <div className="text-sm text-muted-foreground">
                        Add detailed biometric trends to reports
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked={true} className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">AI Insights & Recommendations</div>
                      <div className="text-sm text-muted-foreground">
                        Include AI-generated health insights
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked={true} className="rounded" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800">Healthcare Provider Integration</div>
                    <div className="text-sm text-blue-700 mb-3">
                      Connect with your healthcare provider to automatically share reports and receive personalized recommendations.
                    </div>
                    <Button variant="outline" size="sm" className="bg-white">
                      <User className="w-4 h-4 mr-2" />
                      Connect Provider
                    </Button>
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

export default HealthReports;