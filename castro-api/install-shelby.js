const { execSync } = require('child_process');
const path = require('path');

try {
  execSync('npx --yes @shelby-protocol/cli --version', { encoding: 'utf8' });
  console.log('Shelby CLI ready!');
} catch (err) {
  console.log('Shelby CLI check:', err.message);
}
