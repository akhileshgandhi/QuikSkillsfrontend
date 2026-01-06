import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, SkipBack, WifiOff } from 'lucide-react';
import api from '../../utils/api';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';

interface VideoPlayerWithProgressProps {
  videoUrl: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onProgressUpdate?: (watchedPercentage: number) => void;
  onComplete?: () => void;
  initialPosition?: number; // Resume from this position (in seconds)
}

const VideoPlayerWithProgress: React.FC<VideoPlayerWithProgressProps> = ({
  videoUrl,
  courseId,
  lessonId,
  lessonTitle,
  onProgressUpdate,
  onComplete,
  initialPosition = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const { isOnline } = useOfflineDetection();

  // Load saved position on mount
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
      setCurrentTime(initialPosition);
    }
  }, [initialPosition]);

  // Update duration when video metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
        setCurrentTime(initialPosition);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [initialPosition]);

  // Pause video when offline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isOnline && isPlaying) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isOnline, isPlaying]);

  // Track time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration || duration;
      
      setCurrentTime(current);
      
      if (total > 0) {
        const percentage = (current / total) * 100;
        setWatchedPercentage(percentage);
        
        // Call progress update callback only if online
        if (onProgressUpdate && isOnline) {
          onProgressUpdate(percentage);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [duration, onProgressUpdate, isOnline]);

  // Handle video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
      // Mark as 100% complete
      saveProgress(100);
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onComplete]);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    progressSaveInterval.current = setInterval(() => {
      if (videoRef.current && watchedPercentage > 0) {
        saveProgress(watchedPercentage);
      }
    }, 10000); // Save every 10 seconds

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [watchedPercentage]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && watchedPercentage > 0) {
        saveProgress(watchedPercentage);
      }
    };
  }, [watchedPercentage]);

  // Save progress to backend
  const saveProgress = useCallback(async (percentage: number) => {
    try {
      const video = videoRef.current;
      if (!video) return;

      await api.post('/progress', {
        courseId,
        lessonId,
        currentPosition: video.currentTime,
        duration: video.duration,
        completionPercentage: percentage,
        status: percentage >= 95 ? 'in_progress' : 'in_progress', // 95% unlocks quiz
      });
    } catch (error) {
      console.error('Failed to save video progress:', error);
    }
  }, [courseId, lessonId]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current && watchedPercentage > 0) {
        saveProgress(watchedPercentage);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [watchedPercentage, saveProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, video.duration);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-xl">
      {/* Video Element */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 Aspect Ratio */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute top-0 left-0 w-full h-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
        />

        {/* Buffering Indicator */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <WifiOff className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">Connection Lost</p>
              <p className="text-gray-300">
                Progress will sync once you are back online.
              </p>
            </div>
          </div>
        )}

        {/* Progress Overlay */}
        {watchedPercentage >= 95 && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Ready for Quiz
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span className="font-medium text-white">
              {watchedPercentage.toFixed(1)}% watched
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={skipBackward}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={skipForward}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{lessonTitle}</span>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerWithProgress;

