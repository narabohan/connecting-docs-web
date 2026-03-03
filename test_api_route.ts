// Just verifying the Next.js build locally since we modified code.
import { spawn } from 'child_process';

const npmRunBuild = spawn('npm', ['run', 'build'], { cwd: '/Users/nrb/Desktop/ConnectingDocs Master/ConnectingDocs_Front' });

npmRunBuild.stdout.on('data', (data) => console.log(`stdout: ${data}`));
npmRunBuild.stderr.on('data', (data) => console.error(`stderr: ${data}`));
npmRunBuild.on('close', (code) => console.log(`Build process exited with code ${code}`));
