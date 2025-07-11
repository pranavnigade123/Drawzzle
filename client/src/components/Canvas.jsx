import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const Canvas = forwardRef(({ isDrawer, onDrawChange }, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => canvasRef.current?.clearCanvas(),
    exportPaths: () => canvasRef.current?.exportPaths(),
    loadPaths: (paths) => canvasRef.current?.loadPaths(paths),
  }));

  return (
    <div className="mt-6 mx-auto w-[500px] h-[400px] border-2 border-black">
      <ReactSketchCanvas
        ref={canvasRef}
        strokeWidth={4}
        strokeColor="black"
        className="w-full h-full"
        readOnly={!isDrawer}
        onChange={isDrawer ? onDrawChange : undefined}
        style={{ pointerEvents: isDrawer ? 'auto' : 'none' }}
      />
    </div>
  );
});

export default Canvas;