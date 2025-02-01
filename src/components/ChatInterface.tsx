import { useState, useEffect } from "react";
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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup function to stop recording when component unmounts
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Here you would typically send the audio data to a speech-to-text service
          // For now, we'll simulate a response
          setIsProcessing(true);
          setTimeout(() => {
            setTranscript("This is a simulated transcript of the recorded audio.");
            setIsProcessing(false);
            setIsRecording(false);
            
            // Add the transcribed message to chat
            onNewMessage({
              type: "user",
              content: "This is a simulated transcript of the recorded audio.",
              timestamp: new Date().toLocaleTimeString(),
            });
          }, 2000);
        }
      };

      setMediaRecorder(recorder);
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to use voice recording.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRecordClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      if (!mediaRecorder) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
      }
      
      if (mediaRecorder && mediaRecorder.state === "inactive") {
        setIsRecording(true);
        mediaRecorder.start();
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
          {transcript && isProcessing && (
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
              ? "bg-red-500 hover:bg-red-600 animate-pulse-record"
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