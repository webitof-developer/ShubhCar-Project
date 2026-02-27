const fs = require('fs');

let path = 'src/app/orders/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement chunk
const replacement = `// ── Main Page ─────────────────────────────────────────────────────────────────`;
const importChunk = `import { OrderTimeline } from '@/components/orders/OrderTimeline';\nimport { OrderRow } from '@/components/orders/OrderRow';\n`;

content = content.replace(
  "import { resolveProductImages } from '@/utils/media';",
  importChunk + "import { resolveProductImages } from '@/utils/media';"
);

const startMark = content.indexOf('// ── Status timeline steps (ordered progression) ──────────────────────────────');
const endMark = content.indexOf('// ── Main Page ─────────────────────────────────────────────────────────────────');

if (startMark !== -1 && endMark !== -1) {
  content = content.substring(0, startMark) + content.substring(endMark);
  fs.writeFileSync(path, content);
  console.log('Orders page replaced inline components with imports.');
} else {
  console.log('Could not find boundaries for orders/page.jsx replacement.');
}
