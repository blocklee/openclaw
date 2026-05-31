const { exec } = require('child_process');

exec('node /root/.openclaw/workspace/echo/indexer/mock-data-generator.js', {
  cwd: '/root/.openclaw/workspace/echo/deploy-scripts'
}, (error, stdout) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(stdout);
});
