
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
import { Camera, Upload, Check, X, Loader2, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { diagnoseFoodAction } from '@/app/actions';
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
      const result = await diagnoseFoodAction({ photoDataUri: photo });
       if (typeof result === 'string') {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result });
      } else {
        setAnalysis(result);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the photo. Please try again.',
      });
    } finally {
      setIsPending(false);
    }
  };
  
  const scanBarcode = async () => {
    if (!videoRef.current) return;

    toast({ title: 'Scanning for barcode...' });
    setIsPending(true);

    try {
      const barcodeDetector = new BarcodeDetectorPolyfill();
      const barcodes = await barcodeDetector.detect(videoRef.current);

      if (barcodes.length > 0) {
        const barcodeValue = barcodes[0].rawValue;
        toast({ title: 'Barcode Found!', description: barcodeValue });
        const result = await diagnoseFoodAction({ barcode: barcodeValue });
         if (typeof result === 'string') {
          toast({ variant: 'destructive', title: 'Analysis Failed', description: result });
        } else {
          setAnalysis(result);
        }
      } else {
        toast({ variant: 'destructive', title: 'No barcode detected.' });
      }
    } catch (error) {
        console.error("Barcode detection failed:", error);
        toast({ variant: 'destructive', title: 'Barcode scanning not supported or failed.' });
    } finally {
        setIsPending(false);
    }
  };


  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    getCameraPermission();
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
                  <div className="absolute w-full h-1/3 border-y-4 border-primary/50 animate-pulse" />
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
            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={takePhoto}
                disabled={hasCameraPermission === false || isPending}
              >
                <Camera className="mr-2" />
                Take Photo
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <label>
                  <Upload className="mr-2" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
             <div className="flex gap-4">
                <Button
                  className="flex-1"
                  onClick={scanBarcode}
                  disabled={hasCameraPermission === false || isPending}
                  variant="secondary"
                >
                  <ScanLine className="mr-2" />
                  {isPending ? 'Scanning...' : 'Scan Barcode'}
                </Button>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            {photo && <img src={photo} alt="Food" className="rounded-md w-full" />}
            {isPending && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      {(photo || analysis) && (
        <CardFooter className="flex gap-4">
          <Button variant="outline" onClick={reset} className="flex-1">
            <X className="mr-2" />
            Reset
          </Button>
          <Button
            onClick={analyzePhoto}
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
        </CardFooter>
      )}
    </Card>
  );
};

export default FoodTracker;
