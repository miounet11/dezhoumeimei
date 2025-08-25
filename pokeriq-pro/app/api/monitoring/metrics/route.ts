import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('metrics-api');

// 存储指标数据（生产环境应使用时序数据库如InfluxDB或Prometheus）
const metricsStore: Map<string, any[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { metrics } = await request.json();
    
    // 处理接收到的指标
    for (const metric of metrics) {
      if (!metricsStore.has(metric.name)) {
        metricsStore.set(metric.name, []);
      }
      
      const stored = metricsStore.get(metric.name)!;
      stored.push(...metric.values);
      
      // 限制存储大小
      if (stored.length > 10000) {
        stored.splice(0, stored.length - 10000);
      }
    }
    
    logger.info('Metrics received', { count: metrics.length });
    
    // 在生产环境中，这里应该将指标发送到监控服务
    // 例如：Datadog, New Relic, CloudWatch等
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process metrics', { error });
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const format = searchParams.get('format') || 'json';
    
    if (format === 'prometheus') {
      // Prometheus格式输出
      let output = '';
      
      metricsStore.forEach((values, metricName) => {
        if (name && !metricName.includes(name)) return;
        
        const latestValues = values.slice(-100);
        const sum = latestValues.reduce((acc, v) => acc + v.value, 0);
        const count = latestValues.length;
        
        output += `# TYPE ${metricName.replace(/\./g, '_')} gauge\n`;
        output += `${metricName.replace(/\./g, '_')} ${sum / count}\n`;
      });
      
      return new NextResponse(output, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
        },
      });
    }
    
    // JSON格式输出
    const result: Record<string, any> = {};
    
    metricsStore.forEach((values, metricName) => {
      if (name && !metricName.includes(name)) return;
      
      const latestValues = values.slice(-100);
      const sum = latestValues.reduce((acc, v) => acc + v.value, 0);
      const avg = sum / latestValues.length;
      const max = Math.max(...latestValues.map(v => v.value));
      const min = Math.min(...latestValues.map(v => v.value));
      
      result[metricName] = {
        count: latestValues.length,
        sum,
        avg,
        max,
        min,
        latest: latestValues[latestValues.length - 1]?.value,
      };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}