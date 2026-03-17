"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimeReturn {
  currentTime: Date;
  isRealtime: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  setTime: (date: Date) => void;
  offsetHours: (hours: number) => void;
  snapToNow: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

export function useTime(): UseTimeReturn {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRealtime, setIsRealtime] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(60); // 60x = 1 min/sec
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time updates
  useEffect(() => {
    if (!isRealtime) return;

    const id = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, [isRealtime]);

  // Playback mode
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && !isRealtime) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          return new Date(prev.getTime() + playbackSpeed * 1000);
        });
      }, 1000 / 30); // 30fps updates
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isRealtime, playbackSpeed]);

  const setTime = useCallback((date: Date) => {
    setCurrentTime(date);
    setIsRealtime(false);
    setIsPlaying(false);
  }, []);

  const offsetHours = useCallback((hours: number) => {
    setCurrentTime((prev) => new Date(prev.getTime() + hours * 3600000));
    setIsRealtime(false);
  }, []);

  const snapToNow = useCallback(() => {
    setCurrentTime(new Date());
    setIsRealtime(true);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsRealtime(false);
    setIsPlaying((prev) => !prev);
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
  }, []);

  return {
    currentTime,
    isRealtime,
    isPlaying,
    playbackSpeed,
    setTime,
    offsetHours,
    snapToNow,
    togglePlay,
    setPlaybackSpeed,
  };
}
