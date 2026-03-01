import { useCallback, useEffect, useState } from 'react';
import { FileDropZone } from './components/FileDropZone';
import { Toolbar } from './components/Toolbar';
import { ImageViewer } from './components/ImageViewer';
import { NavigationControls } from './components/NavigationControls';
import { ZoomControls } from './components/ZoomControls';
import { useImageList } from './hooks/useImageList';
import { useZoom } from './hooks/useZoom';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useImageLoader } from './hooks/useImageLoader';
import './styles/App.css';

function App() {
  const { images, currentIndex, currentImage, setImages, nextImage, prevImage, hasImages } = useImageList();
  const { scale, position, zoomIn, zoomOut, resetZoom, zoomAtPoint, setPosition } = useZoom();
  const { loadedImageUrl, isLoading, error } = useImageLoader(currentImage);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 0, posY: 0 });

  // Prevent default drag and drop behavior on document level
  // This is necessary for Electron apps to allow custom drop zones
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent the browser from opening dragged files
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const handleOpenFile = useCallback(async () => {
    console.log('handleOpenFile called');
    const result = await window.electronAPI.openFile();
    console.log('openFile result:', result);
    if (result) {
      const { filePath, images: imageList } = result;
      console.log('File path:', filePath);
      console.log('Image list:', imageList);
      console.log('Image list length:', imageList.length);
      const index = imageList.indexOf(filePath);
      console.log('Selected index:', index);
      setImages(imageList, index !== -1 ? index : 0);
      resetZoom();
    }
  }, [setImages, resetZoom]);

  const handleOpenFolder = useCallback(async () => {
    const result = await window.electronAPI.openFolder();
    if (result && result.images.length > 0) {
      setImages(result.images, 0);
      resetZoom();
    }
  }, [setImages, resetZoom]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!loadedImageUrl) return;

      e.preventDefault();
      const containerRect = e.currentTarget.getBoundingClientRect();
      zoomAtPoint(e.deltaY, e.clientX, e.clientY, containerRect);
    },
    [loadedImageUrl, zoomAtPoint]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!loadedImageUrl) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      });
    },
    [loadedImageUrl, position]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!loadedImageUrl) return;
      resetZoom();
    },
    [loadedImageUrl, resetZoom]
  );

  // Handle drag movement
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      const newX = dragStart.posX + deltaX;
      const newY = dragStart.posY + deltaY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, setPosition]);

  const handleDrop = useCallback(
    async (path: string, isDirectory: boolean) => {
      console.log('[App] handleDrop called', { path, isDirectory });
      resetZoom();

      if (isDirectory) {
        console.log('[App] Processing directory drop');
        const imageList = await window.electronAPI.getImagesInFolder(path);
        console.log('[App] Images in folder:', imageList.length, imageList);
        if (imageList.length > 0) {
          setImages(imageList, 0);
          console.log('[App] Images set successfully');
        } else {
          console.warn('[App] No images found in directory');
        }
      } else {
        console.log('[App] Processing file drop');
        // Get folder containing the file - support both / and \
        const separator = path.includes('/') ? '/' : '\\';
        const lastSeparatorIndex = path.lastIndexOf(separator);
        console.log('[App] Path separator:', separator, 'lastIndex:', lastSeparatorIndex);

        if (lastSeparatorIndex === -1) {
          console.error('[App] Could not find path separator in:', path);
          return;
        }

        const folderPath = path.substring(0, lastSeparatorIndex);
        console.log('[App] Folder path:', folderPath);

        const imageList = await window.electronAPI.getImagesInFolder(folderPath);
        console.log('[App] Images in folder:', imageList.length, imageList);

        if (imageList.length > 0) {
          const index = imageList.indexOf(path);
          console.log('[App] File index in list:', index);
          setImages(imageList, index !== -1 ? index : 0);
          console.log('[App] Images set successfully');
        } else {
          console.warn('[App] No images found in directory');
        }
      }
    },
    [setImages, resetZoom]
  );

  useKeyboardShortcuts({
    onNext: nextImage,
    onPrev: prevImage,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onZoomReset: resetZoom,
    onOpenFile: handleOpenFile,
    onOpenFolder: handleOpenFolder,
  });

  const currentFileName = currentImage ? currentImage.split('\\').pop() || currentImage : null;

  return (
    <FileDropZone onDrop={handleDrop}>
      <div className="app">
        <Toolbar
          currentFileName={currentFileName}
          currentIndex={currentIndex}
          totalImages={images.length}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
        />
        <ImageViewer
          imageSrc={loadedImageUrl}
          scale={scale}
          position={position}
          isLoading={isLoading}
          error={error}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          isDragging={isDragging}
        />
        <div className="bottom-controls">
          <NavigationControls onPrev={prevImage} onNext={nextImage} hasImages={hasImages} />
          <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
        </div>
      </div>
    </FileDropZone>
  );
}

export default App;
