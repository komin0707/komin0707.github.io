import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/components', 'src/context', 'src/hooks', 'src/simulation', 'scripts'];
const lines = ['# Generated Codemap', ''];

for (const root of roots) {
  lines.push(`## ${root}`, '');
  for (const path of collectFiles(root)) {
    lines.push(`- \`${path}\``);
  }
  lines.push('');
}

writeFileSync('docs/CODEMAP.generated.md', `${lines.join('\n').trim()}\n`);

function collectFiles(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) return collectFiles(path);
      return /\.(?:ts|tsx|css|mjs)$/.test(path) ? [path] : [];
    })
    .sort();
}
