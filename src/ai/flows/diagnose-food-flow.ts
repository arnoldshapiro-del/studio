
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
  photoDataUri: z.string().optional().describe(
    "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  barcode: z.string().optional().describe(
    "The barcode data from a scanned food item."
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
  items: z.array(FoodItemSchema).describe('An array of food items identified in the photo or from the barcode.'),
  total: z.object({
    calories: z
      .number()
      .describe('Total estimated calories for the meal.'),
    protein: z.number().describe('Total estimated protein in grams.'),
    carbs: z
      .number()
      .describe('Total estimated carbohydrates in grams.'),
    fat: z.number().describe('Total estimated fat in grams.'),
  }).describe('The total nutritional information for the entire meal.'),
});
export type DiagnoseFoodOutput = z.infer<typeof DiagnoseFoodOutputSchema>;

export async function diagnoseFood(input: DiagnoseFoodInput): Promise<DiagnoseFoodOutput> {
  return diagnoseFoodFlow(input);
}


// Mock database for barcode lookup
const barcodeDatabase: Record<string, z.infer<typeof FoodItemSchema>> = {
  '0123456789012': {
    name: 'Protein Bar',
    calories: 210,
    protein: 20,
    carbs: 22,
    fat: 9,
    fiber: 1,
    sodium: 180,
  },
  '9876543210987': {
    name: 'Greek Yogurt',
    calories: 100,
    protein: 18,
    carbs: 6,
    fat: 0,
    fiber: 0,
    sodium: 65,
  },
};

const lookupBarcode = ai.defineTool(
  {
    name: 'lookupBarcode',
    description: 'Looks up a food item by its barcode.',
    inputSchema: z.object({ barcode: z.string() }),
    outputSchema: FoodItemSchema.optional(),
  },
  async (input) => {
    console.log(`Looking up barcode: ${input.barcode}`);
    return barcodeDatabase[input.barcode];
  }
);


const prompt = ai.definePrompt({
  name: 'diagnoseFoodPrompt',
  input: { schema: DiagnoseFoodInputSchema },
  output: { schema: DiagnoseFoodOutputSchema },
  tools: [lookupBarcode],
  prompt: `You are an expert nutritionist. 
  
  If a barcode is provided, use the lookupBarcode tool to get the nutritional information.
  
  If a photo is provided, analyze the photo of the meal. Identify each food item, estimate its portion size, and provide a detailed nutritional breakdown (calories, protein, carbs, fat, fiber, sodium).
  
  Return the analysis as a structured object containing a list of all identified items and a summary of the total nutritional values for the meal.

  If you use the lookupBarcode tool and it returns a result, you must use that result to populate the 'items' and 'total' fields of your response. Do not hallucinate data if the barcode lookup is successful. The 'total' should just be the values from the single item.

  {{#if barcode}}Barcode: {{{barcode}}}{{#if}}
  {{#if photoDataUri}}Photo: {{media url=photoDataUri}}{{/if}}
  `,
});

const diagnoseFoodFlow = ai.defineFlow(
  {
    name: 'diagnoseFoodFlow',
    inputSchema: DiagnoseFoodInputSchema,
    outputSchema: DiagnoseFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error('AI failed to return valid analysis.');
    }

    if(input.barcode && output.items.length === 0) {
        // Handle the case where the LLM might not call the tool correctly or returns empty.
        const toolResult = await lookupBarcode({barcode: input.barcode});
        if(toolResult) {
            output.items = [toolResult];
            output.total = {
                calories: toolResult.calories,
                protein: toolResult.protein,
                carbs: toolResult.carbs,
                fat: toolResult.fat
            };
        }
    }
    
    return output;
  }
);
