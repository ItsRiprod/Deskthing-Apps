import { useEffect, useState } from 'react';
import { useColorCache } from '../stores/colorCacheStore';

const processingQueue = new Map<string, Promise<string>>();

export const getAverageColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Use small canvas for performance
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('rgb(54, 57, 63)');
          return;
        }
        
        canvas.width = 8;
        canvas.height = 8;
        
        ctx.drawImage(img, 0, 0, 8, 8);
        const imageData = ctx.getImageData(0, 0, 8, 8);
        
        let r = 0, g = 0, b = 0;
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        
        const pixelCount = data.length / 4;
        const color = `rgb(${Math.floor(r / pixelCount)}, ${Math.floor(g / pixelCount)}, ${Math.floor(b / pixelCount)})`;
        
        resolve(color);
      } catch (error) {
        resolve('rgb(54, 57, 63)');
      }
    };
    
    img.onerror = () => resolve('rgb(54, 57, 63)');
    img.src = imageUrl;
  });
};

export const getCachedAverageColor = async (imageUrl: string): Promise<string> => {
  const { getColor, setColor } = useColorCache.getState();
  
  // Check cache first
  const cachedColor = getColor(imageUrl);
  if (cachedColor) {
    return cachedColor;
  }
  
  // Prevent duplicate processing
  if (processingQueue.has(imageUrl)) {
    return processingQueue.get(imageUrl)!;
  }
  
  const promise = getAverageColor(imageUrl).then(color => {
    setColor(imageUrl, color);
    return color;
  }).finally(() => {
    processingQueue.delete(imageUrl);
  });
  
  processingQueue.set(imageUrl, promise);
  return promise;
};

// Hook for reactive color updates
export const useProfileColor = (imageUrl: string | null) => {
  const getColor = useColorCache(state => state.getColor);
  const setColor = useColorCache(state => state.setColor);
  
  const [color, setCurrentColor] = useState('rgb(54, 57, 63)');
  
  useEffect(() => {
    if (!imageUrl) {
      setCurrentColor('rgb(54, 57, 63)');
      return;
    }
    
    // Check cache immediately
    const cachedColor = getColor(imageUrl);
    if (cachedColor) {
      setCurrentColor(cachedColor);
      return;
    }
    
    // Process in background
    getCachedAverageColor(imageUrl).then(newColor => {
      setCurrentColor(newColor);
      setColor(imageUrl, newColor); // update the cache with the new color
    });
  }, [imageUrl, getColor]);
  
  return color;
};
