import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal, Cpu, Radio } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120; // Slightly faster for more anxiety

const MUSIC_TRACKS = [
  {
    id: 1,
    title: "ERR_0x00A1",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "CORRUPT_DATA_STREAM",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "VOID_RESONANCE",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on the snake
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsGamePaused(false);
    setGameStarted(true);
    generateFood();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameStarted && !gameOver) {
        setIsGamePaused(prev => !prev);
        return;
      }

      if (!gameStarted || gameOver || isGamePaused) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted, gameOver, isGamePaused]);

  useEffect(() => {
    if (!gameStarted || gameOver || isGamePaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Check collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check collision with self
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check if food eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => {
            const newScore = s + 1;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isGamePaused, gameStarted, generateFood, highScore]);


  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-digital flex flex-col selection:bg-[#ff00ff] selection:text-black uppercase overflow-hidden">
      {/* Global Glitch Overlays */}
      <div className="static-noise"></div>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={MUSIC_TRACKS[currentTrackIndex].url}
        onEnded={handleTrackEnded}
      />

      {/* Header */}
      <header className="p-4 border-b-4 border-[#00ffff] bg-black z-10 screen-tear">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Terminal className="w-10 h-10 text-[#ff00ff]" />
            <div>
              <h1 className="text-4xl font-bold tracking-widest text-[#00ffff] glitch" data-text="SYS.PROTOCOL_SNAKE">
                SYS.PROTOCOL_SNAKE
              </h1>
              <p className="text-[#ff00ff] text-sm tracking-widest">v1.0.0 // OVERRIDE_ACTIVE</p>
            </div>
          </div>
          
          <div className="flex gap-12 text-lg tracking-widest border-2 border-[#00ffff] p-2 bg-[#00ffff]/10">
            <div className="flex flex-col items-end">
              <span className="text-[#ff00ff] text-sm">DATA_FRAGMENTS</span>
              <span 
                className="text-4xl text-[#00ffff] glitch"
                data-text={score.toString().padStart(3, '0')}
              >
                {score.toString().padStart(3, '0')}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#ff00ff] text-sm">MAX_CAPACITY</span>
              <span 
                className="text-4xl text-[#00ffff] glitch"
                data-text={highScore.toString().padStart(3, '0')}
              >
                {highScore.toString().padStart(3, '0')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Game Area */}
        <div className="relative flex-shrink-0 scanlines">
          <div 
            className="bg-black border-4 border-[#00ffff] relative screen-tear"
            style={{
              width: `${GRID_SIZE * 20}px`,
              height: `${GRID_SIZE * 20}px`,
              boxShadow: '0 0 20px #00ffff, inset 0 0 20px #00ffff'
            }}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)`,
                backgroundSize: `20px 20px`
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute ${isHead ? 'bg-[#ff00ff] z-10' : 'bg-[#00ffff]'}`}
                  style={{
                    left: `${segment.x * 20}px`,
                    top: `${segment.y * 20}px`,
                    width: '20px',
                    height: '20px',
                    boxShadow: isHead ? '0 0 10px #ff00ff' : '0 0 5px #00ffff'
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-[#ff00ff] animate-pulse"
              style={{
                left: `${food.x * 20}px`,
                top: `${food.y * 20}px`,
                width: '20px',
                height: '20px',
                boxShadow: '0 0 15px #ff00ff'
              }}
            />

            {/* Overlays */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20 border-4 border-[#ff00ff] m-2">
                <Cpu className="w-20 h-20 text-[#ff00ff] mb-4 animate-pulse" />
                <h2 className="text-5xl text-[#00ffff] mb-8 tracking-widest glitch" data-text="SYSTEM_STANDBY">SYSTEM_STANDBY</h2>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-black border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors text-2xl tracking-widest font-bold"
                >
                  &gt; INIT_SEQUENCE_
                </button>
                <p className="mt-8 text-[#ff00ff] text-lg animate-pulse">AWAITING_DIRECTIONAL_INPUT...</p>
              </div>
            )}

            {isGamePaused && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-[#00ffff] m-2">
                <h2 className="text-5xl text-[#ff00ff] mb-4 tracking-widest glitch" data-text="PROCESS_SUSPENDED">PROCESS_SUSPENDED</h2>
                <p className="text-[#00ffff] text-xl tracking-wider animate-pulse">&gt; INPUT_REQUIRED_TO_RESUME_</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-20 border-4 border-[#ff00ff] m-2">
                <h2 className="text-6xl text-[#ff00ff] mb-4 tracking-widest glitch" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
                <p className="text-2xl text-[#00ffff] mb-8">FRAGMENTS_RECOVERED: {score.toString().padStart(3, '0')}</p>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-black border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-colors text-2xl tracking-widest font-bold"
                >
                  &gt; REBOOT_SYSTEM_
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Controls Hint */}
          <div className="mt-4 text-center text-[#ff00ff] text-lg tracking-widest lg:hidden">
            KEYBOARD_INTERFACE_REQUIRED
          </div>
        </div>

        {/* Music Player Panel */}
        <div className="w-full max-w-md bg-black border-4 border-[#00ffff] p-6 shadow-[0_0_20px_rgba(0,255,255,0.2)] screen-tear">
          <div className="flex items-center justify-between mb-8 border-b-2 border-[#ff00ff] pb-4">
            <div className="flex items-center gap-3">
              <Radio className="w-6 h-6 text-[#ff00ff] animate-pulse" />
              <h3 className="text-xl tracking-widest text-[#00ffff]">AUDIO_STREAM_LINK</h3>
            </div>
            <span className="text-[#ff00ff] text-sm animate-pulse">LIVE</span>
          </div>

          <div className="flex flex-col items-center text-center mb-10 border-2 border-[#00ffff] p-6 bg-[#00ffff]/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff] opacity-50 animate-[ping_2s_infinite]"></div>
            
            <h4 className="text-3xl text-[#ff00ff] mb-2 glitch" data-text={MUSIC_TRACKS[currentTrackIndex].title}>
              {MUSIC_TRACKS[currentTrackIndex].title}
            </h4>
            <p className="text-xl text-[#00ffff] tracking-wider">
              SRC: {MUSIC_TRACKS[currentTrackIndex].artist}
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 mb-8">
            <button 
              onClick={prevTrack}
              className="p-3 text-[#00ffff] hover:bg-[#00ffff] hover:text-black border-2 border-transparent hover:border-[#00ffff] transition-colors"
            >
              <SkipBack className="w-8 h-8" />
            </button>
            <button 
              onClick={togglePlay}
              className="p-5 bg-black border-4 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-colors"
            >
              {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
            </button>
            <button 
              onClick={nextTrack}
              className="p-3 text-[#00ffff] hover:bg-[#00ffff] hover:text-black border-2 border-transparent hover:border-[#00ffff] transition-colors"
            >
              <SkipForward className="w-8 h-8" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 pt-6 border-t-2 border-[#ff00ff]">
            <div className="flex items-center gap-2 text-lg text-[#00ffff] tracking-widest">
              <span>SECTOR</span>
              <span className="text-[#ff00ff] font-bold">[{currentTrackIndex + 1}/{MUSIC_TRACKS.length}]</span>
            </div>
            <button 
              onClick={toggleMute}
              className="p-2 text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black border-2 border-transparent hover:border-[#ff00ff] transition-colors"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
