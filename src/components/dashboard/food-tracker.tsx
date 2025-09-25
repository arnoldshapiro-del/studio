
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const FoodTracker = () => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);
  

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async () => {
    if (!photo) return;
    setIsPending(true);
    setAnalysis(null);
    try {
      // Placeholder for actual AI call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAnalysis = {
        items: [
          { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
          { name: 'Peanut Butter (2 tbsp)', calories: 190, protein: 7, carbs: 8, fat: 16 },
        ],
        total: {
          calories: 285, protein: 7.5, carbs: 33, fat: 16.3
        }
      }
      setAnalysis(mockAnalysis);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the photo. Please try again.',
      });
    } finally {
      setIsPending(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Camera className="text-primary" />
          AI Food Logger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!photo ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full bg-secondary rounded-md flex items-center justify-center">
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              <div className="absolute inset-0 bg-black/20" />
            </div>
             {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to use this feature. You can still upload a photo.
                  </AlertDescription>
                </Alert>
             )}
            <div className="flex gap-4">
              <Button className="flex-1" onClick={takePhoto} disabled={hasCameraPermission === false}>
                <Camera className="mr-2" />
                Take Photo
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <label>
                  <Upload className="mr-2" />
                  Upload Photo
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <img src={photo} alt="Food" className="rounded-md w-full" />
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Nutritional Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul>
                    {analysis.items.map((item: any, index: number) => (
                      <li key={index}>{item.name}: {item.calories} kcal</li>
                    ))}
                  </ul>
                  <p className="font-bold mt-2">Total Calories: {analysis.total.calories}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
      {photo && (
        <CardFooter className="flex gap-4">
          <Button variant="outline" onClick={reset} className="flex-1">
            <X className="mr-2" />
            Reset
          </Button>
          <Button onClick={analyzePhoto} className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
            {analysis ? 'Log Food' : 'Analyze'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FoodTracker;
