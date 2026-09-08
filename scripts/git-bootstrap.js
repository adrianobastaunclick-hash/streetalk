const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

try {
  console.log('Running git init...');
  const out1 = execSync('git init', { cwd: projectRoot, encoding: 'utf8' });
  console.log(out1.trim());

  console.log('Setting branch main...');
  const out2 = execSync('git branch -M main', { cwd: projectRoot, encoding: 'utf8' });
  console.log(out2.trim());

  console.log('Adding files...');
  const out3 = execSync('git add .', { cwd: projectRoot, encoding: 'utf8' });
  console.log(out3.trim());

  console.log('Committing...');
  const out4 = execSync('git commit -m "feat: streetalk 3d webgl engine + zero-cost cloud deployment ready"', { cwd: projectRoot, encoding: 'utf8' });
  console.log(out4.trim());

  console.log('>>> [GIT BOOTSTRAPPER COMPLETE] Repository initialized and committed on main.');
} catch (e) {
  console.error('Git execution error:', e.stdout ? e.stdout.toString() : e.message);
  process.exit(1);
}
