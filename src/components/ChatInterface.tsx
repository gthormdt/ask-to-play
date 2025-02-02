import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Message {
  type: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onNewMessage: (message: Message) => void;
}

const ChatInterface = ({ messages, onNewMessage }: ChatInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingProgress, setRecordingProgress] = useState(0);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechRef = useRef<number>(Date.now());

  const MAX_RECORDING_TIME = 30000; // 30 seconds maximum recording time
  const SILENCE_TIMEOUT = 5000; // 5 seconds of silence before stopping

  const resetRecording = () => {
    setIsRecording(false);
    setRecordingProgress(0);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  };

  const startRecordingTimer = () => {
    let startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / MAX_RECORDING_TIME) * 100, 100);
      setRecordingProgress(progress);

      if (progress < 100 && isRecording) {
        requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsRecording(true);
        startRecordingTimer();
        
        // Set maximum recording time
        recordingTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, MAX_RECORDING_TIME);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcriptResult = event.results[current][0].transcript;
        console.log("Transcript received:", transcriptResult);
        
        lastSpeechRef.current = Date.now();
        
        // Reset silence timeout since we received speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Set new silence timeout
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            console.log("Silence timeout - stopping recording");
            recognitionRef.current.stop();
          }
        }, SILENCE_TIMEOUT);
        
        const isFinal = event.results[current].isFinal;
        
        if (isFinal) {
          setTranscript(transcriptResult);
          console.log("Final transcript:", transcriptResult);
        } else {
          // Show interim results
          setTranscript(transcriptResult);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
        resetRecording();
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        resetRecording();
        
        // Only process if we have a transcript
        if (transcript) {
          setIsProcessing(true);
          // Add the message to chat
          onNewMessage({
            type: "user",
            content: transcript,
            timestamp: new Date().toLocaleTimeString(),
          });
          setIsProcessing(false);
          setTranscript("");
        } else {
          const timeSinceLastSpeech = Date.now() - lastSpeechRef.current;
          if (timeSinceLastSpeech > SILENCE_TIMEOUT) {
            toast({
              title: "No Speech Detected",
              description: "I didn't hear anything. Try speaking louder or check your mic settings.",
              variant: "destructive",
            });
          }
        }
      };
    }

    return () => {
      resetRecording();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, transcript, onNewMessage]);

  const handleRecordClick = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access to use voice recording.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="h-[600px] bg-secondary/50 rounded-lg p-4 flex flex-col">
      <ScrollArea className="flex-grow mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.type === "user"
                  ? "bg-primary/20 ml-auto max-w-[80%]"
                  : "bg-muted mr-auto max-w-[80%]"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.timestamp && (
                <span className="text-xs text-gray-400 mt-1 block">
                  {message.timestamp}
                </span>
              )}
            </div>
          ))}
          {transcript && (
            <div className="bg-primary/10 p-3 rounded-lg ml-auto max-w-[80%]">
              <p className="text-sm opacity-70">{transcript}</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="space-y-2">
        {isRecording && (
          <Progress value={recordingProgress} className="h-1" />
        )}
        <Button
          onClick={handleRecordClick}
          className={`w-full ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-primary hover:bg-primary/90"
          }`}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <Mic className="w-4 h-4 mr-2 animate-pulse" />
              Recording...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Ask a Question
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;