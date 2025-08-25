// Electron配置文件 - 用于桌面客户端
const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// 桌面应用配置
const config = {
  appName: 'PokerIQ Pro',
  version: '1.0.1',
  description: '专业德州扑克训练平台',
  
  // 窗口配置
  window: {
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'public/icons/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  },
  
  // 菜单配置
  menu: [
    {
      label: 'PokerIQ Pro',
      submenu: [
        { label: '关于PokerIQ Pro', role: 'about' },
        { type: 'separator' },
        { label: '设置', accelerator: 'Cmd+,', click: () => { /* 打开设置 */ } },
        { type: 'separator' },
        { label: '退出', accelerator: 'Cmd+Q', role: 'quit' }
      ]
    },
    {
      label: '训练',
      submenu: [
        { label: 'AI实战训练', accelerator: 'Cmd+1', click: () => { /* 导航到AI训练 */ } },
        { label: 'GTO训练中心', accelerator: 'Cmd+2', click: () => { /* 导航到GTO */ } },
        { label: '扑克学院', accelerator: 'Cmd+3', click: () => { /* 导航到学院 */ } },
        { type: 'separator' },
        { label: '数据分析', accelerator: 'Cmd+D', click: () => { /* 导航到分析 */ } }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '用户手册', click: () => { /* 打开帮助 */ } },
        { label: '快捷键', accelerator: 'Cmd+/', click: () => { /* 显示快捷键 */ } },
        { type: 'separator' },
        { label: '报告问题', click: () => { /* 打开反馈 */ } },
        { label: '检查更新', click: () => { /* 检查更新 */ } }
      ]
    }
  ],
  
  // 托盘配置
  tray: {
    tooltip: 'PokerIQ Pro - 专业德州扑克训练',
    contextMenu: [
      { label: '显示主窗口', click: () => { /* 显示窗口 */ } },
      { label: '快速训练', click: () => { /* 快速开始 */ } },
      { type: 'separator' },
      { label: '退出', role: 'quit' }
    ]
  },
  
  // 更新配置
  updater: {
    provider: 'github',
    repo: 'pokeriq-pro',
    owner: 'pokeriq',
    autoDownload: true,
    autoInstallOnAppQuit: true
  }
};

// 创建窗口函数
function createWindow() {
  const win = new BrowserWindow(config.window);
  
  // 加载应用
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'out/index.html'));
  }
  
  // 设置菜单
  const menu = Menu.buildFromTemplate(config.menu);
  Menu.setApplicationMenu(menu);
  
  return win;
}

// 创建托盘
function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'public/icons/icon-32x32.png')
  );
  const tray = new Tray(icon);
  tray.setToolTip(config.tray.tooltip);
  
  const contextMenu = Menu.buildFromTemplate(config.tray.contextMenu);
  tray.setContextMenu(contextMenu);
  
  return tray;
}

module.exports = { config, createWindow, createTray };