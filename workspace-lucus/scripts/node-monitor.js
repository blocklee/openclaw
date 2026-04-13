#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'node.meerfans.club';
const API_PATH = '/api/status';
const LOG_FILE = path.join(__dirname, '../logs/node-monitor.log');
const TIMEOUT = 30000; // 增加超时时间到30秒

const log = (msg) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, logMsg);
  console.log(msg);
};

const checkNodes = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      path: API_PATH,
      method: 'GET',
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON解析失败'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
};

const analyzeNodes = (data) => {
  const alerts = [];
  const nodes = data.nodes || {};
  
  // 按网络分组（test vs main）
  const testnetNodes = {};
  const mainnetNodes = {};
  
  for (const [name, node] of Object.entries(nodes)) {
    if (name.startsWith('test-')) {
      testnetNodes[name] = node;
    } else if (name.startsWith('main-')) {
      mainnetNodes[name] = node;
    }
  }
  
  // 分别获取测试网和主网的最高高度
  const getMaxHeight = (n) => {
    let max = 0;
    for (const node of Object.values(n)) {
      const h = node?.stateroot?.Height || 0;
      if (h > max) max = h;
    }
    return max;
  };
  
  const testnetMax = getMaxHeight(testnetNodes);
  const mainnetMax = getMaxHeight(mainnetNodes);
  
  // 检查测试网节点
  for (const [name, node] of Object.entries(testnetNodes)) {
    const height = node?.stateroot?.Height || 0;
    const valid = node?.stateroot?.Valid;
    
    if (valid === false) {
      alerts.push(`🚨 [测试网] 节点异常: ${name.replace(/^test-/, '')} (Valid=false)`);
    }
    if (testnetMax - height > 10) {
      alerts.push(`⚠️ [测试网] 节点高度落后: ${name.replace(/^test-/, '')} (Height=${height}, 最高=${testnetMax})`);
    }
  }
  
  // 检查主网节点
  for (const [name, node] of Object.entries(mainnetNodes)) {
    const height = node?.stateroot?.Height || 0;
    const valid = node?.stateroot?.Valid;
    
    if (valid === false) {
      alerts.push(`🚨 [主网] 节点异常: ${name.replace(/^main-/, '')} (Valid=false)`);
    }
    if (mainnetMax - height > 10) {
      alerts.push(`⚠️ [主网] 节点高度落后: ${name.replace(/^main-/, '')} (Height=${height}, 最高=${mainnetMax})`);
    }
  }

  return { alerts, nodes, testnetMax, mainnetMax };
};

const main = async () => {
  try {
    log('开始检查节点状态...');
    const data = await checkNodes();
    const { alerts, nodes, testnetMax, mainnetMax } = analyzeNodes(data);
    
    if (alerts.length > 0) {
      // 有异常，输出告警信息
      for (const alert of alerts) {
        log(alert);
      }
      // 发送通知（这里先输出，你可以配置通知方式）
      console.log('\n=== 节点告警 ===');
      for (const alert of alerts) {
        console.log(alert);
      }
    } else {
      log('所有节点正常');
    }
    
    // 输出状态摘要
    console.log('\n📊 节点状态摘要:');
    for (const [name, node] of Object.entries(nodes)) {
      const height = node?.stateroot?.Height || 0;
      const valid = node?.stateroot?.Valid ? '✅' : '❌';
      console.log(`  ${valid} ${name.replace(/^.-/, '')}: Height=${height}`);
    }
    
  } catch (err) {
    log(`ERROR: ${err.message}`);
    console.log('⚠️ 节点监控异常:', err.message);
    process.exit(1);
  }
};

main();