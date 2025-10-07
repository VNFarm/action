import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Direction, Coordinates, GameState } from './types';
import { GRID_SIZE, INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT_AMOUNT, OBSTACLE_COUNT, OBSTACLE_IMAGE_URL } from './constants';

const SNAKE_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-lime-400',
  'bg-green-500', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-500',
  'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-fuchsia-500',
  'bg-pink-500', 'bg-rose-500'
];

// Helper to check if two coordinates are the same
const areCoordinatesEqual = (a: Coordinates, b: Coordinates) => a.x === b.x && a.y === b.y;

// --- UI Components (defined outside App to prevent re-creation) ---

interface ScreenProps {
  onStart: () => void;
  score?: number;
}

const StartScreen: React.FC<Pick<ScreenProps, 'onStart'>> = ({ onStart }) => (
  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-center z-10 p-4">
    <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">RIALO Snake</h1>
    <img src={OBSTACLE_IMAGE_URL} className="w-40 h-40 mb-8" alt="RIALO Snake Logo" />
    <p className="text-lg md:text-xl text-slate-300 mb-8">Use Arrow Keys to move. Avoid walls, yourself, and the obstacles!</p>
    <button onClick={onStart} className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-200 text-2xl">
      Start Game
    </button>
  </div>
);

const GameOverScreen: React.FC<ScreenProps> = ({ onStart, score }) => (
  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center text-center z-10 p-4">
    <h2 className="text-6xl font-bold text-red-500 mb-4">Game Over</h2>
    <p className="text-3xl text-slate-200 mb-8">Your Score: <span className="font-bold text-yellow-400">{score}</span></p>
    <button onClick={onStart} className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-200 text-2xl">
      Play Again
    </button>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [snake, setSnake] = useState<Coordinates[]>([]);
  const [food, setFood] = useState<Coordinates>({ x: -1, y: -1 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [obstacles, setObstacles] = useState<Coordinates[]>([]);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const pendingDirection = useRef<Direction>(direction);

  const getRandomCoordinate = (occupied: Coordinates[]): Coordinates => {
    let newPosition: Coordinates;
    do {
      newPosition = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (occupied.some(pos => areCoordinatesEqual(pos, newPosition)));
    return newPosition;
  };

  const resetGame = useCallback(() => {
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setDirection(Direction.RIGHT);
    pendingDirection.current = Direction.RIGHT;
    
    const initialSnake = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
    let occupiedSpaces = [...initialSnake];

    const newObstacles = Array.from({ length: OBSTACLE_COUNT }).map(() => {
      const newObstacle = getRandomCoordinate(occupiedSpaces);
      occupiedSpaces.push(newObstacle);
      return newObstacle;
    });
    setObstacles(newObstacles);
    
    const newFood = getRandomCoordinate(occupiedSpaces);
    setFood(newFood);
    
    setSnake(initialSnake);
    setGameState(GameState.RUNNING);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newDirection: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp':
        if (direction !== Direction.DOWN) newDirection = Direction.UP;
        break;
      case 'ArrowDown':
        if (direction !== Direction.UP) newDirection = Direction.DOWN;
        break;
      case 'ArrowLeft':
        if (direction !== Direction.RIGHT) newDirection = Direction.LEFT;
        break;
      case 'ArrowRight':
        if (direction !== Direction.LEFT) newDirection = Direction.RIGHT;
        break;
    }
    if (newDirection !== null) {
      pendingDirection.current = newDirection;
    }
  }, [direction]);

  useEffect(() => {
    if (gameState === GameState.RUNNING) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gameState, handleKeyDown]);

  const gameLoop = useCallback(() => {
    if (gameState !== GameState.RUNNING) return;

    setDirection(pendingDirection.current);

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (pendingDirection.current) {
        case Direction.UP: head.y -= 1; break;
        case Direction.DOWN: head.y += 1; break;
        case Direction.LEFT: head.x -= 1; break;
        case Direction.RIGHT: head.x += 1; break;
      }
      
      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      // Self collision
      if (newSnake.slice(1).some(segment => areCoordinatesEqual(segment, head))) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      // Obstacle collision
      if (obstacles.some(obstacle => areCoordinatesEqual(obstacle, head))) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      newSnake.unshift(head);

      // Food collision
      if (areCoordinatesEqual(head, food)) {
        setScore(s => s + 1);
        setSpeed(s => Math.max(MIN_SPEED, s - SPEED_INCREMENT_AMOUNT));
        const allOccupied = [...newSnake, ...obstacles];
        setFood(getRandomCoordinate(allOccupied));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, obstacles, gameState]);

  // Custom interval hook logic
  useEffect(() => {
    if (gameState !== GameState.RUNNING) {
      return;
    }
    const interval = setInterval(gameLoop, speed);
    return () => clearInterval(interval);
  }, [gameState, speed, gameLoop]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-2">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">RIALO Snake</h1>
        <div className="text-2xl font-bold">Score: <span className="text-yellow-400">{score}</span></div>
      </div>
      <div className="relative w-full max-w-lg aspect-square bg-slate-800 border-4 border-slate-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
        {gameState === GameState.IDLE && <StartScreen onStart={resetGame} />}
        {gameState === GameState.GAME_OVER && <GameOverScreen onStart={resetGame} score={score} />}
        <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`}}>
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`w-full h-full ${SNAKE_COLORS[index % SNAKE_COLORS.length]} ${index === 0 ? 'rounded-md' : 'rounded-sm'} transition-all duration-100`}
              style={{ gridColumnStart: segment.x + 1, gridRowStart: segment.y + 1 }}
            />
          ))}
          <div
            className="w-full h-full bg-red-500 rounded-full animate-pulse"
            style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }}
          />
          {obstacles.map((obstacle, index) => (
            <div
              key={index}
              className="w-full h-full bg-cover bg-center rounded-sm"
              style={{ 
                gridColumnStart: obstacle.x + 1, 
                gridRowStart: obstacle.y + 1,
                backgroundImage: `url(${OBSTACLE_IMAGE_URL})`
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 text-center text-slate-400 hidden md:block">
        <p>Use Arrow Keys to control the snake.</p>
        <p>Built with React & Tailwind CSS.</p>
      </div>
    </div>
  );
}