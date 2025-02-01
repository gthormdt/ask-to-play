import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const handleRecordClick = async () => {
    setIsRecording(!isRecording);
    // Voice recording functionality will be implemented later
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
        >
          <Mic className="w-4 h-4 mr-2" />
          {isRecording ? "Recording..." : "Ask a Question"}
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;