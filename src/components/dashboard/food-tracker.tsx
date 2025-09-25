
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
import { Camera, Upload, Check, X, Loader2, ScanLine, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { DiagnoseFoodOutput } from '@/ai/flows/diagnose-food-flow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarcodeDetector as BarcodeDetectorPolyfill } from 'barcode-detector/pure';

type CaptureMode = 'photo' | 'barcode';

const FoodTracker = () => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DiagnoseFoodOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | undefined
  >(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');

  const getCameraPermission = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
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
          description:
            'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    },[toast]);

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
        const dataUrl = canvas.toDataURL('image/jpeg');
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


  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    setCaptureMode('photo');
    if (hasCameraPermission === undefined) {
      getCameraPermission();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Utensils className="text-primary" />
          AI Food Logger
        </CardTitle>
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
            {photo && <img src={photo} alt="Food" className="rounded-md w-full" />}
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
                onClick={photo ? analyzePhoto : () => { /* TODO: Log Data */ }}
                className="flex-1"
                disabled={isPending || !photo}
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
  );
};

export default FoodTracker;
