const { spawn } = require('child_process');
const path = require('path');
const PORT = process.env.PORT || 3002;
const api = spawn('node', ['echo-data-api.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT }
});
api.on('error', (err) => console.error('Failed to start API:', err));