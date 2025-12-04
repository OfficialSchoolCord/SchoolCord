import { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: string;
  animationClass: string;
}

export function Starfield() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const stars = useMemo(() => {
    if (dimensions.width === 0) return [];
    
    const starCount = Math.floor((dimensions.width * dimensions.height) / 4000);
    const generatedStars: Star[] = [];
    
    const animationClasses = [
      'animate-twinkle',
      'animate-twinkle-slow',
      'animate-twinkle-fast',
    ];
    
    for (let i = 0; i < starCount; i++) {
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        animationDelay: `${Math.random() * 5}s`,
        animationClass: animationClasses[Math.floor(Math.random() * animationClasses.length)],
      });
    }
    
    return generatedStars;
  }, [dimensions]);

  const largeStars = useMemo(() => {
    if (dimensions.width === 0 || stars.length === 0) return [];
    
    const count = Math.floor(stars.length / 15);
    const generated: Star[] = [];
    
    for (let i = 0; i < Math.max(count, 8); i++) {
      generated.push({
        id: i + 10000,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 3,
        opacity: Math.random() * 0.4 + 0.4,
        animationDelay: `${Math.random() * 3}s`,
        animationClass: 'animate-twinkle-slow',
      });
    }
    
    return generated;
  }, [dimensions, stars.length]);

  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        background: `linear-gradient(135deg, 
          hsl(280, 60%, 8%) 0%, 
          hsl(270, 50%, 10%) 20%,
          hsl(280, 55%, 12%) 40%,
          hsl(300, 45%, 14%) 60%,
          hsl(340, 50%, 12%) 80%,
          hsl(348, 60%, 10%) 100%
        )`,
      }}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-white ${star.animationClass}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
      
      {largeStars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full ${star.animationClass}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.4) 50%, transparent 70%)`,
            boxShadow: '0 0 6px rgba(255,255,255,0.5)',
          }}
        />
      ))}

      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 30%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}
