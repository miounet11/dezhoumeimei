"""
PokerIQ Pro GTO系统性能测试
测试CFR算法准确性、响应时间和吞吐量
"""

import asyncio
import time
import json
import aiohttp
import pytest
import numpy as np
from typing import List, Dict, Any
from datetime import datetime
import statistics

# 测试配置
GTO_SERVICE_URL = "http://localhost:8000"
TEST_SCENARIOS = [
    {
        "name": "翻前premium对子",
        "game_state": {
            "street": "preflop",
            "pot": 3,
            "community_cards": "",
            "players": [
                {
                    "id": 0,
                    "position": "BTN",
                    "holeCards": "AsAc",
                    "stack": 100,
                    "invested": 3
                },
                {
                    "id": 1,
                    "position": "BB",
                    "holeCards": "XX",
                    "stack": 98,
                    "invested": 1
                }
            ],
            "current_player": 0,
            "history": [{"type": "raise", "amount": 3, "player": 0}]
        },
        "expected_action": "raise",
        "min_probability": 0.7
    },
    {
        "name": "翻牌顶对",
        "game_state": {
            "street": "flop",
            "pot": 20,
            "community_cards": "AhKd7c",
            "players": [
                {
                    "id": 0,
                    "position": "BTN", 
                    "holeCards": "AsKs",
                    "stack": 90,
                    "invested": 10
                },
                {
                    "id": 1,
                    "position": "BB",
                    "holeCards": "XX", 
                    "stack": 90,
                    "invested": 10
                }
            ],
            "current_player": 0,
            "history": []
        },
        "expected_action": "bet",
        "min_probability": 0.6
    },
    {
        "name": "河牌诈唬场景",
        "game_state": {
            "street": "river",
            "pot": 80,
            "community_cards": "AhKdQcJsTs",
            "players": [
                {
                    "id": 0,
                    "position": "BTN",
                    "holeCards": "7h6h",
                    "stack": 60,
                    "invested": 40
                },
                {
                    "id": 1,
                    "position": "BB",
                    "holeCards": "XX",
                    "stack": 60, 
                    "invested": 40
                }
            ],
            "current_player": 0,
            "history": []
        },
        "expected_action": "fold",
        "min_probability": 0.5
    }
]

class GTOPerformanceTester:
    """GTO系统性能测试器"""
    
    def __init__(self, service_url: str = GTO_SERVICE_URL):
        self.service_url = service_url
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def health_check(self) -> bool:
        """检查服务健康状态"""
        try:
            async with self.session.get(f"{self.service_url}/health") as response:
                data = await response.json()
                return data.get("status") == "healthy"
        except Exception as e:
            print(f"健康检查失败: {e}")
            return False
    
    async def test_single_strategy(self, game_state: Dict, iterations: int = 5000) -> Dict:
        """测试单次策略计算"""
        start_time = time.time()
        
        try:
            async with self.session.post(
                f"{self.service_url}/api/gto/strategy",
                json=game_state,
                params={"iterations": iterations}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    elapsed = time.time() - start_time
                    
                    return {
                        "success": True,
                        "response_time": elapsed,
                        "exploitability": result.get("exploitability", 1.0),
                        "iterations": result.get("iterations", 0),
                        "strategy": result.get("strategy", {}),
                        "confidence": result.get("confidence", 0.0)
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"HTTP {response.status}: {error_text}",
                        "response_time": time.time() - start_time
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time": time.time() - start_time
            }
    
    async def test_gto_analysis(self, game_state: Dict) -> Dict:
        """测试完整GTO分析"""
        start_time = time.time()
        
        try:
            async with self.session.post(
                f"{self.service_url}/api/gto/analysis",
                json=game_state
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    elapsed = time.time() - start_time
                    
                    return {
                        "success": True,
                        "response_time": elapsed,
                        "decision": result.get("decision", {}),
                        "hand_strength": result.get("hand_strength", 0.0),
                        "equity": result.get("equity", 0.0)
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"HTTP {response.status}: {error_text}",
                        "response_time": time.time() - start_time
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time": time.time() - start_time
            }
    
    async def concurrent_load_test(self, game_state: Dict, concurrent_requests: int = 10) -> Dict:
        """并发负载测试"""
        print(f"开始并发测试，并发数: {concurrent_requests}")
        start_time = time.time()
        
        # 创建并发任务
        tasks = [
            self.test_single_strategy(game_state, iterations=1000) 
            for _ in range(concurrent_requests)
        ]
        
        # 执行并发请求
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time
        
        # 统计结果
        successful = [r for r in results if isinstance(r, dict) and r.get("success")]
        failed = [r for r in results if not (isinstance(r, dict) and r.get("success"))]
        
        response_times = [r["response_time"] for r in successful]
        exploitabilities = [r["exploitability"] for r in successful]
        
        return {
            "total_requests": concurrent_requests,
            "successful": len(successful),
            "failed": len(failed),
            "success_rate": len(successful) / concurrent_requests,
            "total_time": total_time,
            "throughput": concurrent_requests / total_time,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "p95_response_time": np.percentile(response_times, 95) if response_times else 0,
            "avg_exploitability": statistics.mean(exploitabilities) if exploitabilities else 0
        }

async def run_accuracy_tests():
    """运行准确性测试"""
    print("=== GTO准确性测试 ===")
    
    async with GTOPerformanceTester() as tester:
        # 健康检查
        if not await tester.health_check():
            print("❌ 服务不可用")
            return False
        
        print("✅ 服务健康检查通过")
        
        # 测试各种场景
        all_passed = True
        for scenario in TEST_SCENARIOS:
            print(f"\n测试场景: {scenario['name']}")
            
            result = await tester.test_single_strategy(scenario["game_state"])
            
            if result["success"]:
                strategy = result["strategy"]
                exploitability = result["exploitability"]
                response_time = result["response_time"]
                
                # 检查主要动作概率
                expected_action = scenario["expected_action"]
                actual_probability = strategy.get(expected_action, 0.0)
                min_probability = scenario["min_probability"]
                
                print(f"  响应时间: {response_time:.3f}s")
                print(f"  可利用性: {exploitability:.6f}")
                print(f"  策略: {strategy}")
                print(f"  期望动作 {expected_action}: {actual_probability:.3f}")
                
                # 验证准确性
                accuracy_ok = actual_probability >= min_probability
                convergence_ok = exploitability < 0.01
                speed_ok = response_time < 0.1  # 100ms目标
                
                if accuracy_ok and convergence_ok:
                    print(f"  ✅ 准确性测试通过")
                else:
                    print(f"  ❌ 准确性测试失败")
                    if not accuracy_ok:
                        print(f"    期望动作概率过低: {actual_probability:.3f} < {min_probability}")
                    if not convergence_ok:
                        print(f"    策略未收敛: {exploitability:.6f} >= 0.01")
                    all_passed = False
                
                if speed_ok:
                    print(f"  ✅ 响应时间达标")
                else:
                    print(f"  ⚠️  响应时间超标: {response_time:.3f}s > 0.1s")
            else:
                print(f"  ❌ 请求失败: {result['error']}")
                all_passed = False
        
        return all_passed

async def run_performance_tests():
    """运行性能测试"""
    print("\n\n=== GTO性能测试 ===")
    
    async with GTOPerformanceTester() as tester:
        # 选择中等复杂度场景进行性能测试
        test_scenario = TEST_SCENARIOS[1]["game_state"]
        
        # 并发测试
        concurrency_levels = [1, 5, 10, 20]
        
        for concurrency in concurrency_levels:
            print(f"\n并发级别: {concurrency}")
            
            result = await tester.concurrent_load_test(test_scenario, concurrency)
            
            print(f"  总请求数: {result['total_requests']}")
            print(f"  成功请求: {result['successful']}")
            print(f"  成功率: {result['success_rate']:.1%}")
            print(f"  总耗时: {result['total_time']:.3f}s")
            print(f"  吞吐量: {result['throughput']:.1f} req/s")
            print(f"  平均响应时间: {result['avg_response_time']:.3f}s")
            print(f"  P95响应时间: {result['p95_response_time']:.3f}s")
            print(f"  平均可利用性: {result['avg_exploitability']:.6f}")
            
            # 性能基准验证
            throughput_ok = result['throughput'] >= 10  # 至少10 req/s
            avg_response_ok = result['avg_response_time'] <= 0.2  # 平均响应 <= 200ms
            success_rate_ok = result['success_rate'] >= 0.95  # 成功率 >= 95%
            
            if throughput_ok and avg_response_ok and success_rate_ok:
                print(f"  ✅ 性能测试通过")
            else:
                print(f"  ⚠️  性能需要优化")
                if not throughput_ok:
                    print(f"    吞吐量过低: {result['throughput']:.1f} < 10 req/s")
                if not avg_response_ok:
                    print(f"    响应时间过长: {result['avg_response_time']:.3f}s > 0.2s")
                if not success_rate_ok:
                    print(f"    成功率过低: {result['success_rate']:.1%} < 95%")

async def run_cache_performance_test():
    """运行缓存性能测试"""
    print("\n\n=== 缓存性能测试 ===")
    
    async with GTOPerformanceTester() as tester:
        test_scenario = TEST_SCENARIOS[0]["game_state"]
        
        # 第一次请求（缓存miss）
        print("第一次请求（缓存miss）:")
        result1 = await tester.test_single_strategy(test_scenario)
        if result1["success"]:
            print(f"  响应时间: {result1['response_time']:.3f}s")
        
        # 等待一秒确保缓存写入
        await asyncio.sleep(1)
        
        # 第二次相同请求（缓存hit）
        print("第二次请求（缓存hit）:")
        result2 = await tester.test_single_strategy(test_scenario)
        if result2["success"]:
            print(f"  响应时间: {result2['response_time']:.3f}s")
            
            if result2["response_time"] < result1["response_time"]:
                speedup = result1["response_time"] / result2["response_time"]
                print(f"  ✅ 缓存加速: {speedup:.1f}x")
            else:
                print(f"  ⚠️  缓存未生效")

async def main():
    """主测试函数"""
    print("PokerIQ Pro GTO系统性能测试")
    print("=" * 50)
    
    start_time = datetime.now()
    
    try:
        # 运行准确性测试
        accuracy_passed = await run_accuracy_tests()
        
        # 运行性能测试
        await run_performance_tests()
        
        # 运行缓存测试
        await run_cache_performance_test()
        
        elapsed = datetime.now() - start_time
        
        print("\n\n=== 测试总结 ===")
        print(f"总测试时间: {elapsed.total_seconds():.1f}s")
        
        if accuracy_passed:
            print("✅ GTO算法准确性: PASS")
        else:
            print("❌ GTO算法准确性: FAIL")
        
        print("\n建议:")
        print("1. 确保Redis服务正常运行以获得最佳缓存性能")
        print("2. 根据负载情况调整CFR迭代次数")
        print("3. 监控系统资源使用情况")
        print("4. 定期清理过期缓存策略")
        
    except KeyboardInterrupt:
        print("\n测试被用户中断")
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")

if __name__ == "__main__":
    # Pytest兼容性
    if len(__import__('sys').argv) > 1 and '--benchmark-only' in __import__('sys').argv:
        print("运行基准测试模式...")
    
    asyncio.run(main())