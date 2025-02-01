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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();
  const audioContext = useRef<AudioContext | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [mediaRecorder]);

  const setupAudioAnalysis = (stream: MediaStream) => {
    audioContext.current = new AudioContext();
    analyserNode.current = audioContext.current.createAnalyser();
    source.current = audioContext.current.createMediaStreamSource(stream);
    source.current.connect(analyserNode.current);
    
    // Set up audio analysis
    analyserNode.current.fftSize = 2048;
    const bufferLength = analyserNode.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Monitor audio levels
    const checkAudioLevel = () => {
      if (!isRecording || !analyserNode.current) return;
      
      analyserNode.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      if (average > 0) {
        console.log("Voice detected:", average);
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setupAudioAnalysis(stream);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
          console.log("Audio chunk received:", event.data.size, "bytes");
        }
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log("Recording stopped. Audio blob size:", audioBlob.size, "bytes");
        
        // For now, we'll still use the simulation
        // In a real implementation, you would send the audioBlob to a speech-to-text service
        setTimeout(() => {
          const simulatedTranscript = "This is a simulated transcript of the recorded audio.";
          setTranscript(simulatedTranscript);
          setIsProcessing(false);
          
          onNewMessage({
            type: "user",
            content: simulatedTranscript,
            timestamp: new Date().toLocaleTimeString(),
          });
          
          setAudioChunks([]);
        }, 2000);
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
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setIsRecording(false);
        
        // Clean up audio analysis
        if (source.current) {
          source.current.disconnect();
        }
        if (audioContext.current) {
          audioContext.current.close();
        }
      }
    } else {
      if (!mediaRecorder) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
      }
      
      if (mediaRecorder && mediaRecorder.state === "inactive") {
        setAudioChunks([]);
        setIsRecording(true);
        mediaRecorder.start(1000);
        console.log("Started recording");
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
