import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YoutubeIcon } from "lucide-react";

interface VideoInputProps {
  onSubmit: (url: string) => void;
}

const VideoInput = ({ onSubmit }: VideoInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
      <div className="text-center space-y-4">
        <YoutubeIcon className="w-16 h-16 text-red-500 mx-auto" />
        <h1 className="text-4xl font-bold">Video Q&A Assistant</h1>
        <p className="text-lg text-gray-400">Paste a YouTube video URL to get started</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
        <Input
          type="text"
          placeholder="Enter YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-secondary/50 border-secondary-foreground/20"
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Load Video
        </Button>
      </form>
    </div>
  );
};

export default VideoInput;