import { useMemo } from 'react';

/**
 * Calculate processing time based on file count
 * 1 file = 1 minute
 * Each additional file = +30 seconds
 * Max = 5 minutes (9+ files)
 */
export const useProcessingTime = (fileCount: number): number => {
  return useMemo(() => {
    if (fileCount <= 0) return 0;
    if (fileCount === 1) return 60; // 1 minute
    if (fileCount >= 9) return 300; // 5 minutes max
    
    // 1 file = 60s, each additional = +30s
    // 2 files = 90s, 3 files = 120s, etc.
    return 60 + (fileCount - 1) * 30;
  }, [fileCount]);
};

/**
 * Format seconds into MM:SS display
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate expected ad impressions based on processing time
 * Ads refresh every 30 seconds
 */
export const calculateExpectedImpressions = (processingTimeSeconds: number): number => {
  return Math.ceil(processingTimeSeconds / 30);
};

export default useProcessingTime;
