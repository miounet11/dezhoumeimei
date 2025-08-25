'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

// Enhanced Card Flip Animation
interface AnimatedCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  frontContent,
  backContent,
  isFlipped = false,
  onFlip,
  className = '',
}) => {
  const [flipped, setFlipped] = useState(isFlipped);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  return (
    <div className={`perspective-1000 ${className}`} onClick={handleFlip}>
      <motion.div
        className="relative w-full h-full cursor-pointer preserve-3d"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", damping: 15 }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          {frontContent}
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          {backContent}
        </div>
      </motion.div>
    </div>
  );
};

// Chip Stack Animation
interface AnimatedChipStackProps {
  value: number;
  color: 'red' | 'blue' | 'green' | 'black' | 'white';
  count?: number;
  animate?: boolean;
  className?: string;
}

export const AnimatedChipStack: React.FC<AnimatedChipStackProps> = ({
  value,
  color,
  count = 5,
  animate = true,
  className = '',
}) => {
  const chipColors = {
    red: 'bg-red-600 border-red-800',
    blue: 'bg-blue-600 border-blue-800',
    green: 'bg-green-600 border-green-800',
    black: 'bg-gray-900 border-gray-700',
    white: 'bg-white border-gray-300',
  };

  return (
    <div className={`relative ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className={`
            absolute w-12 h-12 rounded-full border-4 ${chipColors[color]}
            shadow-lg flex items-center justify-center text-white font-bold text-xs
          `}
          initial={animate ? { y: -20, opacity: 0 } : false}
          animate={{ y: -i * 4, opacity: 1 }}
          transition={{
            delay: i * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          whileHover={{ scale: 1.05, y: -i * 4 - 2 }}
        >
          {i === 0 && value}
        </motion.div>
      ))}
    </div>
  );
};

// Progress Ring with Animation
interface AnimatedProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  showPercentage?: boolean;
}

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  children,
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <motion.span
            className="text-2xl font-bold text-gray-700 dark:text-gray-300"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {Math.round(progress)}%
          </motion.span>
        ))}
      </div>
    </div>
  );
};

// Floating Action Button with Pulse
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  color = 'primary',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const colorStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30',
    success: 'bg-green-500 hover:bg-green-600 shadow-green-500/30',
    warning: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30',
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/30',
  };

  const sizeStyles = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div className="fixed bottom-6 right-6 z-50">
      <motion.button
        className={`
          ${sizeStyles[size]} ${colorStyles[color]} ${className}
          rounded-full text-white shadow-xl flex items-center justify-center
          transition-all duration-300 hover:shadow-2xl
          ${pulse ? 'animate-pulse' : ''}
        `}
        onClick={onClick}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Label tooltip */}
      <AnimatePresence>
        {label && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Confetti Animation for Achievements
interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'][Math.floor(Math.random() * 6)],
      }));
      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: '-10px',
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 360 * 3,
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
          }}
          transition={{
            duration: 3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Typing Animation for Text
interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 100,
  className = '',
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-current ml-1"
      />
    </span>
  );
};

// Swipe to Reveal Component
interface SwipeToRevealProps {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  threshold?: number;
  className?: string;
  onReveal?: () => void;
}

export const SwipeToReveal: React.FC<SwipeToRevealProps> = ({
  children,
  revealContent,
  threshold = 100,
  className = '',
  onReveal,
}) => {
  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > threshold) {
      setIsRevealed(true);
      onReveal?.();
    } else {
      x.set(0);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Reveal content (background) */}
      <div className="absolute inset-0 flex items-center justify-end pr-4">
        {revealContent}
      </div>

      {/* Main content (draggable) */}
      <motion.div
        className="relative bg-white dark:bg-gray-800 z-10"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={isRevealed ? { x: 200 } : { x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Magnetic Button Effect
interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  className = '',
  onClick,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;

    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};