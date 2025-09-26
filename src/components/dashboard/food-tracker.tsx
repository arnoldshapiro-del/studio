'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Check, X, Loader2, ScanLine, Utensils, Plus, History, Target, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { DiagnoseFoodOutput } from '@/ai/flows/diagnose-food-flow';
import type { FoodState, FoodEntry, MealType } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarcodeDetector as BarcodeDetectorPolyfill } from 'barcode-detector/pure';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { format, isToday, startOfDay } from 'date-fns';
import { VoiceButton } from '@/components/ui/voice-button';
import { VoiceCommand } from '@/lib/voice-commands';

type CaptureMode = 'photo' | 'barcode';

interface FoodTrackerProps {
  foodData: FoodState;
  userDocRef: DocumentReference | null;
}

const FoodTracker = ({ foodData, userDocRef }: FoodTrackerProps) => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DiagnoseFoodOutput | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | undefined
  >(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvas>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [activeTab, setActiveTab] = useState('logger');

  // Get today's food entries
  const todayEntries = foodData.history.filter(entry => 
    isToday(new Date(entry.date))
  );

  // Calculate daily totals
  const dailyTotals = todayEntries.reduce((acc, entry) => ({
    calories: acc.calories + entry.total.calories,
    protein: acc.protein + entry.total.protein,
    carbs: acc.carbs + entry.total.carbs,
    fat: acc.fat + entry.total.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Auto-select meal type based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setSelectedMealType('breakfast');
    else if (hour < 15) setSelectedMealType('lunch');
    else if (hour < 20) setSelectedMealType('dinner');
    else setSelectedMealType('snack');
  }, []);

  const getCameraPermission = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        return stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use this feature.',
        });
        throw error;
      }
    },[toast]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast({
        title: 'Camera Access Granted',
        description: 'You can now take photos of your food!',
      });
      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Required',
        description: 'Please allow camera access in your browser settings to take photos of food.',
      });
      alert("Camera access denied. Please allow camera in browser settings to use food photo recognition.");
      throw error;
    }
  };

  useEffect(() => {
    getCameraPermission();

    return () => {
      // Stop camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [getCameraPermission]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        setAnalysis(null);
        setCaptureMode('photo');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setAnalysis(null);
        setCaptureMode('photo');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeData = async (payload: { photoDataUri?: string; barcode?: string }) => {
    setIsPending(true);
    setAnalysis(null);
    try {
      const response = await fetch('/api/diagnose-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze.');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      
      if(payload.barcode && result.items.length === 0){
         toast({ variant: 'destructive', title: 'Barcode Not Found', description: 'This barcode is not in our database yet.' });
      } else {
         setAnalysis(result);
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsPending(false);
    }
  };

  const analyzePhoto = () => {
    if (!photo) return;
    analyzeData({ photoDataUri: photo });
  };
  
  const scanBarcode = useCallback(async () => {
    if (!videoRef.current || isPending) return;

    toast({ title: 'Scanning for barcode...' });
    setCaptureMode('barcode');
    setIsPending(true);
    setPhoto(null);
    setAnalysis(null);

    let barcodeDetector: BarcodeDetectorPolyfill;
    try {
        barcodeDetector = new BarcodeDetectorPolyfill();
    } catch (error) {
        console.error("Failed to create BarcodeDetector:", error);
        toast({ variant: 'destructive', title: 'Scanner Not Supported', description: 'Your browser does not support barcode scanning.' });
        setIsPending(false);
        return;
    }
    
    let isScanning = true;
    const interval = setInterval(async () => {
        if (!videoRef.current || !isScanning) {
             clearInterval(interval);
             return;
        }
        try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
                isScanning = false;
                clearInterval(interval);
                const barcodeValue = barcodes[0].rawValue;
                toast({ title: 'Barcode Found!', description: `Looking up ${barcodeValue}` });
                await analyzeData({ barcode: barcodeValue });
                setCaptureMode('photo'); // Reset capture mode
            }
        } catch (error) {
             console.error("Barcode detection failed:", error);
             toast({ variant: 'destructive', title: 'Barcode Scan Failed', description: 'Could not scan barcode.' });
             isScanning = false;
             clearInterval(interval);
             setIsPending(false);
             setCaptureMode('photo');
        }
    }, 1000); // Check every second

    // Stop scanning after 10 seconds if no barcode is found
    setTimeout(() => {
        if(isScanning){
            isScanning = false;
            clearInterval(interval);
            setIsPending(false);
            setCaptureMode('photo');
            toast({ variant: 'destructive', title: 'Scan Timed Out', description: 'No barcode was detected.' });
        }
    }, 10000);

  }, [isPending, toast]);

  const logFood = async () => {
    if (!analysis || !userDocRef) return;

    try {
      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        mealType: selectedMealType,
        items: analysis.items,
        total: analysis.total,
        photoUrl: photo || undefined,
        analysisMethod: photo ? 'photo' : 'barcode',
      };

      const updatedHistory = [...foodData.history, newEntry];
      await setDocumentNonBlocking(userDocRef, { 
        food: { ...foodData, history: updatedHistory } 
      }, { merge: true });

      toast({
        title: 'Food Logged Successfully!',
        description: `Added ${analysis.total.calories} calories to ${selectedMealType}`,
      });

      // Reset state
      reset();
      setActiveTab('history');
    } catch (error) {
      console.error('Error logging food:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Log Food',
        description: 'Please try again.',
      });
    }
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    setCaptureMode('photo');
    if (hasCameraPermission === undefined) {
      getCameraPermission();
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    if (command.action === 'log_food_intent') {
      const mealType = command.data?.mealType || selectedMealType;
      setSelectedMealType(mealType);
      setActiveTab('logger');
      
      toast({
        title: 'Food Logging Ready',
        description: `Set meal type to ${mealType}. Now take a photo or scan a barcode.`,
      });
    }
  };

  const getMealTypeColor = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lunch': return 'bg-green-100 text-green-800 border-green-200';
      case 'dinner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'snack': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatMealType = (mealType: MealType) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Daily Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Target className="text-primary" />
            Today's Nutrition Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Calories</span>
                <span className="font-medium">{dailyTotals.calories}/{foodData.dailyGoals.calories}</span>
              </div>
              <Progress value={(dailyTotals.calories / foodData.dailyGoals.calories) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Protein</span>
                <span className="font-medium">{dailyTotals.protein}g/{foodData.dailyGoals.protein}g</span>
              </div>
              <Progress value={(dailyTotals.protein / foodData.dailyGoals.protein) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Carbs</span>
                <span className="font-medium">{dailyTotals.carbs}g/{foodData.dailyGoals.carbs}g</span>
              </div>
              <Progress value={(dailyTotals.carbs / foodData.dailyGoals.carbs) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fat</span>
                <span className="font-medium">{dailyTotals.fat}g/{foodData.dailyGoals.fat}g</span>
              </div>
              <Progress value={(dailyTotals.fat / foodData.dailyGoals.fat) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Food Tracker */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logger" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Log Food
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Food Diary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logger">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Utensils className="text-primary" />
                AI Food Logger
              </CardTitle>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Meal type:</span>
                  <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <VoiceButton 
                  onCommand={handleVoiceCommand}
                  activityType="food"
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!photo && !analysis ? (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full bg-secondary rounded-md flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full aspect-video rounded-md"
                      autoPlay
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    {captureMode === 'barcode' && (
                        <div className="absolute w-full h-1/3 border-y-4 border-primary/50" />
                    )}
                     {isPending && captureMode === 'barcode' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="w-10 h-10 animate-spin text-white" />
                        </div>
                      )}
                  </div>
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access in your browser settings to use
                        this feature. You can still upload a photo.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      className="flex-1"
                      onClick={takePhoto}
                      disabled={hasCameraPermission === false || isPending}
                    >
                      <Camera className="mr-2" />
                      Take Photo
                    </Button>
                     <Button
                        className="flex-1"
                        onClick={scanBarcode}
                        disabled={hasCameraPermission === false || isPending}
                        variant="secondary"
                      >
                        <ScanLine className="mr-2" />
                        {isPending && captureMode === 'barcode' ? 'Scanning...' : 'Scan Barcode'}
                      </Button>
                  </div>
                   <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                          Or
                          </span>
                      </div>
                  </div>
                   <Button asChild variant="outline" className="w-full">
                      <label className='cursor-pointer'>
                        <Upload className="mr-2" />
                        Upload a Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={isPending}
                        />
                      </label>
                    </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {photo && (
                    <div className="relative">
                      <img src={photo} alt="Food" className="rounded-md w-full max-h-64 object-cover" />
                      <Badge className={`absolute top-2 right-2 ${getMealTypeColor(selectedMealType)}`}>
                        {formatMealType(selectedMealType)}
                      </Badge>
                    </div>
                  )}
                  {isPending && !analysis && (
                      <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="ml-4">Analyzing your meal...</p>
                      </div>
                  )}
                  {analysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md">
                          Nutritional Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Food</TableHead>
                              <TableHead className="text-right">Calories</TableHead>
                              <TableHead className="text-right">Protein</TableHead>
                              <TableHead className="text-right">Carbs</TableHead>
                              <TableHead className="text-right">Fat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.calories}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.protein}g
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.carbs}g
                                </TableCell>
                                <TableCell className="text-right">{item.fat}g</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-secondary/50">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right">
                                {analysis.total.calories}
                              </TableCell>
                              <TableCell className="text-right">
                                {analysis.total.protein}g
                              </TableCell>
                              <TableCell className="text-right">
                                {analysis.total.carbs}g
                              </TableCell>
                              <TableCell className="text-right">
                                {analysis.total.fat}g
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
             <CardFooter className="flex gap-4">
               {(photo || analysis) ? (
                  <>
                    <Button variant="outline" onClick={reset} className="flex-1">
                      <X className="mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={analysis ? logFood : analyzePhoto}
                      className="flex-1"
                      disabled={isPending || (!photo && !analysis)}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : (
                        <Check className="mr-2" />
                      )}
                      {analysis ? 'Log Food' : 'Analyze Photo'}
                    </Button>
                  </>
               ) : null}
              </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <History className="text-primary" />
                Food Diary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No food logged today yet.</p>
                  <p className="text-sm">Start by logging your first meal!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayEntries
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry) => (
                    <Card key={entry.id} className="border-l-4 border-l-primary/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getMealTypeColor(entry.mealType)}>
                              {formatMealType(entry.mealType)}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(entry.timestamp), 'h:mm a')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{entry.total.calories} cal</div>
                            <div className="text-xs text-muted-foreground">
                              P: {entry.total.protein}g • C: {entry.total.carbs}g • F: {entry.total.fat}g
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {entry.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">{item.calories} cal</span>
                            </div>
                          ))}
                        </div>
                        
                        {entry.photoUrl && (
                          <div className="mt-3">
                            <img 
                              src={entry.photoUrl} 
                              alt="Food" 
                              className="rounded-md h-20 w-20 object-cover border" 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoodTracker;