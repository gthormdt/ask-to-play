import { useEffect, useRef } from "react";
import YouTube from "react-youtube";

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const getVideoId = (url: string) => {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get("v") || url.split("/").pop() || "";
  };

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      <YouTube
        videoId={getVideoId(url)}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
        }}
        className="absolute inset-0"
      />
    </div>
  );
};

export default VideoPlayer;