const axios = require('axios');

// 配置
const config = {
    targetUrl: process.env.TARGET_URL || 'http://localhost:3001',
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 50,
    testDuration: parseInt(process.env.TEST_DURATION) || 300, // 秒
    rampUpTime: 30 // 秒
};

// 统计数据
let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    startTime: Date.now()
};

// 测试场景
const scenarios = [
    {
        name: 'User Login',
        weight: 0.3,
        execute: async () => {
            const start = Date.now();
            try {
                const response = await axios.post(`${config.targetUrl}/api/auth/login`, {
                    email: `test${Math.floor(Math.random() * 100)}@pokeriq.com`,
                    password: 'test123456'
                });
                const duration = Date.now() - start;
                stats.responseTimes.push(duration);
                stats.successfulRequests++;
                return { success: true, duration };
            } catch (error) {
                stats.failedRequests++;
                return { success: false, error: error.message };
            }
        }
    },
    {
        name: 'Get Recommendations',
        weight: 0.3,
        execute: async () => {
            const start = Date.now();
            try {
                const response = await axios.get(`${config.targetUrl}/api/recommendations/user_${Math.floor(Math.random() * 100)}`);
                const duration = Date.now() - start;
                stats.responseTimes.push(duration);
                stats.successfulRequests++;
                return { success: true, duration };
            } catch (error) {
                stats.failedRequests++;
                return { success: false, error: error.message };
            }
        }
    },
    {
        name: 'Calculate GTO Strategy',
        weight: 0.2,
        execute: async () => {
            const start = Date.now();
            try {
                const response = await axios.post(`${config.targetUrl}/api/gto/calculate`, {
                    position: 'BTN',
                    hole_cards: 'AhKd',
                    pot_size: 100,
                    stack_size: 1000
                });
                const duration = Date.now() - start;
                stats.responseTimes.push(duration);
                stats.successfulRequests++;
                return { success: true, duration };
            } catch (error) {
                stats.failedRequests++;
                return { success: false, error: error.message };
            }
        }
    },
    {
        name: 'Get User Profile',
        weight: 0.2,
        execute: async () => {
            const start = Date.now();
            try {
                const response = await axios.get(`${config.targetUrl}/api/profile/user_${Math.floor(Math.random() * 100)}`);
                const duration = Date.now() - start;
                stats.responseTimes.push(duration);
                stats.successfulRequests++;
                return { success: true, duration };
            } catch (error) {
                stats.failedRequests++;
                return { success: false, error: error.message };
            }
        }
    }
];

// 选择场景
function selectScenario() {
    const random = Math.random();
    let accumulator = 0;
    
    for (const scenario of scenarios) {
        accumulator += scenario.weight;
        if (random <= accumulator) {
            return scenario;
        }
    }
    
    return scenarios[0];
}

// 虚拟用户
async function virtualUser(userId) {
    console.log(`🚀 Virtual user ${userId} started`);
    
    while (Date.now() - stats.startTime < config.testDuration * 1000) {
        const scenario = selectScenario();
        stats.totalRequests++;
        
        try {
            const result = await scenario.execute();
            if (result.success) {
                console.log(`✅ User ${userId} - ${scenario.name}: ${result.duration}ms`);
            } else {
                console.log(`❌ User ${userId} - ${scenario.name}: Failed`);
            }
        } catch (error) {
            console.error(`💥 User ${userId} - ${scenario.name}: Error - ${error.message}`);
        }
        
        // 随机等待 1-3 秒
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
    
    console.log(`👋 Virtual user ${userId} finished`);
}

// 打印统计报告
function printReport() {
    const duration = (Date.now() - stats.startTime) / 1000;
    const avgResponseTime = stats.responseTimes.length > 0 
        ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length 
        : 0;
    const p95ResponseTime = stats.responseTimes.length > 0
        ? stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length * 0.95)]
        : 0;
    const p99ResponseTime = stats.responseTimes.length > 0
        ? stats.responseTimes.sort((a, b) => a - b)[Math.floor(stats.responseTimes.length * 0.99)]
        : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD TEST REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`👥 Concurrent Users: ${config.concurrentUsers}`);
    console.log(`🎯 Target URL: ${config.targetUrl}`);
    console.log('-'.repeat(60));
    console.log(`📈 Total Requests: ${stats.totalRequests}`);
    console.log(`✅ Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`❌ Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`🚀 Requests/sec: ${(stats.totalRequests / duration).toFixed(2)}`);
    console.log('-'.repeat(60));
    console.log('⏱️  Response Times:');
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   P95: ${p95ResponseTime}ms`);
    console.log(`   P99: ${p99ResponseTime}ms`);
    console.log(`   Min: ${Math.min(...stats.responseTimes)}ms`);
    console.log(`   Max: ${Math.max(...stats.responseTimes)}ms`);
    console.log('='.repeat(60));
    
    // 判断测试结果
    if (stats.failedRequests / stats.totalRequests > 0.05) {
        console.log('⚠️  WARNING: Error rate exceeds 5%');
    }
    if (avgResponseTime > 1000) {
        console.log('⚠️  WARNING: Average response time exceeds 1 second');
    }
    if (p95ResponseTime > 2000) {
        console.log('⚠️  WARNING: P95 response time exceeds 2 seconds');
    }
    
    console.log('\n✨ Load test completed!');
}

// 主函数
async function main() {
    console.log('🎯 PokerIQ Pro Load Testing Tool');
    console.log(`📍 Target: ${config.targetUrl}`);
    console.log(`👥 Users: ${config.concurrentUsers}`);
    console.log(`⏰ Duration: ${config.testDuration}s`);
    console.log('='.repeat(60));
    
    // 渐进式启动用户
    const users = [];
    const usersPerSecond = config.concurrentUsers / config.rampUpTime;
    
    for (let i = 0; i < config.concurrentUsers; i++) {
        users.push(virtualUser(i + 1));
        
        // 渐进式延迟
        if (i < config.concurrentUsers - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 / usersPerSecond));
        }
    }
    
    // 等待所有用户完成
    await Promise.all(users);
    
    // 打印报告
    printReport();
    
    // 根据结果设置退出码
    const errorRate = stats.failedRequests / stats.totalRequests;
    process.exit(errorRate > 0.1 ? 1 : 0);
}

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n⚠️  Test interrupted by user');
    printReport();
    process.exit(0);
});

// 运行测试
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});