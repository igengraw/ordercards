const fs = require('fs');
const path = require('path');

// Что не показываем: тяжёлые и служебные папки, ключи и lock-файлы
const IGNORE = new Set([
  'node_modules', '.git', '.expo', 'dist', 'build', '.idea',
  'android', 'ios', '.DS_Store', 'package-lock.json', 'tree.txt',
]);

const root = path.resolve(process.argv[2] || '.');
const lines = [path.basename(root) + '/'];

function walk(dir, prefix) {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.has(e.name) && !e.name.startsWith('.env'))
    .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));

  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      lines.push(`${prefix}${last ? '└── ' : '├── '}${e.name}/`);
      walk(full, prefix + (last ? '    ' : '│   '));
    } else {
      const kb = (fs.statSync(full).size / 1024).toFixed(1);
      lines.push(`${prefix}${last ? '└── ' : '├── '}${e.name} (${kb} KB)`);
    }
  });
}

walk(root, '');
const out = lines.join('\n');
console.log(out);
fs.writeFileSync(path.join(root, 'tree.txt'), out, 'utf8');