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

async function getDocAllBlocks(token, docToken) {
  let hasMore = true;
  let pageToken = null;
  let allBlocks = [];
  
  while (hasMore) {
    const path = `/open-apis/docx/v1/documents/${docToken}/blocks?page_size=50${pageToken ? `&page_token=${pageToken}` : ''}`;
    const opts = {
      hostname: 'open.feishu.cn',
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const data = await new Promise((resolve, reject) => {
      const req = https.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d).data));
      });
      req.on('error', reject);
      req.end();
    });
    allBlocks.push(...(data.items || []));
    hasMore = data.has_more;
    pageToken = data.page_token;
  }
  return allBlocks;
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

function textBlock(content) {
  return { block_type: 2, text: { elements: [{ text_run: { content } }], style: {} } };
}

function heading1(content) {
  return { block_type: 3, heading1: { elements: [{ text_run: { content } }], style: {} } };
}

async function main() {
  const token = await getToken();
  const docToken = 'KpQGdI2zDoGhj6xAVPkcsBahnxf'; // Talus 知识库 v3
  
  const newBlocks = [
    textBlock(''),
    heading1('2026-05-28 四轮测试记录'),
    textBlock(''),
    heading1('一、什么是势位'),
    textBlock('势位不是资产，是场。它不在节点口袋里，在关系之间。像水压像地磁场——弥漫在整个拓扑网络里。有多少边连接你，势位就有多高。边断了势位消散，边增厚势位上涨。'),
    textBlock(''),
    heading1('二、ECHO不需要DAO'),
    textBlock('DAO是链上议会政治——拉票、拖延、共识成本极高。ECHO不问"社区同不同意"，问"物理公式算出该公示多久"。协议即治理，代码即法则。治理权不是谁手里的剑，是嵌入拓扑结构的引力场。'),
    textBlock(''),
    heading1('三、外部组件的位置'),
    textBlock('骨架必须是纯数学：势位公式、公示期函数、四权配置、哈希匹配。预言机、KYC、审计只能当插件，不能当骨架。它们为ECHO所用，不是ECHO匍匐在它们的架构下。'),
    textBlock(''),
    heading1('四、归根的意思'),
    textBlock('创作者走了，规则不死。链上配置一旦写入就自动执行，不需要人每天打卡维护。收益按写死的规则自动流转，私钥在谁手里收益归谁。归根是逗号不是句号，根还在，下一次肇始时第一口气更足。'),
    textBlock(''),
    heading1('五、六相是异步耦合'),
    textBlock('六相不是六个部门，是一场呼吸的六个节律，同时发生但时间常数不同。通变（公示期）中速，流行（编排者反应）快速，差等（代际锁定）慢速。高势位节点降档时，六相各自按自己的时间尺度响应。'),
    textBlock(''),
    heading1('六、数据架构原则'),
    textBlock('上链：节点、边（from/to/type/weight/contentHash/timestamp）、四权配置、事件哈希序列。链下：势位计算结果、UI渲染数据、历史势位曲线。'),
    textBlock('势位计算：链上存边列表，用"快照+增量"控制gas。链下索引器可缓存供UI用，但链上决策永远现场计算。'),
    textBlock(''),
    heading1('七、错误假设识别'),
    textBlock('势位代币化：错。势在关系之间，不在钱包里。'),
    textBlock('六相分合约：错。把呼吸切成六块，破坏了同时性。'),
    textBlock('信誉NFT奖励：错。势位不可搬运，曼纳不可分割。'),
    textBlock('归根收益归公：错。协议不抽成做基金，不代管资金。'),
    textBlock('DAO定默认值：错。创世是单方面锁定，不是协商批准。'),
    textBlock(''),
    heading1('八、四轮测试结论'),
    textBlock('第一轮概念题：通过'),
    textBlock('第二轮实操题：通过（快照+增量路线被采纳）'),
    textBlock('第三轮反向验证：通过（五类错误假设全部识别）'),
    textBlock('第四轮架构假设：通过（链上契约链下场状态的分层清晰）'),
    textBlock(''),
    textBlock('ECHO的创新本质：规则不需要有人持续维护就能自动执行，收益不需要中介就能自动流转，势位不需要投票就能自然涌现。这三个"不需要"是ECHO区别于传统区块链项目的核心。'),
  ];
  
  const result = await writeBlocks(token, docToken, docToken, newBlocks);
  console.log('Write result:', JSON.stringify(result));
}

main().catch(console.error);