import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import Button from './Button';

const Canvas = forwardRef(({ isDrawer, onDrawChange }, ref) => {
  const canvasRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isErasing, setIsErasing] = useState(false);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => canvasRef.current?.clearCanvas(),
    exportPaths: () => canvasRef.current?.exportPaths(),
    loadPaths: (paths) => canvasRef.current?.loadPaths(paths),
  }));

  const handleColorChange = (color) => {
    setStrokeColor(color);
    setIsErasing(false);
  };

  const handleBrushSizeChange = (width) => {
    setStrokeWidth(width);
    setIsErasing(false);
  };

  const toggleEraser = () => {
    setIsErasing(!isErasing);
  };

  return (
    <div className="mt-6 mx-auto w-[500px] border-2 border-black">
      {isDrawer && (
        <div className="flex gap-2 mb-2 justify-center">
          <Button
            className={`p-2 ${strokeColor === 'black' ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('black')}
          >
            Black
          </Button>
          <Button
            className={`p-2 ${strokeColor === 'red' ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('red')}
          >
            Red
          </Button>
          <Button
            className={`p-2 ${strokeColor === 'blue' ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('blue')}
          >
            Blue
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 2 ? 'bg-gray-300' : ''}`}
            onClick={() => handleBrushSizeChange(2)}
          >
            Small
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 4 ? 'bg-gray-300' : ''}`}
            onClick={() => handleBrushSizeChange(4)}
          >
            Medium
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 8 ? 'bg-gray-300' : ''}`}
            onClick={() => handleBrushSizeChange(8)}
          >
            Large
          </Button>
          <Button
            className={`p-2 ${isErasing ? 'bg-gray-300' : ''}`}
            onClick={toggleEraser}
          >
            Eraser
          </Button>
          <Button onClick={() => canvasRef.current?.clearCanvas()}>
            Clear
          </Button>
        </div>
      )}
      <ReactSketchCanvas
        ref={canvasRef}
        strokeWidth={strokeWidth}
        strokeColor={isErasing ? 'white' : strokeColor}
        eraserWidth={isErasing ? strokeWidth : 0}
        className="w-full h-[400px]"
        readOnly={!isDrawer}
        onChange={isDrawer ? onDrawChange : undefined}
        style={{ pointerEvents: isDrawer ? 'auto' : 'none' }}
      />
    </div>
  );
});

export default Canvas;