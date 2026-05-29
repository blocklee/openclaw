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

function readBlocks(token, docToken, pageToken) {
  return new Promise((resolve, reject) => {
    let path = `/open-apis/docx/v1/documents/${docToken}/blocks?page_size=50`;
    if (pageToken) path += `&page_token=${pageToken}`;
    const opts = {
      hostname: 'open.feishu.cn',
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).data));
    });
    req.on('error', reject);
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

function textBlock(content) {
  return {
    block_type: 2,
    text: { elements: [{ text_run: { content } }], style: {} }
  };
}

function bulletItem(content) {
  return {
    block_type: 12,
    bullet: {
      elements: [{ text_run: { content } }],
      style: {}
    }
  };
}

async function main() {
  const token = await getToken();
  const docToken = 'PPz8dE0IsoGZLYxEJxWcqvVInRh'; // ECHO Agent 共同记忆库 - 首页
  
  // Read existing blocks to find where to append
  const data = await readBlocks(token, docToken);
  
  // Add new entry to the page
  const newBlocks = [
    textBlock(''),
    {
      block_type: 3,
      heading1: {
        elements: [{ text_run: { content: '2026-05-28 多Agent四轮测试记录' } }],
        style: {}
      }
    },
    bulletItem('Talus: ECHO协议核心理解记录 - https://yio5us4oqe.feishu.cn/docx/EQsqdd3ZfoTP5UxRubrckq6BnNg'),
    textBlock('四轮测试结论：第一轮概念题✅ 第二轮实操题✅ 第三轮反向验证✅ 第四轮架构假设✅'),
    textBlock('核心要点：势位是场不是属性、ECHO不需要DAO、外部组件不能当骨架、归根规则不死、六相异步耦合'),
    textBlock(''),
  ];
  
  const result = await writeBlocks(token, docToken, docToken, newBlocks);
  console.log(JSON.stringify(result));
}

main().catch(console.error);