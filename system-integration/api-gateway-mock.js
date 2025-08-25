const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
            postgres: 'connected',
            redis: 'connected',
            gto: 'mocked',
            profile: 'mocked',
            recommendation: 'mocked'
        }
    });
});

// Mock Auth endpoints
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'test@pokeriq.com' && password === 'test123456') {
        res.json({
            success: true,
            token: 'mock-jwt-token-' + Date.now(),
            user: {
                id: 'user_1',
                email: email,
                username: 'testuser',
                level: 5
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/auth/register', (req, res) => {
    res.json({
        success: true,
        message: 'User registered successfully',
        userId: 'user_' + Date.now()
    });
});

// Mock GTO endpoints
app.post('/api/gto/strategy', (req, res) => {
    res.json({
        strategies: [
            { action: 'raise', frequency: 0.7, ev: 5.2, reasoning: '强牌在有利位置' },
            { action: 'call', frequency: 0.3, ev: 2.1, reasoning: '平衡策略' }
        ],
        optimal_action: 'raise',
        confidence: 0.85
    });
});

app.post('/api/gto/calculate', (req, res) => {
    res.json({
        strategies: [
            { action: 'raise', frequency: 0.6, ev: 4.5 },
            { action: 'call', frequency: 0.3, ev: 1.8 },
            { action: 'fold', frequency: 0.1, ev: 0 }
        ],
        calculation_time_ms: 45
    });
});

// Mock Profile endpoints
app.get('/api/profile/:userId', (req, res) => {
    res.json({
        user_id: req.params.userId,
        preflop_skill: 1200,
        postflop_skill: 1150,
        psychology_skill: 1100,
        mathematics_skill: 1050,
        bankroll_skill: 1000,
        tournament_skill: 950,
        last_updated: new Date().toISOString()
    });
});

// Mock Recommendation endpoints
app.get('/api/recommendations/:userId', (req, res) => {
    res.json([
        {
            recommendation_id: 'rec_1',
            type: 'scenario',
            title: '按钮位置的3-bet策略',
            description: '学习在按钮位置的激进打法',
            difficulty: 3,
            estimated_time_minutes: 30,
            relevance_score: 0.92
        },
        {
            recommendation_id: 'rec_2',
            type: 'drill',
            title: '底池赔率计算',
            description: '强化数学计算能力',
            difficulty: 2,
            estimated_time_minutes: 15,
            relevance_score: 0.88
        }
    ]);
});

// Mock Training endpoints
app.post('/api/training/start', (req, res) => {
    res.json({
        session_id: 'session_' + Date.now(),
        status: 'started',
        training_type: req.body.trainingType || 'quick',
        difficulty: req.body.difficulty || 1
    });
});

app.get('/api/training/recommendations/:userId', (req, res) => {
    res.json({
        recommendations: [
            { id: 1, title: 'GTO基础训练', type: 'course' },
            { id: 2, title: '3-bet策略', type: 'scenario' },
            { id: 3, title: '底池计算练习', type: 'drill' }
        ]
    });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
    res.type('text/plain');
    res.send(`# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 1234

# HELP response_time_seconds Response time in seconds
# TYPE response_time_seconds histogram
response_time_seconds_bucket{le="0.1"} 500
response_time_seconds_bucket{le="0.5"} 800
response_time_seconds_bucket{le="1"} 950
response_time_seconds_bucket{le="+Inf"} 1000
response_time_seconds_sum 450.5
response_time_seconds_count 1000`);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mock API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});