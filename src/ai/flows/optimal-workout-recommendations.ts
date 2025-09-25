// src/ai/flows/optimal-workout-recommendations.ts
'use server';

/**
 * @fileOverview Recommends optimal workout times and durations based on user's recorded routines and preferences.
 *
 * - getOptimalWorkoutRecommendations - A function that provides workout recommendations.
 * - OptimalWorkoutRecommendationsInput - The input type for the getOptimalWorkoutRecommendations function.
 * - OptimalWorkoutRecommendationsOutput - The return type for the getOptimalWorkoutRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimalWorkoutRecommendationsInputSchema = z.object({
  userRoutineData: z.string().describe('The user historical workout routine data, including times, durations, and days of the week.'),
  userPreferences: z.string().describe('The user preferences regarding workout types and intensity.'),
});
export type OptimalWorkoutRecommendationsInput = z.infer<typeof OptimalWorkoutRecommendationsInputSchema>;

const OptimalWorkoutRecommendationsOutputSchema = z.object({
  recommendedSchedule: z.string().describe('A suggested workout schedule with specific times and durations for each workout session.'),
  justification: z.string().describe('Explanation of why the schedule is optimal based on the user data and preferences.'),
});
export type OptimalWorkoutRecommendationsOutput = z.infer<typeof OptimalWorkoutRecommendationsOutputSchema>;

export async function getOptimalWorkoutRecommendations(input: OptimalWorkoutRecommendationsInput): Promise<OptimalWorkoutRecommendationsOutput> {
  return optimalWorkoutRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimalWorkoutRecommendationsPrompt',
  input: {
    schema: OptimalWorkoutRecommendationsInputSchema,
  },
  output: {
    schema: OptimalWorkoutRecommendationsOutputSchema,
  },
  prompt: `You are a personal trainer providing workout recommendations based on user data.

  Analyze the user's historical workout routine data and preferences to suggest an optimal workout schedule.
  Consider factors like workout times, durations, days of the week, workout types, and intensity.

  User Routine Data: {{{userRoutineData}}}
  User Preferences: {{{userPreferences}}}

  Provide a recommended workout schedule with specific times and durations for each workout session.
  Also, explain why this schedule is optimal based on the user's data and preferences.
  `,
});

const optimalWorkoutRecommendationsFlow = ai.defineFlow(
  {
    name: 'optimalWorkoutRecommendationsFlow',
    inputSchema: OptimalWorkoutRecommendationsInputSchema,
    outputSchema: OptimalWorkoutRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
