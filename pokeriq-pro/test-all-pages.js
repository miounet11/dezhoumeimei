const http = require('http');

const pages = [
  { path: '/', name: '首页' },
  { path: '/home', name: '营销首页' },
  { path: '/auth/login', name: '登录页' },
  { path: '/auth/register', name: '注册页' },
  { path: '/dashboard', name: '控制台' },
  { path: '/game', name: '游戏页面' },
  { path: '/battle', name: '对战大厅' },
  { path: '/ai-training', name: 'AI训练' },
  { path: '/gto-training', name: 'GTO策略' },
  { path: '/study', name: '学习中心' },
  { path: '/companion-center', name: '陪伴中心' },
  { path: '/analytics', name: '数据分析' },
  { path: '/advanced-analytics', name: '高级分析' },
  { path: '/achievements', name: '成就系统' },
  { path: '/journey', name: '成长之旅' },
  { path: '/profile', name: '个人资料' },
  { path: '/settings', name: '设置中心' },
  { path: '/subscription', name: '订阅管理' },
  { path: '/social', name: '社交中心' },
  { path: '/events', name: '活动中心' }
];

console.log('🧪 开始测试所有页面...\n');
console.log('=' .repeat(50));

let successCount = 0;
let failCount = 0;

pages.forEach((page, index) => {
  setTimeout(() => {
    const options = {
      hostname: 'localhost',
      port: 8820,
      path: page.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      const statusIcon = status === 200 ? '✅' : '❌';
      const statusColor = status === 200 ? '\x1b[32m' : '\x1b[31m';
      
      if (status === 200) successCount++;
      else failCount++;
      
      console.log(`${statusIcon} ${statusColor}[${status}]\x1b[0m ${page.name.padEnd(20)} ${page.path}`);
      
      if (index === pages.length - 1) {
        setTimeout(() => {
          console.log('=' .repeat(50));
          console.log('\n📊 测试结果汇总:');
          console.log(`✅ 成功: ${successCount}/${pages.length}`);
          console.log(`❌ 失败: ${failCount}/${pages.length}`);
          console.log(`📈 成功率: ${((successCount/pages.length)*100).toFixed(1)}%`);
          
          if (successCount === pages.length) {
            console.log('\n🎉 所有页面测试通过！系统已准备好部署！');
          } else {
            console.log('\n⚠️  部分页面存在问题，请检查后再部署。');
          }
        }, 100);
      }
    });

    req.on('error', (e) => {
      failCount++;
      console.log(`❌ \x1b[31m[ERR]\x1b[0m ${page.name.padEnd(20)} ${page.path} - ${e.message}`);
    });

    req.on('timeout', () => {
      req.destroy();
      failCount++;
      console.log(`❌ \x1b[31m[TIMEOUT]\x1b[0m ${page.name.padEnd(20)} ${page.path}`);
    });

    req.end();
  }, index * 200);
});