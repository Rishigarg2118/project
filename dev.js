import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPortOpen = (port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

async function main() {
  console.log('\n\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
  console.log('\x1b[1m\x1b[32m%s\x1b[0m', '   🚀 i-SOFTZONE ENTERPRISE APPLICATION PORTAL LAUNCHER');
  console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════\n');

  const backendPort = 4000;
  const frontendPort = 4566;

  const backendRunning = await isPortOpen(backendPort);
  if (backendRunning) {
    console.log(`\x1b[32m✓ Backend API is already active on http://localhost:${backendPort}/\x1b[0m`);
  } else {
    console.log(`\x1b[34m▶ Starting Backend API server on port ${backendPort}...\x1b[0m`);
    const backendProcess = spawn('node', ['index.js'], {
      cwd: path.join(__dirname, 'I-soft-Project', 'backend'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: '4000' }
    });
    backendProcess.on('error', (err) => console.error('Backend error:', err));
  }

  const frontendRunning = await isPortOpen(frontendPort);
  if (frontendRunning) {
    console.log(`\x1b[32m✓ Frontend Web App is already active on http://localhost:${frontendPort}/\x1b[0m`);
  } else {
    console.log(`\x1b[34m▶ Starting Vite Frontend server on port ${frontendPort}...\x1b[0m`);
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'I-soft-Project', 'frontend'),
      stdio: 'inherit',
      shell: true
    });
    frontendProcess.on('error', (err) => console.error('Frontend error:', err));
  }

  console.log('\n\x1b[36m%s\x1b[0m', '──────────────────────────────────────────────────────────────');
  console.log('\x1b[1m\x1b[33m%s\x1b[0m', `  ➜ Frontend Web App:  http://localhost:${frontendPort}/`);
  console.log('\x1b[1m\x1b[33m%s\x1b[0m', `  ➜ Backend REST API:  http://localhost:${backendPort}/`);
  console.log('\x1b[36m%s\x1b[0m\n', '──────────────────────────────────────────────────────────────');
}

main();
