
import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, MessageSquare, Search, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to Illing Star! 🌟',
    description: 'Your gateway to exploring the web beyond the stars. Let\'s show you around!',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Browse Anything',
    description: 'Search the web or enter any URL to browse websites through our cloud service. Your privacy is our priority.',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Chat & Connect',
    description: 'Join the global chat, share photos and links! Level up by chatting and exploring the web.',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Level Up & Earn Badges',
    description: 'Gain XP through searches and chats. Unlock badges like Star ⭐, Shield 🛡️, Goat 🐐, Crown 👑, and Fire 🔥 at level 5000!',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Compete & Climb',
    description: 'Check the leaderboard to see where you rank. Complete quests and reach the max level of 5000!',
    icon: Crown,
    color: 'from-red-500 to-pink-500',
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Card
        className={`relative w-full max-w-2xl mx-4 border-white/20 overflow-hidden transition-all duration-500 transform ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          background: 'rgba(20, 10, 30, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: step.color 
              ? `linear-gradient(135deg, ${step.color.split(' ')[0]?.replace('from-', '') || 'purple-500'} 0%, ${step.color.split(' ')[1]?.replace('to-', '') || 'pink-500'} 100%)`
              : 'linear-gradient(135deg, purple-500 0%, pink-500 100%)',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />

        {/* Skip button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="relative p-8 md:p-12">
          {/* Icon with animation */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br ${step.color} animate-float`}
              style={{
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <h2
              className="text-3xl md:text-4xl font-bold text-white animate-fade-in"
              style={{
                animation: 'fade-in 0.5s ease-out',
              }}
            >
              {step.title}
            </h2>
            <p
              className="text-lg text-white/70 max-w-xl mx-auto animate-fade-in"
              style={{
                animation: 'fade-in 0.5s ease-out 0.1s both',
              }}
            >
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Skip Tutorial
            </Button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
