import { useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import ChatInterface from "../components/ChatInterface";
import VideoInput from "../components/VideoInput";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [messages, setMessages] = useState<Array<{ type: "user" | "assistant"; content: string; timestamp?: string }>>([]);

  const handleVideoSubmit = (url: string) => {
    setVideoUrl(url);
  };

  const handleNewMessage = (message: { type: "user" | "assistant"; content: string; timestamp?: string }) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {!videoUrl ? (
          <VideoInput onSubmit={handleVideoSubmit} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <VideoPlayer url={videoUrl} />
            </div>
            <div>
              <ChatInterface messages={messages} onNewMessage={handleNewMessage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;