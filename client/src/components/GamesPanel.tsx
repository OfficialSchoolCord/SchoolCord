
import { useState, useEffect } from 'react';
import { Gamepad2, Zap, Target, Puzzle, ArrowLeft, Globe, Crosshair, Cookie, Pickaxe, Sword, Car, Bird, Rocket, Dices, Ghost, Blocks, Trophy, Joystick, Loader2, Swords, Mountain, Fish, Skull, Flame, Sparkles, Bomb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GamesPanelProps {
  onClose: () => void;
}

async function encodeProxyUrl(url: string): Promise<string> {
  try {
    const response = await fetch('/api/~e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u: url }),
    });
    const data = await response.json();
    return data.r || '';
  } catch {
    return '';
  }
}

type GameType = 'local' | 'proxy';

interface Game {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  type: GameType;
  url?: string;
}

const games: Game[] = [
  {
    id: '1v1lol',
    name: '1v1.LOL',
    icon: Crosshair,
    color: '#ef4444',
    description: 'Build and battle in this fast-paced shooter!',
    type: 'proxy',
    url: 'https://www.1v1.lol/',
  },
  {
    id: 'cookieclicker',
    name: 'Cookie Clicker',
    icon: Cookie,
    color: '#f59e0b',
    description: 'Click cookies to build your cookie empire!',
    type: 'proxy',
    url: 'https://orteil.dashnet.org/cookieclicker/',
  },
  {
    id: 'eaglercraft',
    name: 'Eaglercraft',
    icon: Pickaxe,
    color: '#22c55e',
    description: 'Minecraft in your browser - build and explore!',
    type: 'proxy',
    url: 'https://eaglercraft.com/mc/1.8.8-wasm/',
  },
  {
    id: 'shellshockers',
    name: 'Shell Shockers',
    icon: Target,
    color: '#fbbf24',
    description: 'Egg-themed multiplayer FPS action!',
    type: 'proxy',
    url: 'https://www.shellshock.io/',
  },
  {
    id: 'slope',
    name: 'Slope',
    icon: Mountain,
    color: '#10b981',
    description: 'Roll down the endless slope - avoid obstacles!',
    type: 'proxy',
    url: 'https://slopegame.io/',
  },
  {
    id: 'retrobowl',
    name: 'Retro Bowl',
    icon: Trophy,
    color: '#3b82f6',
    description: 'Classic football management and gameplay!',
    type: 'proxy',
    url: 'https://retrobowl.app/',
  },
  {
    id: 'zombsroyale',
    name: 'Zombs Royale',
    icon: Ghost,
    color: '#8b5cf6',
    description: '2D battle royale - be the last one standing!',
    type: 'proxy',
    url: 'https://zombsroyale.io/',
  },
  {
    id: 'driftboss',
    name: 'Drift Boss',
    icon: Car,
    color: '#ec4899',
    description: 'Master the art of drifting!',
    type: 'proxy',
    url: 'https://www.silvergames.com/en/drift-boss',
  },
  {
    id: 'flappybird',
    name: 'Flappy Bird',
    icon: Bird,
    color: '#84cc16',
    description: 'The classic tap-to-fly game!',
    type: 'proxy',
    url: 'https://flappybird.io/',
  },
  {
    id: 'paperio',
    name: 'Paper.io 2',
    icon: Blocks,
    color: '#f472b6',
    description: 'Conquer territory in this addictive game!',
    type: 'proxy',
    url: 'https://paper-io.com/',
  },
  {
    id: '2048',
    name: '2048',
    icon: Dices,
    color: '#eab308',
    description: 'Combine tiles to reach 2048!',
    type: 'proxy',
    url: 'https://play2048.co/',
  },
  {
    id: 'getaway',
    name: 'Getaway Shootout',
    icon: Sword,
    color: '#dc2626',
    description: 'Crazy physics-based shooting game!',
    type: 'proxy',
    url: 'https://www.crazygames.com/game/getaway-shootout',
  },
  {
    id: 'slither',
    name: 'Slither.io',
    icon: Sparkles,
    color: '#a855f7',
    description: 'Become the longest snake!',
    type: 'proxy',
    url: 'https://slither.io/',
  },
  {
    id: 'agar',
    name: 'Agar.io',
    icon: Globe,
    color: '#06b6d4',
    description: 'Eat cells and grow bigger!',
    type: 'proxy',
    url: 'https://agar.io/',
  },
  {
    id: 'krunker',
    name: 'Krunker',
    icon: Crosshair,
    color: '#f97316',
    description: 'Fast-paced browser FPS!',
    type: 'proxy',
    url: 'https://krunker.io/',
  },
  {
    id: 'buildroyale',
    name: 'Build Royale',
    icon: Swords,
    color: '#14b8a6',
    description: 'Battle royale with building!',
    type: 'proxy',
    url: 'https://buildroyale.io/',
  },
  {
    id: 'surviv',
    name: 'Surviv.io',
    icon: Skull,
    color: '#facc15',
    description: '2D battle royale survival!',
    type: 'proxy',
    url: 'https://surviv.io/',
  },
  {
    id: 'diep',
    name: 'Diep.io',
    icon: Bomb,
    color: '#0ea5e9',
    description: 'Tank battle arena game!',
    type: 'proxy',
    url: 'https://diep.io/',
  },
  {
    id: 'moomoo',
    name: 'Moomoo.io',
    icon: Flame,
    color: '#65a30d',
    description: 'Gather resources and build!',
    type: 'proxy',
    url: 'https://moomoo.io/',
  },
  {
    id: 'defly',
    name: 'Defly.io',
    icon: Rocket,
    color: '#7c3aed',
    description: 'Helicopter territory control!',
    type: 'proxy',
    url: 'https://defly.io/',
  },
  {
    id: 'bonkio',
    name: 'Bonk.io',
    icon: Joystick,
    color: '#e11d48',
    description: 'Physics-based multiplayer game!',
    type: 'proxy',
    url: 'https://bonk.io/',
  },
  {
    id: 'crazygames',
    name: 'Crazy Games',
    icon: Gamepad2,
    color: '#a855f7',
    description: 'Browse thousands of free games!',
    type: 'proxy',
    url: 'https://www.crazygames.com/',
  },
  {
    id: 'poki',
    name: 'Poki',
    icon: Globe,
    color: '#6366f1',
    description: 'Free online games platform!',
    type: 'proxy',
    url: 'https://poki.com/',
  },
  {
    id: 'snake',
    name: 'Snake Game',
    icon: Zap,
    color: '#22c55e',
    description: 'Classic snake game - eat the food and grow!',
    type: 'local',
  },
  {
    id: 'pong',
    name: 'Pong',
    icon: Target,
    color: '#3b82f6',
    description: 'Classic paddle game - keep the ball in play!',
    type: 'local',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    icon: Puzzle,
    color: '#f59e0b',
    description: 'Match pairs of cards to win!',
    type: 'local',
  },
];

export function GamesPanel({ onClose }: GamesPanelProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [isLoadingProxy, setIsLoadingProxy] = useState(false);

  const selectedGameData = games.find(g => g.id === selectedGame);

  useEffect(() => {
    if (selectedGame && selectedGameData?.type === 'proxy' && selectedGameData.url) {
      setIsLoadingProxy(true);
      encodeProxyUrl(selectedGameData.url).then((encoded) => {
        setProxyUrl(encoded);
        setIsLoadingProxy(false);
      });
    } else {
      setProxyUrl('');
    }
  }, [selectedGame, selectedGameData]);

  const renderSnakeGame = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg p-4">
      <div className="text-center">
        <canvas id="snakeCanvas" width="400" height="400" className="border-2 border-white/20 rounded-lg mx-auto bg-black/80"></canvas>
        <div className="mt-4 text-white/70 text-sm">
          Use Arrow Keys to Move | Score: <span id="snakeScore">0</span>
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
          Use W/S Keys or Up/Down Arrows | Player: <span id="playerScore">0</span> | AI: <span id="aiScore">0</span>
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

  const renderProxyGame = () => (
    <div className="w-full h-full flex flex-col">
      {isLoadingProxy ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(220, 38, 38, 0.1)',
                boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-white/60 text-sm">Loading game...</p>
          </div>
        </div>
      ) : proxyUrl ? (
        <div className="flex-1 relative overflow-hidden rounded-lg">
          <iframe
            src={`/~s/${proxyUrl}`}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock"
            title={selectedGameData?.name || 'Game'}
            allow="fullscreen; autoplay"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/60">Failed to load game. Please try again.</p>
        </div>
      )}
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

    const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
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
    const game = games.find(g => g.id === gameId);
    if (game?.type === 'local') {
      setTimeout(() => {
        if (gameId === 'snake') initSnakeGame();
        else if (gameId === 'pong') initPongGame();
        else if (gameId === 'memory') initMemoryGame();
      }, 100);
    }
  };

  const proxyGames = games.filter(g => g.type === 'proxy');
  const localGames = games.filter(g => g.type === 'local');

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
        className="w-full max-w-6xl h-[90vh] border-white/10 flex flex-col"
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
              onClick={selectedGame ? () => setSelectedGame(null) : onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-games"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-white">
              {selectedGame ? selectedGameData?.name || 'Game' : 'Games Arcade'}
            </h2>
          </div>
          {selectedGame && selectedGameData?.type === 'proxy' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProxyUrl('');
                setIsLoadingProxy(true);
                if (selectedGameData.url) {
                  encodeProxyUrl(selectedGameData.url).then((encoded) => {
                    setProxyUrl(encoded);
                    setIsLoadingProxy(false);
                  });
                }
              }}
              className="text-white/70 hover:text-white"
            >
              Refresh
            </Button>
          )}
        </div>

        {!selectedGame ? (
          <ScrollArea className="flex-1 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Online Games
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {proxyGames.map((game) => {
                  const Icon = game.icon;
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 hover-elevate"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                      data-testid={`game-${game.id}`}
                    >
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${game.color}20`,
                          boxShadow: `0 0 20px ${game.color}30`,
                        }}
                      >
                        <Icon 
                          className="w-7 h-7" 
                          style={{ color: game.color }}
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-medium text-sm mb-1">{game.name}</h3>
                        <p className="text-white/50 text-xs line-clamp-2">{game.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Offline Games
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {localGames.map((game) => {
                  const Icon = game.icon;
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 hover-elevate"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                      data-testid={`game-${game.id}`}
                    >
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${game.color}20`,
                          boxShadow: `0 0 20px ${game.color}30`,
                        }}
                      >
                        <Icon 
                          className="w-7 h-7" 
                          style={{ color: game.color }}
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-medium text-sm mb-1">{game.name}</h3>
                        <p className="text-white/50 text-xs">{game.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {selectedGameData?.type === 'local' ? (
              <>
                {selectedGame === 'snake' && renderSnakeGame()}
                {selectedGame === 'pong' && renderPongGame()}
                {selectedGame === 'memory' && renderMemoryGame()}
              </>
            ) : (
              renderProxyGame()
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
