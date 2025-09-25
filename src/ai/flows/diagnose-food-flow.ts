
'use server';

/**
 * @fileOverview A food diagnosis AI agent.
 *
 * - diagnoseFood - A function that handles the food diagnosis process.
 * - DiagnoseFoodInput - The input type for the diagnoseFood function.
 * - DiagnoseFoodOutput - The return type for the diagnoseFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseFoodInputSchema = z.object({
  photoDataUri: z.string().describe(
    "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type DiagnoseFoodInput = z.infer<typeof DiagnoseFoodInputSchema>;

const FoodItemSchema = z.object({
    name: z.string().describe('The common name of the food item.'),
    calories: z.number().describe('Estimated calories for the portion shown.'),
    protein: z.number().describe('Estimated protein in grams.'),
    carbs: z.number().describe('Estimated carbohydrates in grams.'),
    fat: z.number().describe('Estimated fat in grams.'),
    fiber: z.number().describe('Estimated fiber in grams.'),
    sodium: z.number().describe('Estimated sodium in milligrams.'),
});

const DiagnoseFoodOutputSchema = z.object({
  items: z.array(FoodItemSchema).describe('An array of food items identified in the photo.'),
  total: z.object({
    calories: z.number().describe('Total estimated calories for the meal.'),
    protein: z.number().describe('Total estimated protein in grams.'),
    carbs: z.number().describe('Total estimated carbohydrates in grams.'),
    fat: z.number().describe('Total estimated fat in grams.'),
  }).describe('The total nutritional information for the entire meal.'),
});
export type DiagnoseFoodOutput = z.infer<typeof DiagnoseFoodOutputSchema>;

export async function diagnoseFood(input: DiagnoseFoodInput): Promise<DiagnoseFoodOutput> {
  return diagnoseFoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseFoodPrompt',
  input: { schema: DiagnoseFoodInputSchema },
  output: { schema: DiagnoseFoodOutputSchema },
  prompt: `You are an expert nutritionist. Analyze the provided photo of a meal.
  
  Identify each food item in the image, estimate its portion size, and provide a detailed nutritional breakdown (calories, protein, carbs, fat, fiber, sodium).
  
  Return the analysis as a structured object containing a list of all identified items and a summary of the total nutritional values for the meal.

  Photo: {{media url=photoDataUri}}`,
});

const diagnoseFoodFlow = ai.defineFlow(
  {
    name: 'diagnoseFoodFlow',
    inputSchema: DiagnoseFoodInputSchema,
    outputSchema: DiagnoseFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
