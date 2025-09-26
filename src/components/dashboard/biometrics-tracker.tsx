'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart,
  Activity,
  Thermometer,
  Scale,
  Zap,
  Footprints,
  AlertTriangle,
  TrendingUp,
  Plus,
  Settings,
  Smartphone
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
import { Switch } from '@/components/ui/switch';
import type { BiometricsState, BiometricEntry, BiometricReading } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VoiceButton } from '@/components/ui/voice-button';
import { VoiceCommand } from '@/lib/voice-commands';
import { format, isToday, parseISO, subDays } from 'date-fns';
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

interface BiometricsTrackerProps {
  biometricsData: BiometricsState;
  userDocRef: DocumentReference | null;
}

type MetricType = 'heartRate' | 'bloodPressure' | 'temperature' | 'weight' | 'oxygenSaturation' | 'steps';

const BiometricsTracker = ({ biometricsData, userDocRef }: BiometricsTrackerProps) => {
  const { toast } = useToast();
  
  // Today's biometric entry
  const todayBiometrics = biometricsData.history.find(entry => 
    isToday(new Date(entry.date))
  );

  // Form states
  const [heartRate, setHeartRate] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');
  const [steps, setSteps] = useState('');
  const [activeTab, setActiveTab] = useState('log');
  const [showSettings, setShowSettings] = useState(false);

  // Settings states
  const [alertsEnabled, setAlertsEnabled] = useState(biometricsData.alerts.enabled);
  const [thresholds, setThresholds] = useState(biometricsData.alerts.thresholds);

  // Get recent readings for trends
  const recentEntries = biometricsData.history
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = subDays(new Date(), 7);
      return entryDate >= weekAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate latest readings
  const getLatestReading = (type: MetricType): BiometricReading | null => {
    for (const entry of recentEntries) {
      const readings = entry[type] as BiometricReading[] | undefined;
      if (readings && readings.length > 0) {
        return readings[readings.length - 1];
      }
    }
    return null;
  };

  const getLatestBloodPressure = () => {
    for (const entry of recentEntries) {
      if (entry.bloodPressure && entry.bloodPressure.length > 0) {
        return entry.bloodPressure[entry.bloodPressure.length - 1];
      }
    }
    return null;
  };

  // Health alerts
  const getHealthAlerts = () => {
    if (!alertsEnabled) return [];
    
    const alerts: string[] = [];
    const latestHR = getLatestReading('heartRate');
    const latestBP = getLatestBloodPressure();
    const latestTemp = getLatestReading('temperature');
    const latestSpO2 = getLatestReading('oxygenSaturation');

    if (latestHR && thresholds.heartRateHigh && latestHR.value > thresholds.heartRateHigh) {
      alerts.push(`High heart rate detected: ${latestHR.value} bpm`);
    }
    if (latestHR && thresholds.heartRateLow && latestHR.value < thresholds.heartRateLow) {
      alerts.push(`Low heart rate detected: ${latestHR.value} bpm`);
    }
    if (latestBP && thresholds.systolicHigh && latestBP.systolic > thresholds.systolicHigh) {
      alerts.push(`High blood pressure: ${latestBP.systolic}/${latestBP.diastolic} mmHg`);
    }
    if (latestTemp && thresholds.temperatureHigh && latestTemp.value > thresholds.temperatureHigh) {
      alerts.push(`Elevated temperature: ${latestTemp.value}°C`);
    }
    if (latestSpO2 && thresholds.oxygenSaturationLow && latestSpO2.value < thresholds.oxygenSaturationLow) {
      alerts.push(`Low oxygen saturation: ${latestSpO2.value}%`);
    }

    return alerts;
  };

  const handleSaveBiometric = async (type: MetricType, value: string, additionalData?: any) => {
    if (!userDocRef || !value.trim()) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Value',
        description: 'Please enter a valid number.',
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      const reading: BiometricReading = {
        value: numValue,
        timestamp: now,
        source: 'manual',
      };

      let updatedEntry: BiometricEntry;
      
      if (todayBiometrics) {
        updatedEntry = { ...todayBiometrics };
      } else {
        updatedEntry = {
          id: Date.now().toString(),
          date: now,
        };
      }

      if (type === 'bloodPressure' && additionalData) {
        updatedEntry.bloodPressure = [
          ...(updatedEntry.bloodPressure || []),
          {
            systolic: numValue,
            diastolic: additionalData.diastolic,
            timestamp: now,
            source: 'manual',
          }
        ];
      } else {
        const currentReadings = (updatedEntry[type] as BiometricReading[]) || [];
        updatedEntry[type] = [...currentReadings, reading] as any;
      }

      const updatedHistory = todayBiometrics 
        ? biometricsData.history.map(entry => 
            isToday(new Date(entry.date)) ? updatedEntry : entry
          )
        : [...biometricsData.history, updatedEntry];

      await setDocumentNonBlocking(userDocRef, { 
        biometrics: { ...biometricsData, history: updatedHistory } 
      }, { merge: true });

      toast({
        title: 'Biometric Saved!',
        description: `${type === 'bloodPressure' ? 'Blood pressure' : type} recorded successfully`,
      });

      // Clear the input
      switch (type) {
        case 'heartRate': setHeartRate(''); break;
        case 'temperature': setTemperature(''); break;
        case 'weight': setWeight(''); break;
        case 'oxygenSaturation': setOxygenSat(''); break;
        case 'steps': setSteps(''); break;
        case 'bloodPressure': setSystolic(''); setDiastolic(''); break;
      }
    } catch (error) {
      console.error('Error saving biometric:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Save',
        description: 'Please try again.',
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!userDocRef) return;

    try {
      await setDocumentNonBlocking(userDocRef, { 
        biometrics: { 
          ...biometricsData, 
          alerts: { 
            enabled: alertsEnabled, 
            thresholds 
          } 
        } 
      }, { merge: true });

      toast({
        title: 'Settings Saved!',
        description: 'Your alert preferences have been updated.',
      });
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Save Settings',
        description: 'Please try again.',
      });
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    if (command.action === 'log_biometric') {
      const { type, value } = command.data || {};
      
      switch (type) {
        case 'heartRate':
          setHeartRate(value?.toString() || '');
          break;
        case 'weight':
          setWeight(value?.toString() || '');
          break;
        case 'temperature':
          setTemperature(value?.toString() || '');
          break;
      }
      
      toast({
        title: 'Voice Input Processed',
        description: `${type} set to ${value}`,
      });
    }
  };

  const formatReading = (reading: BiometricReading | null, unit: string) => {
    return reading ? `${reading.value}${unit}` : '—';
  };

  const healthAlerts = getHealthAlerts();

  return (
    <div className="space-y-6">
      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2 text-orange-800">
              <AlertTriangle className="text-orange-500" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biometrics Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Activity className="text-primary" />
            Biometrics Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alert Settings</DialogTitle>
                  <DialogDescription>
                    Configure health alerts and thresholds
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Health Alerts</Label>
                    <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                  </div>
                  
                  {alertsEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>High Heart Rate (bpm)</Label>
                          <Input
                            type="number"
                            value={thresholds.heartRateHigh || ''}
                            onChange={(e) => setThresholds(prev => ({
                              ...prev,
                              heartRateHigh: e.target.value ? Number(e.target.value) : undefined
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Low Heart Rate (bpm)</Label>
                          <Input
                            type="number"
                            value={thresholds.heartRateLow || ''}
                            onChange={(e) => setThresholds(prev => ({
                              ...prev,
                              heartRateLow: e.target.value ? Number(e.target.value) : undefined
                            }))}
                          />
                        </div>
                        <div>
                          <Label>High Systolic BP (mmHg)</Label>
                          <Input
                            type="number"
                            value={thresholds.systolicHigh || ''}
                            onChange={(e) => setThresholds(prev => ({
                              ...prev,
                              systolicHigh: e.target.value ? Number(e.target.value) : undefined
                            }))}
                          />
                        </div>
                        <div>
                          <Label>High Temperature (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={thresholds.temperatureHigh || ''}
                            onChange={(e) => setThresholds(prev => ({
                              ...prev,
                              temperatureHigh: e.target.value ? Number(e.target.value) : undefined
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-lg font-bold">
                {formatReading(getLatestReading('heartRate'), ' bpm')}
              </div>
              <div className="text-xs text-muted-foreground">Heart Rate</div>
            </div>
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-bold">
                {(() => {
                  const bp = getLatestBloodPressure();
                  return bp ? `${bp.systolic}/${bp.diastolic}` : '—';
                })()}
              </div>
              <div className="text-xs text-muted-foreground">Blood Pressure</div>
            </div>
            <div className="text-center">
              <Thermometer className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-lg font-bold">
                {formatReading(getLatestReading('temperature'), '°C')}
              </div>
              <div className="text-xs text-muted-foreground">Temperature</div>
            </div>
            <div className="text-center">
              <Scale className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold">
                {formatReading(getLatestReading('weight'), ' kg')}
              </div>
              <div className="text-xs text-muted-foreground">Weight</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biometrics Tracker */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="log" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Log Vitals
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-lg">Log Biometrics</CardTitle>
              <VoiceButton 
                onCommand={handleVoiceCommand}
                activityType="biometrics"
                size="sm"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Heart Rate */}
              <div className="flex items-center gap-4">
                <Heart className="w-6 h-6 text-red-500" />
                <div className="flex-1">
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('heartRate', heartRate)}
                  disabled={!heartRate.trim()}
                >
                  Save
                </Button>
              </div>

              {/* Blood Pressure */}
              <div className="flex items-center gap-4">
                <Activity className="w-6 h-6 text-blue-500" />
                <div className="flex-1">
                  <Label>Blood Pressure (mmHg)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                    />
                    <span className="flex items-center">/</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('bloodPressure', systolic, { diastolic: parseFloat(diastolic) })}
                  disabled={!systolic.trim() || !diastolic.trim()}
                >
                  Save
                </Button>
              </div>

              {/* Temperature */}
              <div className="flex items-center gap-4">
                <Thermometer className="w-6 h-6 text-orange-500" />
                <div className="flex-1">
                  <Label>Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('temperature', temperature)}
                  disabled={!temperature.trim()}
                >
                  Save
                </Button>
              </div>

              {/* Weight */}
              <div className="flex items-center gap-4">
                <Scale className="w-6 h-6 text-green-500" />
                <div className="flex-1">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('weight', weight)}
                  disabled={!weight.trim()}
                >
                  Save
                </Button>
              </div>

              {/* Oxygen Saturation */}
              <div className="flex items-center gap-4">
                <Zap className="w-6 h-6 text-purple-500" />
                <div className="flex-1">
                  <Label>Oxygen Saturation (%)</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={oxygenSat}
                    onChange={(e) => setOxygenSat(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('oxygenSaturation', oxygenSat)}
                  disabled={!oxygenSat.trim()}
                >
                  Save
                </Button>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-4">
                <Footprints className="w-6 h-6 text-indigo-500" />
                <div className="flex-1">
                  <Label>Daily Steps</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleSaveBiometric('steps', steps)}
                  disabled={!steps.trim()}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No biometric data available.</p>
                  <p className="text-sm">Start logging your vitals to see trends!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEntries.slice(0, 7).map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">
                        {format(new Date(entry.date), 'EEEE, MMM d')}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Heart Rate: </span>
                          <span>{entry.heartRate ? `${entry.heartRate[entry.heartRate.length - 1]?.value} bpm` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BP: </span>
                          <span>{entry.bloodPressure ? `${entry.bloodPressure[entry.bloodPressure.length - 1]?.systolic}/${entry.bloodPressure[entry.bloodPressure.length - 1]?.diastolic}` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Temp: </span>
                          <span>{entry.temperature ? `${entry.temperature[entry.temperature.length - 1]?.value}°C` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight: </span>
                          <span>{entry.weight ? `${entry.weight[entry.weight.length - 1]?.value} kg` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Device integration coming soon!</p>
                <p className="text-sm">Connect wearables and health devices for automatic data sync.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BiometricsTracker;