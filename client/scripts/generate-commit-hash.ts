import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the commit hash
let commitHash = 'unknown';
let shortCommitHash = 'unknown';

try {
  commitHash = execSync('git rev-parse HEAD', { cwd: path.resolve(__dirname, '..') }).toString().trim();
  shortCommitHash = execSync('git rev-parse --short HEAD', { cwd: path.resolve(__dirname, '..') }).toString().trim();
} catch (error: unknown) {
  console.warn('Could not get git commit hash:', (error as Error).message);
}

// Create a separate file to store the commit hash
const commitHashContent = `// This file is auto-generated during build process
export const COMMIT_HASH = '${shortCommitHash}';
export const FULL_COMMIT_HASH = '${commitHash}';
`;

// Write to a TypeScript file that can be imported
const commitHashFilePath = path.resolve(__dirname, '..', 'src', 'lib', 'commitHash.ts');
fs.writeFileSync(commitHashFilePath, commitHashContent);

console.log(`Generated commit hash file: ${shortCommitHash}`);