// 统一主题配置
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#722ed1',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    
    // 文字颜色
    colorTextBase: '#333333',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorTextQuaternary: '#cccccc',
    
    // 背景色
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorBgElevated: '#ffffff',
    
    // 边框
    colorBorder: '#e8e8e8',
    colorBorderSecondary: '#f0f0f0',
    
    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    
    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    
    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#1a1a2e',
      bodyBg: '#f0f2f5',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'rgba(255, 255, 255, 0.02)',
      darkItemSelectedBg: '#722ed1',
      darkItemHoverBg: 'rgba(114, 46, 209, 0.3)',
    },
    Card: {
      headerBg: '#fafafa',
      paddingLG: 24,
    },
    Button: {
      primaryColor: '#ffffff',
      borderRadius: 6,
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
    Modal: {
      headerBg: '#ffffff',
      contentBg: '#ffffff',
    },
    Tabs: {
      cardBg: '#fafafa',
    },
  },
};

// 扑克游戏专用颜色
export const pokerColors = {
  // 花色
  spades: '#000000',
  hearts: '#ff0000',
  diamonds: '#ff0000',
  clubs: '#000000',
  
  // 筹码颜色
  chip1: '#ffffff',
  chip5: '#ff0000',
  chip25: '#00ff00',
  chip100: '#000000',
  chip500: '#722ed1',
  chip1000: '#ffd700',
  
  // 牌桌
  felt: '#2d5a2d',
  feltBorder: '#8b4513',
  
  // 状态色
  win: '#52c41a',
  lose: '#f5222d',
  draw: '#faad14',
  fold: '#999999',
  
  // 位置颜色
  dealer: '#ffd700',
  smallBlind: '#1890ff',
  bigBlind: '#f5222d',
};

// 响应式断点
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// 动画配置
export const animations = {
  duration: {
    fast: '0.1s',
    normal: '0.3s',
    slow: '0.5s',
  },
  easing: {
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
};

// Z-index层级
export const zIndex = {
  dropdown: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 1090,
};