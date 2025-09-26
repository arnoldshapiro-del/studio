export interface VoiceCommand {
  action: string;
  type: string;
  data?: any;
  confidence: number;
}

export interface CommandPattern {
  keywords: string[];
  action: string;
  type: string;
  parser?: (text: string) => any;
}

// Define command patterns for different activities
const COMMAND_PATTERNS: CommandPattern[] = [
  // Medication commands
  {
    keywords: ['took', 'medication', 'medicine', 'pill', 'morning', 'meds'],
    action: 'log_medication',
    type: 'medication',
    parser: (text: string) => {
      const isMorning = text.toLowerCase().includes('morning') || 
                       text.toLowerCase().includes('am') ||
                       new Date().getHours() < 12;
      return { period: isMorning ? 'morning' : 'evening' };
    }
  },
  {
    keywords: ['evening', 'medication', 'medicine', 'pill', 'night', 'pm'],
    action: 'log_medication',
    type: 'medication',
    parser: () => ({ period: 'evening' })
  },

  // Water commands
  {
    keywords: ['drank', 'water', 'drink', 'hydrated', 'glass'],
    action: 'log_water',
    type: 'water',
    parser: (text: string) => {
      const hour = new Date().getHours();
      let period: 'morning' | 'afternoon' | 'evening';
      
      if (text.toLowerCase().includes('morning')) period = 'morning';
      else if (text.toLowerCase().includes('afternoon')) period = 'afternoon';
      else if (text.toLowerCase().includes('evening') || text.toLowerCase().includes('night')) period = 'evening';
      else if (hour < 12) period = 'morning';
      else if (hour < 18) period = 'afternoon';
      else period = 'evening';
      
      return { period };
    }
  },

  // Workout commands
  {
    keywords: ['workout', 'exercise', 'treadmill', 'ran', 'running', 'walked'],
    action: 'log_workout',
    type: 'workout',
    parser: (text: string) => {
      const isTreadmill = text.toLowerCase().includes('treadmill') || 
                         text.toLowerCase().includes('ran') || 
                         text.toLowerCase().includes('running') ||
                         text.toLowerCase().includes('walked');
      
      // Try to extract duration
      const durationMatch = text.match(/(\d+)\s*(minute|min|hour)/i);
      let duration = 20; // default
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        duration = unit.includes('hour') ? value * 60 : value;
      }
      
      return { 
        type: isTreadmill ? 'treadmill' : 'resistance',
        duration
      };
    }
  },

  // Mood commands
  {
    keywords: ['feeling', 'mood', 'happy', 'sad', 'great', 'good', 'bad', 'awful', 'neutral'],
    action: 'log_mood',
    type: 'mood',
    parser: (text: string) => {
      const moodWords = {
        'great': ['great', 'amazing', 'fantastic', 'excellent', 'wonderful'],
        'good': ['good', 'fine', 'okay', 'alright', 'decent'],
        'neutral': ['neutral', 'meh', 'average', 'normal'],
        'bad': ['bad', 'poor', 'sad', 'down', 'low'],
        'awful': ['awful', 'terrible', 'horrible', 'devastating', 'depressed']
      };
      
      const lowerText = text.toLowerCase();
      for (const [mood, words] of Object.entries(moodWords)) {
        if (words.some(word => lowerText.includes(word))) {
          return { mood };
        }
      }
      
      return { mood: 'neutral' };
    }
  },

  // Food commands
  {
    keywords: ['ate', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'snack'],
    action: 'log_food_intent',
    type: 'food',
    parser: (text: string) => {
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const lowerText = text.toLowerCase();
      
      const mealType = mealTypes.find(meal => lowerText.includes(meal));
      const hour = new Date().getHours();
      
      let detectedMeal = mealType;
      if (!detectedMeal) {
        if (hour < 10) detectedMeal = 'breakfast';
        else if (hour < 15) detectedMeal = 'lunch';
        else if (hour < 20) detectedMeal = 'dinner';
        else detectedMeal = 'snack';
      }
      
      return { mealType: detectedMeal };
    }
  },

  // Injection commands
  {
    keywords: ['injection', 'shot', 'injected', 'needle'],
    action: 'log_injection',
    type: 'injection',
    parser: (text: string) => {
      const sites = ['abdomen', 'thigh', 'arm'];
      const lowerText = text.toLowerCase();
      const site = sites.find(s => lowerText.includes(s)) || 'abdomen';
      const side = lowerText.includes('left') ? 'left' : 'right';
      
      return { site: `${site} ${side}` };
    }
  }
];

export function parseVoiceCommand(transcript: string, confidence: number): VoiceCommand | null {
  const lowerText = transcript.toLowerCase().trim();
  
  for (const pattern of COMMAND_PATTERNS) {
    const matchCount = pattern.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
    
    // Require at least 2 keyword matches or specific single keywords
    const threshold = pattern.keywords.length > 3 ? 2 : 1;
    
    if (matchCount >= threshold) {
      const data = pattern.parser ? pattern.parser(transcript) : {};
      
      return {
        action: pattern.action,
        type: pattern.type,
        data,
        confidence: confidence * (matchCount / pattern.keywords.length)
      };
    }
  }
  
  return null;
}

// Text-to-speech for audio feedback
export function speakFeedback(message: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Use a more natural voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  }
}

// Get contextual prompts for better voice recognition
export function getVoicePrompts(activityType?: string): string[] {
  const prompts: Record<string, string[]> = {
    medication: [
      "Say: 'I took my morning medication'",
      "Say: 'Took evening pills'",
      "Say: 'Had my meds this morning'"
    ],
    water: [
      "Say: 'I drank water'",
      "Say: 'Had a glass of water this morning'",
      "Say: 'Drank water in the afternoon'"
    ],
    workout: [
      "Say: 'Did a 20 minute treadmill workout'",
      "Say: 'Finished resistance training'",
      "Say: 'Ran for 30 minutes'"
    ],
    mood: [
      "Say: 'I'm feeling great today'",
      "Say: 'Mood is good'",
      "Say: 'Feeling a bit down'"
    ],
    food: [
      "Say: 'I ate breakfast'",
      "Say: 'Had lunch today'",
      "Say: 'Ate a snack'"
    ]
  };
  
  return activityType ? prompts[activityType] || [] : [
    "Try saying something like:",
    "'I took my medication'",
    "'I drank water'", 
    "'Did a workout'",
    "'I'm feeling good'"
  ];
}