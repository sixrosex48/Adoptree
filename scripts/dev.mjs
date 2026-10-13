import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const directories = ['apps/api', 'apps/web'];

const children = directories.map((directory) =>
  spawn(command, ['--dir', directory, 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
);

for (const child of children) {
  child.on('error', (error) => {
    console.error('No se pudo iniciar uno de los servicios:', error.message);
    process.exitCode = 1;
    children.forEach((other) => {
      if (other !== child) other.kill('SIGTERM');
    });
  });

  child.on('exit', (code) => {
    if (code) {
      process.exitCode = code;
      children.filter((other) => other !== child).forEach((other) => other.kill('SIGTERM'));
    }
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => children.forEach((child) => child.kill(signal)));
}