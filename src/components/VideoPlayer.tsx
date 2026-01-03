import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Youtube } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo' | 'direct'>('direct');

  useEffect(() => {
    // Parse YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    
    if (youtubeMatch) {
      setVideoId(youtubeMatch[1]);
      setVideoType('youtube');
      return;
    }

    // Parse Vimeo URL
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    
    if (vimeoMatch) {
      setVideoId(vimeoMatch[1]);
      setVideoType('vimeo');
      return;
    }

    // Direct video URL
    setVideoType('direct');
    setVideoId(null);
  }, [videoUrl]);

  const getEmbedUrl = () => {
    if (videoType === 'youtube' && videoId) {
      // Use YouTube embed with our custom controls
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&modestbranding=1&rel=0&controls=1&showinfo=0`;
    }
    if (videoType === 'vimeo' && videoId) {
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
    }
    return videoUrl;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const player = document.getElementById('video-player-container');
      if (player?.requestFullscreen) {
        player.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div id="video-player-container" className="bg-black rounded-lg overflow-hidden relative group">
      {/* Video Container */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {videoType === 'direct' ? (
          <video
            src={videoUrl}
            className="w-full h-full"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="relative w-full h-full">
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title || 'Video Player'}
            />
            {/* Custom overlay badge */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              {videoType === 'youtube' && (
                <div className="flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </div>
              )}
              {videoType === 'vimeo' && <span>Vimeo</span>}
            </div>
          </div>
        )}
      </div>

      {/* Custom Controls Overlay (for direct videos) */}
      {videoType === 'direct' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Video Info */}
      {title && (
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            {videoType === 'youtube' && <Youtube className="w-4 h-4" />}
            <span className="text-sm font-medium">{title}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

