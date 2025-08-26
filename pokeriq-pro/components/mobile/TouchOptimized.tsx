'use client';

/**
 * Touch-Optimized Components
 * 
 * Collection of touch-optimized React components including:
 * - Touch-friendly buttons and inputs
 * - Gesture handling (swipe, pinch, pan)
 * - Haptic feedback integration
 * - Touch target size optimization
 * - Smooth touch interactions
 * - Mobile-first design patterns
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  forwardRef,
  ComponentProps,
  ReactNode,
  TouchEvent,
  MouseEvent
} from 'react';
import { useResponsive } from '@/lib/mobile/responsive-utils';

// Touch interaction types
interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

interface PinchGesture {
  scale: number;
  center: TouchPosition;
}

interface PanGesture {
  deltaX: number;
  deltaY: number;
  distance: number;
}

// Touch event handlers
type TouchHandler<T = void> = (event: TouchEvent | MouseEvent) => T;
type SwipeHandler = (gesture: SwipeGesture) => void;
type PinchHandler = (gesture: PinchGesture) => void;
type PanHandler = (gesture: PanGesture) => void;

// Haptic feedback patterns
const HAPTIC_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 10, 10],
  warning: [20, 10, 20],
  error: [30, 10, 30, 10, 30]
} as const;

type HapticPattern = keyof typeof HAPTIC_PATTERNS;

/**
 * Haptic feedback utility
 */
export const hapticFeedback = {
  vibrate: (pattern: HapticPattern | number | number[]) => {
    if (!navigator.vibrate) return;
    
    if (typeof pattern === 'string') {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } else {
      navigator.vibrate(pattern);
    }
  },
  
  impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
    // iOS Haptic Feedback (if available)
    if ('Haptics' in window && (window as any).Haptics?.impact) {
      (window as any).Haptics.impact(style);
    } else {
      hapticFeedback.vibrate(style);
    }
  },
  
  notification: (type: 'success' | 'warning' | 'error') => {
    if ('Haptics' in window && (window as any).Haptics?.notification) {
      (window as any).Haptics.notification(type);
    } else {
      hapticFeedback.vibrate(type);
    }
  }
};

/**
 * Touch-optimized Button Component
 */
interface TouchButtonProps extends Omit<ComponentProps<'button'>, 'onTouchStart' | 'onTouchEnd'> {
  hapticFeedback?: HapticPattern | false;
  touchResponse?: boolean;
  minTouchTarget?: number;
  children: ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(({
  hapticFeedback: hapticPattern = 'light',
  touchResponse = true,
  minTouchTarget = 44,
  className = '',
  style = {},
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onClick,
  children,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isTouch } = useResponsive();
  
  const handleTouchStart = useCallback((e: TouchEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    
    setIsPressed(true);
    
    // Trigger haptic feedback
    if (hapticPattern && isTouch) {
      hapticFeedback.vibrate(hapticPattern);
    }
    
    // Call original handler
    if ('touches' in e) {
      // Touch event
    } else if (onMouseDown) {
      onMouseDown(e);
    }
  }, [hapticPattern, isTouch, onMouseDown, props.disabled]);
  
  const handleTouchEnd = useCallback((e: TouchEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    
    setIsPressed(false);
    
    // Call original handler
    if ('touches' in e) {
      // Touch event
    } else if (onMouseUp) {
      onMouseUp(e);
    }
  }, [onMouseUp, props.disabled]);
  
  const handleMouseLeave = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  }, [onMouseLeave]);
  
  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    
    // Provide haptic feedback on click for non-touch devices
    if (hapticPattern && !isTouch) {
      hapticFeedback.vibrate(hapticPattern);
    }
    
    if (onClick) {
      onClick(e);
    }
  }, [hapticPattern, isTouch, onClick, props.disabled]);
  
  const buttonStyles = useMemo(() => ({
    minWidth: `${minTouchTarget}px`,
    minHeight: `${minTouchTarget}px`,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transform: touchResponse && isPressed ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
    opacity: isPressed ? 0.7 : 1,
    ...style
  }), [minTouchTarget, props.disabled, touchResponse, isPressed, style]);
  
  const buttonClassName = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150';
    const stateClasses = props.disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:opacity-90 active:scale-95';
    
    return `${baseClasses} ${stateClasses} ${className}`.trim();
  }, [className, props.disabled]);
  
  return (
    <button
      ref={ref}
      {...props}
      className={buttonClassName}
      style={buttonStyles}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart as TouchHandler}
      onTouchEnd={handleTouchEnd as TouchHandler}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

TouchButton.displayName = 'TouchButton';

/**
 * Touch-optimized Input Component
 */
interface TouchInputProps extends Omit<ComponentProps<'input'>, 'onChange'> {
  hapticFeedback?: HapticPattern | false;
  minTouchTarget?: number;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(({
  hapticFeedback: hapticPattern = false,
  minTouchTarget = 44,
  className = '',
  style = {},
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { isTouch } = useResponsive();
  
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Provide haptic feedback on focus for touch devices
    if (hapticPattern && isTouch) {
      hapticFeedback.vibrate(hapticPattern);
    }
    
    if (onFocus) {
      onFocus(e);
    }
  }, [hapticPattern, isTouch, onFocus]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  }, [onChange]);
  
  const inputStyles = useMemo(() => ({
    minHeight: `${minTouchTarget}px`,
    fontSize: isTouch ? '16px' : undefined, // Prevent zoom on iOS
    WebkitAppearance: 'none' as const,
    borderRadius: '8px',
    ...style
  }), [minTouchTarget, isTouch, style]);
  
  const inputClassName = useMemo(() => {
    const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    return `${baseClasses} ${className}`.trim();
  }, [className]);
  
  return (
    <input
      ref={ref}
      {...props}
      className={inputClassName}
      style={inputStyles}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={onBlur}
    />
  );
});

TouchInput.displayName = 'TouchInput';

/**
 * Gesture Handler Hook
 */
interface UseGestureOptions {
  onSwipe?: SwipeHandler;
  onPinch?: PinchHandler;
  onPan?: PanHandler;
  swipeThreshold?: number;
  panThreshold?: number;
  enablePinch?: boolean;
  enablePan?: boolean;
  enableSwipe?: boolean;
}

export const useGesture = (options: UseGestureOptions = {}) => {
  const {
    onSwipe,
    onPinch,
    onPan,
    swipeThreshold = 50,
    panThreshold = 10,
    enablePinch = false,
    enablePan = false,
    enableSwipe = true
  } = options;
  
  const touchStartRef = useRef<Touch[]>([]);
  const touchStartTimeRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number>(0);
  const lastPanPositionRef = useRef<TouchPosition>({ x: 0, y: 0 });
  
  const calculateDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  const calculateDirection = useCallback((start: TouchPosition, end: TouchPosition): SwipeGesture['direction'] => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, []);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartRef.current = Array.from(e.touches);
    touchStartTimeRef.current = Date.now();
    
    if (e.touches.length === 2 && enablePinch) {
      initialPinchDistanceRef.current = calculateDistance(e.touches[0], e.touches[1]);
    }
    
    if (e.touches.length === 1 && enablePan) {
      lastPanPositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [enablePinch, enablePan, calculateDistance]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && enablePinch && onPinch) {
      const currentDistance = calculateDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      onPinch({
        scale,
        center: { x: centerX, y: centerY }
      });
    }
    
    if (e.touches.length === 1 && enablePan && onPan) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const deltaX = currentX - lastPanPositionRef.current.x;
      const deltaY = currentY - lastPanPositionRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > panThreshold) {
        onPan({ deltaX, deltaY, distance });
        lastPanPositionRef.current = { x: currentX, y: currentY };
      }
    }
  }, [enablePinch, enablePan, onPinch, onPan, calculateDistance, panThreshold]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartRef.current.length === 1 && enableSwipe && onSwipe) {
      const touchStart = touchStartRef.current[0];
      const touchEnd = e.changedTouches[0];
      
      const startPos = { x: touchStart.clientX, y: touchStart.clientY };
      const endPos = { x: touchEnd.clientX, y: touchEnd.clientY };
      
      const dx = endPos.x - startPos.x;
      const dy = endPos.y - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > swipeThreshold) {
        const duration = Date.now() - touchStartTimeRef.current;
        const velocity = distance / duration;
        const direction = calculateDirection(startPos, endPos);
        
        onSwipe({ direction, distance, velocity, duration });
      }
    }
    
    touchStartRef.current = [];
  }, [enableSwipe, onSwipe, swipeThreshold, calculateDirection]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

/**
 * Swipeable Container Component
 */
interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  className = '',
  style = {}
}) => {
  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    switch (gesture.direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  const gestureHandlers = useGesture({
    onSwipe: handleSwipe,
    swipeThreshold,
    enableSwipe: true
  });
  
  return (
    <div
      className={className}
      style={{ ...style, touchAction: 'pan-x pan-y' }}
      {...gestureHandlers}
    >
      {children}
    </div>
  );
};

/**
 * Touch-optimized Card Component
 */
interface TouchCardProps {
  children: ReactNode;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: HapticPattern | false;
  className?: string;
  style?: React.CSSProperties;
  pressable?: boolean;
  longPressDelay?: number;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  hapticFeedback: hapticPattern = 'light',
  className = '',
  style = {},
  pressable = true,
  longPressDelay = 500
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isTouch } = useResponsive();
  
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  
  const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    if (!pressable) return;
    
    setIsPressed(true);
    
    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        
        if (hapticPattern) {
          hapticFeedback.vibrate('heavy');
        }
        
        setIsPressed(false);
      }, longPressDelay);
    }
  }, [pressable, onLongPress, hapticPattern, longPressDelay]);
  
  const handleTouchEnd = useCallback((e: TouchEvent | MouseEvent) => {
    if (!pressable) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
    
    // Handle tap and double tap
    const now = Date.now();
    tapCountRef.current++;
    
    if (tapCountRef.current === 1) {
      setTimeout(() => {
        if (tapCountRef.current === 1) {
          // Single tap
          if (onTap) {
            onTap();
            
            if (hapticPattern) {
              hapticFeedback.vibrate(hapticPattern);
            }
          }
        } else if (tapCountRef.current === 2) {
          // Double tap
          if (onDoubleTap) {
            onDoubleTap();
            
            if (hapticPattern) {
              hapticFeedback.vibrate('medium');
            }
          }
        }
        
        tapCountRef.current = 0;
      }, 300);
    }
    
    lastTapRef.current = now;
  }, [pressable, onTap, onDoubleTap, hapticPattern]);
  
  const cardStyles = useMemo(() => ({
    transform: pressable && isPressed ? 'scale(0.98)' : 'scale(1)',
    opacity: pressable && isPressed ? 0.9 : 1,
    transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
    cursor: pressable ? 'pointer' : 'default',
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    ...style
  }), [pressable, isPressed, style]);
  
  const cardClassName = useMemo(() => {
    const baseClasses = 'bg-white rounded-lg shadow-md';
    const interactiveClasses = pressable ? 'hover:shadow-lg active:shadow-sm' : '';
    
    return `${baseClasses} ${interactiveClasses} ${className}`.trim();
  }, [pressable, className]);
  
  return (
    <div
      className={cardClassName}
      style={cardStyles}
      onTouchStart={handleTouchStart as TouchHandler}
      onTouchEnd={handleTouchEnd as TouchHandler}
      onMouseDown={handleTouchStart as TouchHandler}
      onMouseUp={handleTouchEnd as TouchHandler}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
};

/**
 * Pull-to-Refresh Component
 */
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
  refreshingComponent?: ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 60,
  className = '',
  refreshingComponent
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handlePan = useCallback((gesture: PanGesture) => {
    if (gesture.deltaY > 0 && window.scrollY <= 0) {
      setIsPulling(true);
      setPullDistance(Math.min(gesture.deltaY, refreshThreshold * 1.5));
    }
  }, [refreshThreshold]);
  
  const handleTouchEnd = useCallback(async () => {
    if (isPulling && pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      hapticFeedback.notification('success');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, refreshThreshold, onRefresh]);
  
  const gestureHandlers = useGesture({
    onPan: handlePan,
    enablePan: true
  });
  
  const containerStyles = useMemo(() => ({
    transform: `translateY(${isPulling ? pullDistance : 0}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
  }), [isPulling, pullDistance]);
  
  const refreshIndicatorOpacity = pullDistance / refreshThreshold;
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 -mt-16 z-10"
        style={{ opacity: Math.min(refreshIndicatorOpacity, 1) }}
      >
        {isRefreshing ? (
          refreshingComponent || (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          )
        ) : (
          <div className="flex items-center space-x-2 text-gray-600">
            <svg 
              className={`w-6 h-6 transition-transform ${pullDistance >= refreshThreshold ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-medium">
              {pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div 
        style={containerStyles}
        {...gestureHandlers}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Touch-optimized Slider Component
 */
interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
  hapticFeedback?: boolean;
}

export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  trackClassName = '',
  thumbClassName = '',
  hapticFeedback = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const percentage = ((value - min) / (max - min)) * 100;
  
  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    
    const rawValue = min + (percentage / 100) * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    if (clampedValue !== value) {
      onChange(clampedValue);
      
      if (hapticFeedback) {
        hapticFeedback.impact('light');
      }
    }
  }, [value, onChange, min, max, step, hapticFeedback]);
  
  const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateValue(clientX);
  }, [updateValue]);
  
  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateValue(clientX);
  }, [isDragging, updateValue]);
  
  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: globalThis.MouseEvent) => handleMove(e as any);
    const handleMouseUp = () => handleEnd();
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);
  
  return (
    <div className={`relative py-4 ${className}`}>
      <div
        ref={trackRef}
        className={`relative w-full h-2 bg-gray-200 rounded-full cursor-pointer ${trackClassName}`}
        onTouchStart={handleStart as TouchHandler}
        onMouseDown={handleStart as TouchHandler}
        onTouchMove={handleMove as TouchHandler}
        onTouchEnd={handleEnd}
      >
        {/* Progress track */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-600 rounded-full shadow-md transform -translate-y-1/2 cursor-grab ${isDragging ? 'cursor-grabbing scale-110' : ''} transition-transform ${thumbClassName}`}
          style={{ 
            left: `calc(${percentage}% - 12px)`,
            touchAction: 'none'
          }}
        />
      </div>
    </div>
  );
};

// Export all components and utilities
export default {
  TouchButton,
  TouchInput,
  TouchCard,
  Swipeable,
  PullToRefresh,
  TouchSlider,
  useGesture,
  hapticFeedback
};