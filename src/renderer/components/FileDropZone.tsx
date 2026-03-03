import { useState, useCallback, DragEvent } from 'react';

// Extend File interface for Electron
interface ElectronFile extends File {
  path?: string;
}

interface FileDropZoneProps {
  children: React.ReactNode;
  onDrop: (path: string, isDirectory: boolean) => void;
}

export function FileDropZone({ children, onDrop }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    console.log('[FileDropZone] dragenter event', {
      hasFiles: e.dataTransfer.items.length > 0,
      types: Array.from(e.dataTransfer.types)
    });
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    console.log('[FileDropZone] setIsDragging(true) called');
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    // console.log('[FileDropZone] dragover event'); // Too noisy, commented out
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    console.log('[FileDropZone] dragleave event', {
      clientX: e.clientX,
      clientY: e.clientY
    });
    e.preventDefault();
    e.stopPropagation();

    // Only hide overlay if actually leaving the drop zone boundaries
    const rect = e.currentTarget.getBoundingClientRect();
    console.log('[FileDropZone] bounds check', {
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      leaving: e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom
    });
    if (
      e.clientX < rect.left || e.clientX >= rect.right ||
      e.clientY < rect.top || e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
      console.log('[FileDropZone] setIsDragging(false) called');
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      console.log('[FileDropZone] drop event', {
        filesLength: e.dataTransfer.files.length,
        items: e.dataTransfer.items.length
      });
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0] as ElectronFile;
        console.log('[FileDropZone] file object', {
          name: file.name,
          size: file.size,
          type: file.type,
          hasPath: 'path' in file,
          path: file.path
        });

        // Use webUtils.getPathForFile() for secure path access in Electron
        let filePath: string | undefined;
        try {
          if (window.electronAPI && window.electronAPI.getPathForFile) {
            filePath = window.electronAPI.getPathForFile(file);
            console.log('[FileDropZone] got path via getPathForFile:', filePath);
            // If getPathForFile returns empty string, use file.path as fallback
            if (!filePath || filePath === '') {
              console.log('[FileDropZone] getPathForFile returned empty, using file.path');
              filePath = file.path;
            }
          } else {
            console.log('[FileDropZone] getPathForFile not available, using file.path');
            filePath = file.path;
          }
        } catch (error) {
          console.error('[FileDropZone] getPathForFile failed:', error);
          // Fallback to file.path if getPathForFile doesn't work
          filePath = file.path;
          console.log('[FileDropZone] using file.path fallback:', filePath);
        }

        if (filePath) {
          console.log('[FileDropZone] calling getFileStats for', filePath);
          // Check if it's a file or directory
          const stats = await window.electronAPI.getFileStats(filePath);
          console.log('[FileDropZone] stats received', stats);
          if (stats) {
            console.log('[FileDropZone] calling onDrop with', filePath, stats.isDirectory);
            onDrop(filePath, stats.isDirectory);
          } else {
            console.error('[FileDropZone] getFileStats returned null for', filePath);
          }
        } else {
          console.error('[FileDropZone] file path is undefined, file object:', {
            name: file.name,
            hasPath: 'path' in file,
            pathValue: file.path
          });
        }
      } else {
        console.log('[FileDropZone] no files in dataTransfer');
      }
    },
    [onDrop]
  );

  return (
    <div
      className="file-drop-zone"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-message">ファイルまたはフォルダをドロップ</div>
        </div>
      )}
    </div>
  );
}
