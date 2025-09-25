
import { NextResponse } from 'next/server';
import { diagnoseFood, DiagnoseFoodInput, DiagnoseFoodOutput } from '@/ai/flows/diagnose-food-flow';

export async function POST(request: Request) {
  try {
    const input: DiagnoseFoodInput = await request.json();

    if (!input.photoDataUri && !input.barcode) {
      return NextResponse.json({ error: 'Either photoDataUri or barcode must be provided.' }, { status: 400 });
    }

    const result: DiagnoseFoodOutput = await diagnoseFood(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in diagnose-food API route:', error);
    let errorMessage = 'An unknown error occurred during food analysis.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Sorry, I was unable to analyze the food at this time.', details: errorMessage }, { status: 500 });
  }
}
