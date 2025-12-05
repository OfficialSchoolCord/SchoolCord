
import { useState } from 'react';
import { X, Gamepad2, Zap, Target, Puzzle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GamesPanelProps {
  onClose: () => void;
}

const games = [
  {
    id: 'snake',
    name: 'Snake Game',
    icon: Zap,
    color: '#22c55e',
    description: 'Classic snake game - eat the food and grow!',
  },
  {
    id: 'pong',
    name: 'Pong',
    icon: Target,
    color: '#3b82f6',
    description: 'Classic paddle game - keep the ball in play!',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    icon: Puzzle,
    color: '#f59e0b',
    description: 'Match pairs of cards to win!',
  },
];

export function GamesPanel({ onClose }: GamesPanelProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const renderSnakeGame = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg p-4">
      <div className="text-center">
        <canvas id="snakeCanvas" width="400" height="400" className="border-2 border-white/20 rounded-lg mx-auto bg-black/80"></canvas>
        <div className="mt-4 text-white/70 text-sm">
          Use Arrow Keys to Move • Score: <span id="snakeScore">0</span>
        </div>
        <Button onClick={() => {
          const canvas = document.getElementById('snakeCanvas') as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              initSnakeGame();
            }
          }
        }} className="mt-2">Restart Game</Button>
      </div>
    </div>
  );

  const renderPongGame = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg p-4">
      <div className="text-center">
        <canvas id="pongCanvas" width="600" height="400" className="border-2 border-white/20 rounded-lg mx-auto bg-black/80"></canvas>
        <div className="mt-4 text-white/70 text-sm">
          Use W/S Keys or Up/Down Arrows • Player: <span id="playerScore">0</span> | AI: <span id="aiScore">0</span>
        </div>
        <Button onClick={() => {
          const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              initPongGame();
            }
          }
        }} className="mt-2">Restart Game</Button>
      </div>
    </div>
  );

  const renderMemoryGame = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg p-4">
      <div className="text-center">
        <div id="memoryGame" className="grid grid-cols-4 gap-3 max-w-md mx-auto"></div>
        <div className="mt-4 text-white/70 text-sm">
          Moves: <span id="moves">0</span> | Matches: <span id="matches">0</span>/8
        </div>
        <Button onClick={initMemoryGame} className="mt-2">New Game</Button>
      </div>
    </div>
  );

  const initSnakeGame = () => {
    const canvas = document.getElementById('snakeCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 0;
    let dy = 0;
    let score = 0;
    let gameLoop: number;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
      if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
      if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
      if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    };

    document.addEventListener('keydown', handleKeyPress);

    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || 
          snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        document.removeEventListener('keydown', handleKeyPress);
        cancelAnimationFrame(gameLoop);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over!', 120, 200);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('snakeScore')!.textContent = score.toString();
        food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount)
        };
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#22c55e';
      snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

      gameLoop = requestAnimationFrame(() => setTimeout(draw, 100));
    };

    draw();
  };

  const initPongGame = () => {
    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let playerY = canvas.height / 2 - 40;
    let aiY = canvas.height / 2 - 40;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballDX = 3;
    let ballDY = 3;
    let playerScore = 0;
    let aiScore = 0;
    const paddleHeight = 80;
    const paddleWidth = 10;
    let keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (keys['w'] || keys['ArrowUp']) playerY = Math.max(0, playerY - 5);
      if (keys['s'] || keys['ArrowDown']) playerY = Math.min(canvas.height - paddleHeight, playerY + 5);

      aiY += (ballY - (aiY + paddleHeight / 2)) * 0.1;

      ballX += ballDX;
      ballY += ballDY;

      if (ballY <= 0 || ballY >= canvas.height) ballDY *= -1;

      if ((ballX <= paddleWidth && ballY >= playerY && ballY <= playerY + paddleHeight) ||
          (ballX >= canvas.width - paddleWidth && ballY >= aiY && ballY <= aiY + paddleHeight)) {
        ballDX *= -1.05;
      }

      if (ballX < 0) {
        aiScore++;
        document.getElementById('aiScore')!.textContent = aiScore.toString();
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballDX = 3;
      }
      if (ballX > canvas.width) {
        playerScore++;
        document.getElementById('playerScore')!.textContent = playerScore.toString();
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballDX = -3;
      }

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, playerY, paddleWidth, paddleHeight);
      ctx.fillRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight);
      ctx.beginPath();
      ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(draw);
    };

    draw();
  };

  const initMemoryGame = () => {
    const container = document.getElementById('memoryGame');
    if (!container) return;

    const symbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎹'];
    const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    let flipped: number[] = [];
    let matched: number[] = [];
    let moves = 0;

    container.innerHTML = '';
    cards.forEach((symbol, index) => {
      const card = document.createElement('div');
      card.className = 'w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-all hover:bg-primary/30 border-2 border-white/10';
      card.dataset.index = index.toString();
      card.textContent = '?';

      card.onclick = () => {
        if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
          card.textContent = symbol;
          card.classList.add('bg-primary/40');
          flipped.push(index);

          if (flipped.length === 2) {
            moves++;
            document.getElementById('moves')!.textContent = moves.toString();

            if (cards[flipped[0]] === cards[flipped[1]]) {
              matched.push(...flipped);
              document.getElementById('matches')!.textContent = (matched.length / 2).toString();
              flipped = [];

              if (matched.length === cards.length) {
                setTimeout(() => alert(`You won in ${moves} moves!`), 500);
              }
            } else {
              setTimeout(() => {
                flipped.forEach(i => {
                  const el = container.querySelector(`[data-index="${i}"]`) as HTMLElement;
                  if (el) {
                    el.textContent = '?';
                    el.classList.remove('bg-primary/40');
                  }
                });
                flipped = [];
              }, 1000);
            }
          }
        }
      };

      container.appendChild(card);
    });

    document.getElementById('moves')!.textContent = '0';
    document.getElementById('matches')!.textContent = '0';
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setTimeout(() => {
      if (gameId === 'snake') initSnakeGame();
      else if (gameId === 'pong') initPongGame();
      else if (gameId === 'memory') initMemoryGame();
    }, 100);
  };

  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="games-panel"
    >
      <Card 
        className="w-full max-w-4xl h-[80vh] border-white/10 flex flex-col"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-games"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-white">Games Arcade</h2>
          </div>
        </div>

        {!selectedGame ? (
          <ScrollArea className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {games.map((game) => {
                const Icon = game.icon;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleGameSelect(game.id)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl transition-all duration-200 hover-elevate"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                    data-testid={`game-${game.id}`}
                  >
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${game.color}20`,
                        boxShadow: `0 0 20px ${game.color}30`,
                      }}
                    >
                      <Icon 
                        className="w-8 h-8" 
                        style={{ color: game.color }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-1">{game.name}</h3>
                      <p className="text-white/60 text-sm">{game.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 p-4 overflow-auto">
            <Button
              onClick={() => setSelectedGame(null)}
              variant="ghost"
              className="mb-4 text-white/70 hover:text-white"
            >
              ← Back to Games
            </Button>
            {selectedGame === 'snake' && renderSnakeGame()}
            {selectedGame === 'pong' && renderPongGame()}
            {selectedGame === 'memory' && renderMemoryGame()}
          </div>
        )}
      </Card>
    </div>
  );
}
