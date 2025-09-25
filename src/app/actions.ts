
'use server';

import {
  generatePersonalizedInsights,
  PersonalizedHabitInsightsInput,
} from '@/ai/flows/personalized-habit-insights';
import {
  getOptimalWorkoutRecommendations,
  OptimalWorkoutRecommendationsInput,
} from '@/ai/flows/optimal-workout-recommendations';


export async function getInsightsAction(
  input: PersonalizedHabitInsightsInput
): Promise<string> {
  try {
    const result = await generatePersonalizedInsights(input);
    return result.insights;
  } catch (error) {
    console.error(error);
    return 'Sorry, I was unable to generate insights at this time.';
  }
}

export async function getRecommendationsAction(
  input: OptimalWorkoutRecommendationsInput
): Promise<{ recommendedSchedule: string; justification: string } | string> {
  try {
    const result = await getOptimalWorkoutRecommendations(input);
    return result;
  } catch (error) {
    console.error(error);
    return 'Sorry, I was unable to generate recommendations at this time.';
  }
}
