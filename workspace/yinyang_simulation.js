/**
 * 阴阳平衡曲线30天模拟
 */

// 模拟30天的坐标变化
const DAYS = 30;
const simulationData = [];

// 初始坐标：T=0(沉寂), S=0(单平台), R=0(孤立)
let coords = { t: 0, s: 0, r: 0 };
let fourRights = { yong: 1, yan: 1, kuo: 1, yi: 0 }; // 初始四权配置
let cycle = new FastYinYangCycle();

// 模拟每日坐标变化
for (let day = 1; day <= DAYS; day++) {
  // 模拟用户行为导致坐标变化
  coords = simulateDailyChange(coords, day);
  
  // 计算阴阳状态
  const state = cycle.calculate(coords, fourRights);
  
  // 检查是否触发物极必反
  const yijibifan = checkYiJiBiFan(state.yang, state.yin);
  
  // 如果触发物极必反，强制调整四权
  if (yijibifan.triggered) {
    state.effectiveRights.yi = Math.max(0, state.effectiveRights.yi + yijibifan.adjustment);
    state.yijibifan = yijibifan;
  }
  
  // 记录数据
  simulationData.push({
    day,
    coords: {...coords},
    yang: state.yang.toFixed(2),
    yin: state.yin.toFixed(2),
    balance: state.balance.toFixed(2),
    direction: state.direction,
    effectiveRights: state.effectiveRights,
    yijibifan: yijibifan.triggered ? yijibifan.type : null
  });
  
  // 更新四权为当天有效配置
  fourRights = state.effectiveRights;
}

// 打印模拟结果
console.log('=== 30天阴阳平衡曲线模拟 ===');
console.log('天  坐标(T/S/R)  阳/阴  平衡度  方向      四权(用/衍/扩/益)  特殊事件');
console.log('-----------------------------------------------------------------');

simulationData.forEach(d => {
  const coords = `${d.coords.t}/${d.coords.s}/${d.coords.r}`;
  const yangyin = `${d.yang}/${d.yin}`;
  const rights = `${d.effectiveRights.yong}/${d.effectiveRights.yan}/${d.effectiveRights.kuo}/${d.effectiveRights.yi}`;
  const event = d.yijibifan || '';
  console.log(`${String(d.day).padStart(2)}  ${coords.padEnd(9)}  ${yangyin.padEnd(9)} ${d.balance.padEnd(6)} ${d.direction.padEnd(10)} ${rights.padEnd(15)} ${event}`);
});

// 生成ASCII曲线图
console.log('\n=== 阴阳波动曲线图 ===');
console.log('阳气  ' + '█'.repeat(20) + ' 100%');
console.log('      ');
for (let i = 10; i >= 0; i--) {
  const level = i * 0.1;
  let line = `${(level * 100).toFixed(0)}% `.padStart(4) + '|';
  simulationData.forEach(d => {
    const yang = parseFloat(d.yang);
    line += yang >= level ? '■' : '·';
  });
  console.log(line);
}
console.log('    └' + '─'.repeat(DAYS));
console.log('天:  ' + Array.from({length: DAYS}, (_,i) => String(i+1).padStart(1)).join(''));

// 辅助函数
function FastYinYangCycle() {
  this.history = [];
  
  this.calculate = function(coords, fourRights) {
    const yang = (coords.t + coords.s + coords.r) / 9;
    const yin = 1 - yang;
    const balance = yang - yin;
    
    let direction;
    if (balance > 0.3) direction = '阳气上升';
    else if (balance < -0.3) direction = '阴气上升';
    else direction = '阴阳平衡';
    
    const yangBias = yang - yin;
    const adjustedRights = {
      yong: Math.min(5, Math.max(0, fourRights.yong + Math.round(yangBias))),
      yan: Math.min(5, Math.max(0, fourRights.yan + Math.round(yangBias * 0.5))),
      kuo: Math.min(5, Math.max(0, fourRights.kuo + Math.round(yangBias))),
      yi: Math.min(5, Math.max(0, fourRights.yi - Math.round(yangBias * 0.3)))
    };
    
    this.history.push({
      coords: {...coords},
      yang, yin, balance, direction,
      timestamp: Date.now()
    });
    
    return {
      yang, yin, balance, direction,
      effectiveRights: adjustedRights
    };
  };
}

function checkYiJiBiFan(yang, yin, threshold = 0.8) {
  const imbalance = Math.abs(yang - yin);
  
  if (imbalance >= threshold) {
    return {
      triggered: true,
      type: yang > yin ? '阳极生阴' : '阴极生阳',
      adjustment: yang > yin ? -1 : 1,
      reason: '阴阳失衡超过阈值'
    };
  }
  return { triggered: false };
}

function simulateDailyChange(coords, day) {
  // 模拟日常波动
  const tChange = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
  const sChange = Math.floor(Math.random() * 3) - 1;
  const rChange = Math.floor(Math.random() * 3) - 1;
  
  // 第10天模拟爆发（营销事件）
  if (day === 10) return { t: 3, s: 2, r: 2 };
  // 第15天模拟热点爆发（全网传播）
  if (day === 15) return { t: 3, s: 3, r: 3 };
  // 第22天模拟负面事件（用户流失）
  if (day === 22) return { t: 1, s: 1, r: 1 };
  
  // 正常波动
  return {
    t: Math.min(3, Math.max(0, coords.t + tChange)),
    s: Math.min(3, Math.max(0, coords.s + sChange)),
    r: Math.min(3, Math.max(0, coords.r + rChange))
  };
}
