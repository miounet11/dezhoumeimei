import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 启用类模式的深色主题
  theme: {
    extend: {
      // 颜色主题
      colors: {
        // 主品牌色
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // 辅助色
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // 成功色
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // 警告色
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // 错误色
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // 扑克相关颜色
        poker: {
          felt: '#0f5132', // 扑克桌绿色
          'felt-light': '#198754',
          'felt-dark': '#0a3622',
          chip: {
            white: '#f8f9fa',
            red: '#dc3545',
            green: '#198754',
            blue: '#0d6efd',
            black: '#212529',
            purple: '#6f42c1',
            yellow: '#ffc107',
            orange: '#fd7e14',
          },
          card: {
            back: '#1a365d',
            face: '#ffffff',
            border: '#e2e8f0',
          }
        },
        // 成就稀有度颜色
        rarity: {
          common: '#6b7280',
          rare: '#3b82f6',
          epic: '#8b5cf6',
          legendary: '#f59e0b',
        }
      },
      // 字体
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'chip-bounce': 'chipBounce 0.4s ease-out',
      },
      // 关键帧动画
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '70%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(-90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        chipBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      // 阴影
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.1)',
        'hard': '0 8px 30px 0 rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'poker-table': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      // 渐变
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-poker': 'linear-gradient(135deg, #0f5132 0%, #198754 50%, #20c997 100%)',
        'gradient-card': 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        'gradient-chip': 'linear-gradient(145deg, var(--chip-color) 0%, var(--chip-color-dark) 100%)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)',
      },
      // 边框半径
      borderRadius: {
        'card': '0.75rem',
        'chip': '50%',
        'button': '0.5rem',
      },
      // 间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
      },
      // 宽高
      width: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
      },
      height: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
      },
      // 模糊效果
      backdropBlur: {
        xs: '2px',
      },
      // 层级
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // 断点
      screens: {
        'xs': '475px',
        '3xl': '1680px',
        '4xl': '2000px',
      },
      // 过渡
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'colors-shadow': 'color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow',
      },
      // 变换
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      // 透明度
      opacity: {
        '15': '0.15',
        '85': '0.85',
      }
    },
  },
  plugins: [
    // 自定义插件
    function({ addUtilities }: any) {
      const newUtilities = {
        // 扑克桌面样式
        '.poker-table': {
          background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3622 100%)',
          borderRadius: '50%',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            background: 'radial-gradient(ellipse at center, #198754 0%, #0f5132 100%)',
            borderRadius: '50%',
            border: '3px solid #20c997',
          }
        },
        // 扑克牌样式
        '.poker-card': {
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          }
        },
        // 筹码样式
        '.poker-chip': {
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '60%',
            border: '2px dashed rgba(255, 255, 255, 0.5)',
            borderRadius: '50%',
          }
        },
        // 发光效果
        '.glow-effect': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #f59e0b, #ef4444)',
            borderRadius: 'inherit',
            zIndex: '-1',
            filter: 'blur(4px)',
            opacity: '0.7',
            animation: 'glow 2s ease-in-out infinite alternate',
          }
        },
        // 玻璃态效果
        '.glass-effect': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        // 渐变文字
        '.gradient-text': {
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
        // 卡片悬浮效果
        '.card-hover': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }
      };
      addUtilities(newUtilities);
    }
  ],
};

export default config;