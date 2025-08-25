# 智能对手建模系统部署指南

## 系统概述

智能对手建模系统是一个基于深度学习和博弈论的AI对手系统，能够提供真正有挑战性的训练对手，通过图灵测试（90%用户认为是真人），策略预测准确率超过80%，响应时间低于50ms。

### 核心特性

- **15种不同风格的AI对手**：从初学者到专家级别
- **实时行为预测**：基于LSTM/Transformer模型
- **自适应策略调整**：实时学习和适应用户行为
- **动态难度调整**：根据用户技能水平自动调整
- **高性能架构**：支持并发用户和实时响应

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     智能对手建模系统                              │
├─────────────────────────────────────────────────────────────────┤
│  API网关层                                                      │
│  ├─ FastAPI服务 (behavior_prediction_service.py)              │
│  ├─ WebSocket支持                                             │
│  └─ 认证和授权                                                │
├─────────────────────────────────────────────────────────────────┤
│  核心引擎层                                                     │
│  ├─ 智能对手引擎 (intelligent_opponent_model.py)              │
│  ├─ 自适应策略引擎 (adaptive_strategy_engine.py)              │
│  ├─ 动态难度系统 (dynamic_difficulty_system.py)              │
│  └─ 训练集成接口 (training_integration_interface.py)         │
├─────────────────────────────────────────────────────────────────┤
│  数据处理层                                                     │
│  ├─ 训练数据管道 (training_data_pipeline.py)                  │
│  ├─ 特征提取器                                                │
│  └─ 数据增强器                                                │
├─────────────────────────────────────────────────────────────────┤
│  模型层                                                         │
│  ├─ Transformer模型                                           │
│  ├─ LSTM模型                                                  │
│  ├─ 反制策略网络                                               │
│  └─ 模型缓存和优化                                             │
├─────────────────────────────────────────────────────────────────┤
│  存储层                                                         │
│  ├─ 模型存储 (PyTorch .pth)                                   │
│  ├─ 玩家档案数据库                                             │
│  ├─ 训练数据存储                                               │
│  └─ 缓存系统 (Redis)                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 环境要求

### 硬件要求

#### 最低配置
- CPU: 4核心 2.5GHz
- 内存: 8GB RAM
- 存储: 20GB SSD
- GPU: 可选，NVIDIA GTX 1060或同等级别

#### 推荐配置
- CPU: 8核心 3.0GHz
- 内存: 16GB RAM
- 存储: 50GB NVMe SSD
- GPU: NVIDIA RTX 3060或更高

#### 生产环境配置
- CPU: 16核心 3.5GHz
- 内存: 32GB RAM
- 存储: 100GB NVMe SSD
- GPU: NVIDIA RTX 4080或更高
- 网络: 1Gbps带宽

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Windows 10+ / macOS 11+
- **Python**: 3.9+
- **CUDA**: 11.8+ (如使用GPU)
- **Docker**: 20.10+ (推荐)
- **Redis**: 6.0+
- **PostgreSQL**: 13+ (可选)

## 安装部署

### 方式一：Docker部署（推荐）

1. **克隆项目**
```bash
git clone https://github.com/your-repo/intelligent-opponent-system.git
cd intelligent-opponent-system
```

2. **构建Docker镜像**
```bash
# CPU版本
docker build -t intelligent-opponent:cpu -f Dockerfile.cpu .

# GPU版本
docker build -t intelligent-opponent:gpu -f Dockerfile.gpu .
```

3. **启动服务**
```bash
# 使用docker-compose
docker-compose up -d

# 或单独启动
docker run -d \
  --name intelligent-opponent \
  -p 8001:8001 \
  -v ./data:/app/data \
  -e DEVICE=cuda \
  -e MODEL_TYPE=transformer \
  intelligent-opponent:gpu
```

### 方式二：本地部署

1. **创建虚拟环境**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows
```

2. **安装依赖**
```bash
pip install -r requirements.txt

# GPU支持（可选）
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

3. **配置环境变量**
```bash
export DEVICE=cuda  # 或 cpu
export MODEL_TYPE=transformer  # 或 lstm
export REDIS_URL=redis://localhost:6379
export DATABASE_URL=postgresql://user:pass@localhost/dbname
```

4. **初始化数据**
```bash
python -m app.models.training_data_pipeline --init
```

5. **启动服务**
```bash
# 开发模式
uvicorn app.behavior_prediction_service:app --host 0.0.0.0 --port 8001 --reload

# 生产模式
gunicorn app.behavior_prediction_service:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### 方式三：Kubernetes部署

1. **创建命名空间**
```bash
kubectl create namespace intelligent-opponent
```

2. **部署配置**
```bash
kubectl apply -f k8s/
```

配置文件示例（k8s/deployment.yaml）：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intelligent-opponent
  namespace: intelligent-opponent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: intelligent-opponent
  template:
    metadata:
      labels:
        app: intelligent-opponent
    spec:
      containers:
      - name: api-server
        image: intelligent-opponent:latest
        ports:
        - containerPort: 8001
        env:
        - name: DEVICE
          value: "cuda"
        - name: MODEL_TYPE
          value: "transformer"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
            nvidia.com/gpu: 1
          limits:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
```

## 配置说明

### 环境变量配置

```bash
# 系统配置
DEVICE=cuda                    # 设备类型: cpu, cuda, mps
MODEL_TYPE=transformer         # 模型类型: transformer, lstm
DEBUG=false                   # 调试模式
LOG_LEVEL=INFO               # 日志级别

# 服务配置
HOST=0.0.0.0                 # 服务监听地址
PORT=8001                    # 服务端口
WORKERS=4                    # 工作进程数
MAX_REQUESTS_PER_SECOND=100  # 最大请求频率

# 数据库配置
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/db
CACHE_SIZE=10000             # 缓存大小

# AI模型配置
PREDICTION_TIMEOUT=0.05      # 预测超时时间(秒)
MIN_CONFIDENCE_THRESHOLD=0.7 # 最小置信度阈值
ADAPTATION_RATE=0.1         # 适应速度
DIFFICULTY_ADJUSTMENT_FREQ=10 # 难度调整频率
```

### 配置文件示例

创建 `config/production.yml`:
```yaml
system:
  debug: false
  log_level: "INFO"
  
service:
  host: "0.0.0.0"
  port: 8001
  workers: 4
  
model:
  device: "cuda"
  model_type: "transformer"
  batch_size: 32
  max_sequence_length: 50
  
performance:
  prediction_timeout: 0.05
  max_concurrent_requests: 200
  cache_size: 10000
  
integration:
  enable_real_time_adaptation: true
  enable_difficulty_adjustment: true
  adaptation_frequency: 10
  skill_evaluation_frequency: 50
```

## API使用指南

### 基础API调用

```python
import asyncio
import aiohttp

async def predict_opponent_action():
    """预测对手行为"""
    url = "http://localhost:8001/predict"
    
    payload = {
        "player_id": "opponent_123",
        "game_state": {
            "pot_size": 15.0,
            "stack_size": 85.0,
            "position_value": 0.8,
            "hand_strength": 0.65,
            "opponent_count": 2,
            "betting_round": 2,
            "street": "flop"
        },
        "opponent_style": "tight_aggressive"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            result = await response.json()
            print(f"预测动作: {result['predicted_action']}")
            print(f"置信度: {result['confidence']}")
            print(f"推理: {result['reasoning']}")

# 运行示例
asyncio.run(predict_opponent_action())
```

### 集成到现有训练系统

```python
from app.models.training_integration_interface import (
    IntelligentOpponentIntegrator, 
    IntegrationConfig, 
    IntegrationMode
)

async def integrate_with_training():
    """集成到训练系统"""
    
    # 创建集成配置
    config = IntegrationConfig(
        mode=IntegrationMode.TRAINING_ASSISTANT,
        enable_real_time_adaptation=True,
        enable_difficulty_adjustment=True,
        prediction_timeout=0.05
    )
    
    # 初始化集成器
    integrator = IntelligentOpponentIntegrator(config)
    await integrator.initialize()
    
    # 开始训练会话
    session_config = {
        "mode": "training_assistant",
        "opponent_count": 3,
        "difficulty": "adaptive"
    }
    
    context = await integrator.start_training_session("user_123", session_config)
    print(f"训练会话已开始: {context.session_id}")
    
    # 游戏循环
    for hand in range(100):
        # 获取对手动作
        game_state = get_current_game_state()  # 您的游戏状态
        
        opponent_action = await integrator.get_opponent_action(
            context.session_id, "seat_0", game_state
        )
        
        # 处理对手动作...
        
        # 更新用户动作
        user_action = get_user_action()  # 您的用户动作
        game_result = get_game_result()  # 游戏结果
        
        feedback = await integrator.update_user_action(
            context.session_id, user_action, game_result
        )
        
        # 显示反馈给用户
        show_feedback_to_user(feedback)
    
    # 结束会话
    summary = await integrator.end_training_session(context.session_id)
    print(f"训练总结: {summary}")
    
    await integrator.shutdown()
```

### WebSocket实时连接

```javascript
// 前端WebSocket连接示例
const ws = new WebSocket('ws://localhost:8001/ws/realtime/player_123');

ws.onopen = function() {
    console.log('连接已建立');
    
    // 发送游戏状态
    const gameState = {
        game_state: {
            pot_size: 20,
            stack_size: 100,
            position_value: 0.7,
            hand_strength: 0.6,
            opponent_count: 2,
            street: "flop"
        },
        opponent_style: "loose_aggressive"
    };
    
    ws.send(JSON.stringify(gameState));
};

ws.onmessage = function(event) {
    const prediction = JSON.parse(event.data);
    console.log('对手预测:', prediction);
    
    // 处理预测结果
    handleOpponentAction(prediction);
};

function handleOpponentAction(prediction) {
    // 实现您的游戏逻辑
    console.log(`对手动作: ${prediction.predicted_action}`);
    console.log(`置信度: ${prediction.confidence}`);
    console.log(`推理: ${prediction.reasoning}`);
}
```

## 性能优化

### 模型优化

1. **模型量化**
```python
# 启用模型量化以减少内存和提高速度
import torch

# 动态量化
model_quantized = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
```

2. **批处理优化**
```python
# 配置批处理大小
BATCH_SIZE = 32  # 根据GPU内存调整
MAX_SEQUENCE_LENGTH = 50  # 根据需求调整
```

3. **缓存策略**
```python
# 启用预测结果缓存
CACHE_PREDICTIONS = True
CACHE_TTL = 300  # 5分钟缓存
```

### 系统优化

1. **内存优化**
```bash
# 调整Python内存分配
export PYTHONMALLOC=malloc

# 启用垃圾回收优化
export PYTHONOPTIMIZE=1
```

2. **并发优化**
```bash
# 调整工作进程数（CPU数量 × 2 + 1）
WORKERS=9

# 配置连接池
MAX_DB_CONNECTIONS=20
REDIS_POOL_SIZE=10
```

3. **GPU优化**
```python
# 设置GPU内存增长
import torch
torch.cuda.set_per_process_memory_fraction(0.8)

# 启用混合精度训练
torch.backends.cudnn.benchmark = True
```

## 监控和维护

### 健康检查

```bash
# 检查服务状态
curl http://localhost:8001/health

# 检查详细统计
curl http://localhost:8001/stats
```

### 日志配置

创建 `logging.conf`:
```ini
[loggers]
keys=root,intelligent_opponent

[handlers]
keys=consoleHandler,fileHandler

[formatters]
keys=detailFormatter

[logger_root]
level=INFO
handlers=consoleHandler,fileHandler

[logger_intelligent_opponent]
level=DEBUG
handlers=fileHandler
qualname=intelligent_opponent
propagate=0

[handler_consoleHandler]
class=StreamHandler
level=INFO
formatter=detailFormatter
args=(sys.stdout,)

[handler_fileHandler]
class=handlers.RotatingFileHandler
level=DEBUG
formatter=detailFormatter
args=('logs/intelligent_opponent.log', 'a', 10485760, 5)

[formatter_detailFormatter]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### 性能监控

```python
# 使用内置性能测试
from app.models.performance_testing_suite import run_comprehensive_tests

# 运行完整测试
report = await run_comprehensive_tests()
print(f"系统状态: {report['overall_status']}")
```

### 自动化监控脚本

创建 `monitor.py`:
```python
#!/usr/bin/env python3
import asyncio
import aiohttp
import time
import smtplib
from email.mime.text import MIMEText

async def health_check():
    """健康检查"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8001/health') as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data['status'] == 'healthy'
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    return False

async def monitor_loop():
    """监控循环"""
    consecutive_failures = 0
    
    while True:
        is_healthy = await health_check()
        
        if is_healthy:
            consecutive_failures = 0
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] System healthy")
        else:
            consecutive_failures += 1
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] System unhealthy ({consecutive_failures})")
            
            # 连续3次失败发送告警
            if consecutive_failures >= 3:
                send_alert(f"System has been unhealthy for {consecutive_failures} checks")
        
        await asyncio.sleep(60)  # 每分钟检查一次

def send_alert(message):
    """发送告警"""
    # 实现您的告警逻辑（邮件、短信、Slack等）
    pass

if __name__ == "__main__":
    asyncio.run(monitor_loop())
```

### 自动重启脚本

创建 `restart.sh`:
```bash
#!/bin/bash

# 智能对手系统自动重启脚本

SERVICE_NAME="intelligent-opponent"
LOG_FILE="/var/log/${SERVICE_NAME}/restart.log"

log() {
    echo "[$(date)] $1" | tee -a "$LOG_FILE"
}

restart_service() {
    log "Restarting $SERVICE_NAME..."
    
    if command -v systemctl &> /dev/null; then
        # systemd
        sudo systemctl restart $SERVICE_NAME
    elif command -v docker &> /dev/null; then
        # Docker
        docker restart $SERVICE_NAME
    elif command -v docker-compose &> /dev/null; then
        # Docker Compose
        cd /path/to/project && docker-compose restart
    else
        log "No supported service manager found"
        exit 1
    fi
    
    sleep 10
    
    # 验证服务是否启动成功
    if curl -s http://localhost:8001/health > /dev/null; then
        log "Service restarted successfully"
    else
        log "Service restart failed"
        exit 1
    fi
}

# 检查服务状态
if ! curl -s http://localhost:8001/health > /dev/null; then
    log "Service is down, attempting restart..."
    restart_service
else
    log "Service is running normally"
fi
```

## 故障排除

### 常见问题

1. **CUDA错误**
```
RuntimeError: CUDA out of memory
```
解决方案：
- 减少batch_size
- 设置PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
- 使用CPU模式

2. **预测超时**
```
Prediction timeout: 0.078s > 0.050s
```
解决方案：
- 增加PREDICTION_TIMEOUT
- 使用更快的GPU
- 启用模型量化

3. **内存泄漏**
```
Memory usage growing continuously
```
解决方案：
- 定期重启服务
- 清理模型缓存
- 调整垃圾回收参数

### 调试工具

1. **性能分析**
```python
# 使用内置性能分析器
import cProfile
cProfile.run('your_function()')

# 内存分析
import tracemalloc
tracemalloc.start()
# ... your code ...
current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 1024 / 1024:.1f}MB, Peak: {peak / 1024 / 1024:.1f}MB")
```

2. **日志分析**
```bash
# 查看实时日志
tail -f logs/intelligent_opponent.log

# 分析错误日志
grep -i error logs/intelligent_opponent.log | tail -20

# 分析性能日志
grep -i "response_time" logs/intelligent_opponent.log | awk '{print $NF}' | sort -n
```

## 更新和升级

### 版本更新流程

1. **备份数据**
```bash
# 备份模型和配置
tar -czf backup_$(date +%Y%m%d).tar.gz models/ config/ data/
```

2. **更新代码**
```bash
git fetch origin
git checkout v1.1.0  # 更新到指定版本
```

3. **更新依赖**
```bash
pip install -r requirements.txt --upgrade
```

4. **数据库迁移**（如需要）
```bash
python manage.py migrate
```

5. **重启服务**
```bash
docker-compose down
docker-compose up -d
```

### 回滚流程

```bash
# 停止服务
docker-compose down

# 恢复备份
tar -xzf backup_$(date +%Y%m%d).tar.gz

# 回滚代码
git checkout v1.0.0

# 重启服务
docker-compose up -d
```

## 安全配置

### API安全

1. **启用认证**
```python
# 在API中添加JWT认证
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/predict")
async def predict(request: PredictionRequest, token: str = Security(security)):
    # 验证token
    if not verify_token(token):
        raise HTTPException(status_code=401, detail="Invalid token")
    # ... 处理预测请求
```

2. **限制访问频率**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/predict")
@limiter.limit("100/minute")
async def predict(request: Request, ...):
    # ... 处理请求
```

### 网络安全

1. **HTTPS配置**
```bash
# 使用Let's Encrypt证书
certbot certonly --webroot -w /var/www/html -d your-domain.com

# Nginx配置
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. **防火墙配置**
```bash
# 只允许必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 附录

### 系统要求检查脚本

创建 `check_requirements.py`:
```python
#!/usr/bin/env python3
"""系统要求检查脚本"""

import sys
import subprocess
import platform
import psutil
import torch

def check_python_version():
    """检查Python版本"""
    version = sys.version_info
    if version >= (3, 9):
        print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"✗ Python {version.major}.{version.minor}.{version.micro} (需要3.9+)")
        return False

def check_system_resources():
    """检查系统资源"""
    # CPU
    cpu_count = psutil.cpu_count()
    print(f"CPU核心数: {cpu_count}")
    
    # 内存
    memory = psutil.virtual_memory()
    memory_gb = memory.total / (1024**3)
    print(f"总内存: {memory_gb:.1f}GB")
    
    # 磁盘空间
    disk = psutil.disk_usage('/')
    disk_gb = disk.free / (1024**3)
    print(f"可用磁盘空间: {disk_gb:.1f}GB")
    
    # 检查最低要求
    meets_requirements = True
    if cpu_count < 4:
        print("✗ CPU核心数不足（需要4+）")
        meets_requirements = False
    if memory_gb < 8:
        print("✗ 内存不足（需要8GB+）")
        meets_requirements = False
    if disk_gb < 20:
        print("✗ 磁盘空间不足（需要20GB+）")
        meets_requirements = False
    
    return meets_requirements

def check_gpu():
    """检查GPU支持"""
    if torch.cuda.is_available():
        gpu_count = torch.cuda.device_count()
        for i in range(gpu_count):
            gpu_name = torch.cuda.get_device_name(i)
            gpu_memory = torch.cuda.get_device_properties(i).total_memory / (1024**3)
            print(f"✓ GPU {i}: {gpu_name} ({gpu_memory:.1f}GB)")
        return True
    else:
        print("⚠ 未检测到CUDA GPU（可使用CPU模式）")
        return False

def check_dependencies():
    """检查依赖包"""
    required_packages = [
        'torch', 'numpy', 'pandas', 'fastapi', 'uvicorn',
        'redis', 'psutil', 'scikit-learn', 'matplotlib'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} (未安装)")
            missing_packages.append(package)
    
    return len(missing_packages) == 0

def main():
    """主检查函数"""
    print("智能对手建模系统 - 系统要求检查")
    print("=" * 50)
    
    checks = [
        ("Python版本", check_python_version),
        ("系统资源", check_system_resources),
        ("GPU支持", check_gpu),
        ("依赖包", check_dependencies)
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n检查{check_name}...")
        result = check_func()
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✓ 所有检查通过，系统满足运行要求")
    else:
        print("✗ 存在问题，请按照提示解决后重新检查")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
```

### 快速部署脚本

创建 `quick_deploy.sh`:
```bash
#!/bin/bash
# 智能对手建模系统快速部署脚本

set -e

echo "智能对手建模系统 - 快速部署"
echo "============================="

# 检查系统要求
echo "检查系统要求..."
python check_requirements.py || {
    echo "系统要求检查失败，请解决问题后重试"
    exit 1
}

# 安装依赖
echo "安装Python依赖..."
pip install -r requirements.txt

# 创建必要目录
echo "创建目录结构..."
mkdir -p logs data/cache data/models config

# 下载预训练模型（如果需要）
echo "检查模型文件..."
if [ ! -f "data/models/transformer_model.pth" ]; then
    echo "下载预训练模型..."
    wget -O data/models/transformer_model.pth https://example.com/models/transformer_model.pth
fi

# 配置环境变量
echo "配置环境变量..."
cat > .env << EOF
DEVICE=cuda
MODEL_TYPE=transformer
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8001
REDIS_URL=redis://localhost:6379
EOF

# 启动Redis（如果需要）
if ! pgrep -x "redis-server" > /dev/null; then
    echo "启动Redis..."
    redis-server --daemonize yes
fi

# 运行测试
echo "运行快速测试..."
python -m pytest tests/quick_test.py -v

# 启动服务
echo "启动智能对手建模服务..."
uvicorn app.behavior_prediction_service:app --host 0.0.0.0 --port 8001 &

# 等待服务启动
sleep 5

# 验证服务
echo "验证服务..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✓ 服务启动成功！"
    echo "API地址: http://localhost:8001"
    echo "文档地址: http://localhost:8001/docs"
else
    echo "✗ 服务启动失败"
    exit 1
fi

echo "部署完成！"
```

使用方法：
```bash
chmod +x quick_deploy.sh
./quick_deploy.sh
```

这个部署指南提供了完整的安装、配置、使用和维护说明，帮助您快速部署和使用智能对手建模系统。