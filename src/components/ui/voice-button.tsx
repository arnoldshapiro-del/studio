'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { parseVoiceCommand, speakFeedback, getVoicePrompts, VoiceCommand } from '@/lib/voice-commands';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface VoiceButtonProps {
  onCommand: (command: VoiceCommand) => void;
  activityType?: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function VoiceButton({ 
  onCommand, 
  activityType, 
  disabled = false,
  size = 'default',
  variant = 'outline',
  className = ''
}: VoiceButtonProps) {
  const { toast } = useToast();
  const {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceInput();

  const [showPrompts, setShowPrompts] = useState(false);
  const prompts = getVoicePrompts(activityType);

  useEffect(() => {
    if (transcript && !isListening) {
      const command = parseVoiceCommand(transcript, confidence);
      
      if (command) {
        // Check if command matches expected activity type
        if (activityType && command.type !== activityType) {
          toast({
            variant: 'destructive',
            title: 'Command Mismatch',
            description: `Expected ${activityType} command, but detected ${command.type}. Try again.`,
          });
          resetTranscript();
          return;
        }

        // Execute command
        onCommand(command);
        speakFeedback(`Got it! Logging your ${command.type}.`);
        
        toast({
          title: 'Voice Command Processed',
          description: `"${transcript}" - ${command.action}`,
        });
        
        resetTranscript();
      } else {
        toast({
          variant: 'destructive',
          title: 'Command Not Recognized',
          description: `Could not understand: "${transcript}". Try rephrasing.`,
        });
        resetTranscript();
      }
    }
  }, [transcript, isListening, confidence, activityType, onCommand, toast, resetTranscript]);

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Voice Recognition Error',
        description: error,
      });
    }
  }, [error, toast]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={size}
              disabled={true}
              className={`opacity-50 ${className}`}
            >
              <MicOff className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? 'default' : variant}
              size={size}
              onClick={handleVoiceToggle}
              disabled={disabled}
              className={`transition-all duration-200 ${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''} ${className}`}
            >
              {isListening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? 'Listening... Click to stop' : 'Click to start voice input'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {prompts.length > 0 && (
        <Popover open={showPrompts} onOpenChange={setShowPrompts}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs px-2 py-1 h-auto"
              onClick={() => setShowPrompts(!showPrompts)}
            >
              ?
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Voice Commands</h4>
              <div className="space-y-1">
                {prompts.map((prompt, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {prompt}
                  </p>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default VoiceButton;