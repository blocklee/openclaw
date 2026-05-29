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

async function main() {
  const token = await getToken();
  
  // Create a new document
  const body = JSON.stringify({ title: 'Talus - ECHO协议理解记录 (2026-05-28)' });
  const opts = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/docx/v1/documents',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  
  const req = https.request(opts, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const json = JSON.parse(d);
      console.log(JSON.stringify(json));
    });
  });
  req.on('error', console.error);
  req.write(body);
  req.end();
}

main().catch(console.error);