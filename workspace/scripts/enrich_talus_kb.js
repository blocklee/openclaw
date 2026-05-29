const https = require('https');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('/home/node/.openclaw/openclaw.json', 'utf8'));
const appId = config.channels.feishu.accounts.main.appId;
const appSecret = config.channels.feishu.accounts.main.appSecret;

function getToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: appId, app_secret: appSecret });
    const opts = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).tenant_access_token));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function writeBlocks(token, docToken, parentBlockId, blocks) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ children: blocks });
    const opts = {
      hostname: 'open.feishu.cn',
      path: `/open-apis/docx/v1/documents/${docToken}/blocks/${parentBlockId}/children`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function p(content) {
  return { block_type: 2, text: { elements: [{ text_run: { content } }], style: {} } };
}

function h2(content) {
  return { block_type: 4, heading2: { elements: [{ text_run: { content } }], style: {} } };
}

function h3(content) {
  return { block_type: 5, heading3: { elements: [{ text_run: { content } }], style: {} } };
}

async function main() {
  const token = await getToken();
  const docToken = 'KpQGdI2zDoGhj6xAVPkcsBahnxf';
  
  // Batch 1
  let r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h2('补充理解：ECHO的哲学根基'),
    p(''),
    h3('1. 关系本体论'),
    p('ECHO不是"权利系统"，是"关系系统"。传统区块链关注"谁有什么权利"，ECHO关注"谁和谁有什么关系"。权利用来分配利益，关系用来建立结构。结构对了，利益自然流动。'),
    p(''),
    h3('2. 物理法则优先'),
    p('ECHO的治理靠物理公式，不靠人情投票。公示期多长由势位和嵌入深度算出来，不是社区开会决定的。这意味着：规则一旦写入，就自动执行，不受人情左右。'),
  ]);
  console.log('Batch 1:', r.code);
  
  // Batch 2
  r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h3('3. 场域经济学'),
    p('势位不是资产，是场的梯度。资产可以交易，场不能买卖。势位高意味着影响半径大，变更责任重——而不是意味着可以变现。变现是平台思维，场的梯度是自然涌现的质量。'),
    p(''),
    h3('4. 呼吸型系统'),
    p('六相是一个完整呼吸的六个节律：肇始（生）、通变（调）、流行（动）、差等（压）、继述（换）、性命（归根）。不是六步流程，是同时发生的时间错维。'),
  ]);
  console.log('Batch 2:', r.code);
  
  // Batch 3
  r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h2('四轮测试详细记录'),
    p(''),
    h3('第一轮：概念题'),
    p('五道题：势位是什么/六相是流程吗/为什么不需要DAO/外部组件位置/归根是什么意思'),
    p('结果：全部答对。关键理解：势位在关系之间，六相异步耦合同时发生，DAO是链上议会vs数学决定规则，外部组件是插件不是骨架，归根是逗号不是句号。'),
    p(''),
    h3('第二轮：实操题'),
    p('五道场景：前端展示/合约事件监听/预言机位置/分叉按钮/势位公式存储'),
    p('结果：方向全部正确，细节各有待锤。关键发现：快照+增量控制gas，分叉=新生命零势位，六相没有主从只有phaseMask。'),
  ]);
  console.log('Batch 3:', r.code);
  
  // Batch 4
  r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h3('第三轮：错误假设'),
    p('五个提议：势位代币化/六相分合约/信誉NFT奖励/归根收益归公/DAO定默认值'),
    p('结果：五个全部判断为错误。错误本质：金融化/模块化/凭证化/基金化/政治化。'),
    p(''),
    h3('第四轮：架构假设'),
    p('上链：节点、边、四权配置、事件哈希序列。链下：势位计算结果、UI数据。'),
    p('六相：既是事件也是状态，链上存事件序列状态从事件推导。'),
  ]);
  console.log('Batch 4:', r.code);
  
  // Batch 5
  r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h2('实践中的陷阱'),
    p(''),
    h3('陷阱1：把势位理解成信用分'),
    p('错误：势位高=评分高，可以公示给用户看。正确：势位是场的梯度，UI可以显示等级但不能当成排名分数。'),
    p(''),
    h3('陷阱2：把六相当成工作流'),
    p('错误：肇始→通变→流行→差等→继述→性命是六个步骤。正确：六相同时发生，像心跳图各器官时间常数不同。'),
    p(''),
    h3('陷阱3：用DAO思维理解治理'),
    p('错误：重大决策需要社区投票。正确：规则内禀执行，物理公式决定结果，不需要人开会。'),
    p(''),
    h3('陷阱4：把外部组件当默认配置'),
    p('错误：Chainlink做内容验证是标配。正确：预言机只能是被调用的可选项，不是默认配置。'),
  ]);
  console.log('Batch 5:', r.code);
  
  // Batch 6
  r = await writeBlocks(token, docToken, docToken, [
    p(''),
    h2('ECHO vs 传统区块链的本质区别'),
    p(''),
    p('治理：DAO投票（人治） vs 物理公式（法治）'),
    p('势位：代币/积分（可交易） vs 场的梯度（不可搬运）'),
    p('六相：工作流模块（顺序） vs 呼吸节律（异步同时）'),
    p('收益：平台抽成+基金分配 vs 直接流转+不代管'),
    p('创世：社区批准+DAO投票 vs 单方面锁定+无需批准'),
    p('外部组件：默认配置+核心依赖 vs 可选插件+随时可替换'),
    p(''),
    h2('后续行动'),
    p('1. 持续深化"势是场不是属性"的物理直觉'),
    p('2. 实现时注意gas优化：快照+增量路线'),
    p('3. 分叉功能：严格区分"继承历史"和"继承势位"'),
    p('4. UI设计：不用"废弃"/"inactive"等平台思维词汇'),
    p(''),
    p('文档更新时间：2026-05-28'),
  ]);
  console.log('Batch 6:', r.code);
  
  console.log('Done!');
}

main().catch(console.error);