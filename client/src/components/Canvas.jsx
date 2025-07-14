import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Button from './Button';
import socket from '../sockets/socket';

const Canvas = forwardRef(({ isDrawer, onDrawChange, lobbyCode }, ref) => {
  const stageRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    if (!isDrawer) {
      console.log('Guesser canvas initialized, lines:', lines);
    }
  }, [isDrawer, lines]);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      console.log('Clearing canvas for lobby:', lobbyCode);
      setLines([]); // Reset state
      if (stageRef.current) {
        stageRef.current.clear();
        stageRef.current.batchDraw(); // Force re-render
      }
      if (isDrawer) {
        socket.emit('clear-canvas', { lobbyCode });
      }
    },
    loadPaths: (newLines) => {
      console.log('Loading paths on guesser:', newLines);
      setLines(newLines);
      if (stageRef.current) {
        stageRef.current.batchDraw(); // Ensure immediate redraw
      }
    },
    exportPaths: () => lines,
    getStrokeAttributes: () => ({ strokeColor, strokeWidth, isErasing }),
  }));

  const handleMouseDown = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    const newLine = {
      points: [pos.x, pos.y],
      strokeColor: isErasing ? 'white' : strokeColor,
      strokeWidth: isErasing ? strokeWidth * 2 : strokeWidth, // Larger eraser for better UX
      isErasing,
    };
    setLines([...lines, newLine]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isDrawer) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setLines((prevLines) => {
      const lastLine = prevLines[prevLines.length - 1];
      if (!lastLine) return prevLines;
      const updatedLine = {
        ...lastLine,
        points: [...lastLine.points, point.x, point.y],
      };
      return [...prevLines.slice(0, -1), updatedLine];
    });
    onDrawChange();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

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
            className={`p-2 ${strokeColor === 'black' && !isErasing ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('black')}
          >
            Black
          </Button>
          <Button
            className={`p-2 ${strokeColor === 'red' && !isErasing ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('red')}
          >
            Red
          </Button>
          <Button
            className={`p-2 ${strokeColor === 'blue' && !isErasing ? 'bg-gray-300' : ''}`}
            onClick={() => handleColorChange('blue')}
          >
            Blue
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 2 && !isErasing ? 'bg-gray-300' : ''}`}
            onClick={() => handleBrushSizeChange(2)}
          >
            Small
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 4 && !isErasing ? 'bg-gray-300' : ''}`}
            onClick={() => handleBrushSizeChange(4)}
          >
            Medium
          </Button>
          <Button
            className={`p-2 ${strokeWidth === 8 && !isErasing ? 'bg-gray-300' : ''}`}
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
          <Button onClick={() => ref.current.clearCanvas()}>
            Clear
          </Button>
        </div>
      )}
      <Stage
        width={500}
        height={400}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{ pointerEvents: isDrawer ? 'auto' : 'none', background: 'white' }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.strokeColor}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.isErasing ? 'destination-out' : 'source-over'}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

export default Canvas;