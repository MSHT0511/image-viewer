import { useState, useEffect } from 'react';

export function useImageLoader(imagePath: string | null) {
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setLoadedImageUrl(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        console.log('🖼️ [useImageLoader] Loading image:', imagePath);
        const ext = imagePath.toLowerCase().split('.').pop();
        console.log('🖼️ [useImageLoader] File extension:', ext);

        // For all formats, read via main process
        const dataUrl = await window.electronAPI.readImageFile(imagePath);
        console.log('✅ [useImageLoader] Image loaded successfully, data URL length:', dataUrl.length);

        if (!isCancelled) {
          setLoadedImageUrl(dataUrl);
        }
      } catch (err) {
        console.error('❌ [useImageLoader] Error loading image:', err);
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setLoadedImageUrl(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [imagePath]);

  return { loadedImageUrl, isLoading, error };
}
