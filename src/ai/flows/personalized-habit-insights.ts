
'use server';

/**
 * @fileOverview Analyzes historical tracking data to provide personalized insights into user habits and trends.
 *
 * - generatePersonalizedInsights - A function that generates personalized insights based on user data.
 * - PersonalizedHabitInsightsInput - The input type for the generatePersonalizedInsights function.
 * - PersonalizedHabitInsightsOutput - The return type for the generatePersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedHabitInsightsInputSchema = z.object({
  medicationData: z.string().describe('Historical data on medication intake.'),
  waterIntakeData: z.string().describe('Historical data on water intake.'),
  workoutData: z.string().describe('Historical data on workout routines.'),
  moodData: z.string().describe('Historical data on mood, including mood ratings and notes.'),
  stressData: z.string().describe('Historical data on stress levels.'),
});
export type PersonalizedHabitInsightsInput = z.infer<
  typeof PersonalizedHabitInsightsInputSchema
>;

const PersonalizedHabitInsightsOutputSchema = z.object({
  insights: z
    .string()
    .describe(
      'Personalized insights into the user habits and trends based on the provided data. Provide at least 3 insights in markdown format.'
    ),
});
export type PersonalizedHabitInsightsOutput = z.infer<
  typeof PersonalizedHabitInsightsOutputSchema
>;

export async function generatePersonalizedInsights(
  input: PersonalizedHabitInsightsInput
): Promise<PersonalizedHabitInsightsOutput> {
  return personalizedHabitInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedHabitInsightsPrompt',
  input: {schema: PersonalizedHabitInsightsInputSchema},
  output: {schema: PersonalizedHabitInsightsOutputSchema},
  prompt: `You are an AI health assistant that analyzes user data to provide personalized insights.

  Analyze the following data and provide insights into the user's habits and trends. Suggest areas for improvement.
  Look for multi-factor correlations between activities, like how workouts and stress levels impact mood. For example: "I noticed your mood is often 'Great' on days you complete a resistance workout and your stress level is low."
  Provide at least 3 distinct insights in a friendly and encouraging tone. Format your response as a markdown list.

  Medication Data: {{{medicationData}}}
  Water Intake Data: {{{waterIntakeData}}}
  Workout Data: {{{workoutData}}}
  Mood Data: {{{moodData}}}
  Stress Data: {{{stressData}}}`,
});

const personalizedHabitInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedHabitInsightsFlow',
    inputSchema: PersonalizedHabitInsightsInputSchema,
    outputSchema: PersonalizedHabitInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
