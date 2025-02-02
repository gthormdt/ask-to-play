import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptResult = event.results[current][0].transcript;
        console.log("Transcript received:", transcriptResult);
        
        const isFinal = event.results[current].isFinal;
        
        if (isFinal) {
          setTranscript(transcriptResult);
          console.log("Final transcript:", transcriptResult);
        } else {
          // Show interim results
          setTranscript(transcriptResult);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast({
          title: "Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsRecording(false);
        
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
          toast({
            title: "No Speech Detected",
            description: "I didn't hear anything. Try speaking louder or check your mic settings.",
            variant: "destructive",
          });
        }
      };
    }

    return () => {
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
      <div className="flex items-center gap-4">
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