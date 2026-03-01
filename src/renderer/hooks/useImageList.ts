import { useState, useCallback } from 'react';

export function useImageList() {
  const [images, setImagesState] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const setImages = useCallback((newImages: string[], index = 0) => {
    console.log('setImages called with:', { imageCount: newImages.length, index });
    console.log('First image:', newImages[0]);
    setImagesState(newImages);
    setCurrentIndex(Math.max(0, Math.min(index, newImages.length - 1)));
  }, []);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => {
      if (images.length === 0) return 0;
      return (prev + 1) % images.length; // Loop to beginning
    });
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => {
      if (images.length === 0) return 0;
      return (prev - 1 + images.length) % images.length; // Loop to end
    });
  }, [images.length]);

  const currentImage = images[currentIndex] || null;

  console.log('useImageList state:', {
    imageCount: images.length,
    currentIndex,
    currentImage: currentImage ? currentImage.substring(currentImage.lastIndexOf('\\') + 1) : null,
  });

  return {
    images,
    currentIndex,
    currentImage,
    setImages,
    nextImage,
    prevImage,
    hasImages: images.length > 0,
  };
}
