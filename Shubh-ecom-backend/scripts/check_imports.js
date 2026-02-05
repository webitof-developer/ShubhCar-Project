const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', 'coverage', 'logs', 'dist', 'build', '.gemini'];
const IGNORE_FILES = ['package-lock.json', 'check_imports.js'];

// Get dependencies from package.json
const packageJson = require(path.join(ROOT_DIR, 'package.json'));
const dependencies = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  ...builtinModules,
  'module', // explicitly add common built-ins if missed
  'fs',
  'path',
  'util',
  'os',
  'http',
  'https',
  'crypto',
  'events',
  'stream',
  'buffer',
  'url',
  'querystring',
  'zlib',
  'child_process',
  'cluster',
  'dgram',
  'dns',
  'domain',
  'net',
  'punycode',
  'readline',
  'repl',
  'string_decoder',
  'tls',
  'tty',
  'v8',
  'vm',
  'wasi',
  'worker_threads'
]);

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      if (!IGNORE_FILES.includes(file) && file.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];
  
  // Regex to match require calls: require('...') or require("...")
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Check if it's a relative path
    if (importPath.startsWith('.')) {
      const absolutePath = path.resolve(path.dirname(filePath), importPath);
      
      // Check exact match, .js, or index.js
      let exists = fs.existsSync(absolutePath);
      if (!exists && fs.existsSync(absolutePath + '.js')) exists = true;
      if (!exists && fs.existsSync(path.join(absolutePath, 'index.js'))) exists = true;
      
      if (!exists) {
        // Find line number
        const lineNo = lines.findIndex(line => line.includes(match[0])) + 1;
        errors.push({
          file: filePath,
          line: lineNo,
          import: importPath,
          type: 'BROKEN_RELATIVE'
        });
      }
    } else {
      // Check if it's a package or built-in
      // Handle sub-paths like 'lodash/get'
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/') 
        : importPath.split('/')[0];
        
      if (!dependencies.has(packageName)) {
        const lineNo = lines.findIndex(line => line.includes(match[0])) + 1;
        errors.push({
          file: filePath,
          line: lineNo,
          import: importPath,
          type: 'MISSING_DEPENDENCY'
        });
      }
    }
  }

  // Check for potentially undefined variables that look like missing imports
  // (Simple heuristic: matching common missing objects like 'User', 'Product', etc. if they are used but not defined/imported)
  // This is complex to do with regex only, so skipping for now to focus on hard import errors.

  return errors;
}

console.log('Scanning for broken imports...');
const allFiles = getAllFiles(ROOT_DIR);
let totalErrors = 0;
const allErrors = [];

allFiles.forEach(file => {
  const fileErrors = checkImports(file);
  if (fileErrors.length > 0) {
    fileErrors.forEach(err => {
      allErrors.push({
        file: path.relative(ROOT_DIR, file),
        line: err.line,
        import: err.import,
        type: err.type
      });
      totalErrors++;
    });
  }
});

fs.writeFileSync(path.join(ROOT_DIR, 'import_errors.json'), JSON.stringify(allErrors, null, 2), 'utf8');

if (totalErrors === 0) {
  console.log('\n✅ No broken imports found!');
} else {
  console.log(`\nFound ${totalErrors} broken imports. See import_errors.json`);
  process.exit(1);
}
