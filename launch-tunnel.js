const { spawn } = require('child_process');
const fs = require('fs');

const logFile = 'localtunnel.log';
// Clear previous log
fs.writeFileSync(logFile, '');

const child = spawn('bun', ['x', 'lt', '--port', '3000'], { shell: true });

child.stdout.on('data', (data) => {
  fs.appendFileSync(logFile, data.toString());
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  fs.appendFileSync(logFile, `ERR: ${data.toString()}`);
  console.error(data.toString());
});

child.on('close', (code) => {
  fs.appendFileSync(logFile, `Exited with code ${code}\n`);
});
