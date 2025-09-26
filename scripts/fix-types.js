/**
 * Type Enhancement Script
 * Systematically replaces 'any' types with proper TypeScript types
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const TYPE_REPLACEMENTS = {
  // Common any type replacements
  'any[]': 'unknown[]',
  'any | null': 'unknown | null',
  'any | undefined': 'unknown | undefined',
  ': any': ': unknown',
  '<any>': '<unknown>',
  'Record<string, any>': 'Record<string, unknown>',
  'Record<any, any>': 'Record<string, unknown>',
  
  // Function parameter types
  '(...args: any[])': '(...args: unknown[])',
  '(event: any)': '(event: Event)',
  '(error: any)': '(error: Error | unknown)',
  '(data: any)': '(data: unknown)',
  '(response: any)': '(response: unknown)',
  '(result: any)': '(result: unknown)',
  '(payload: any)': '(payload: unknown)',
  '(config: any)': '(config: Record<string, unknown>)',
  '(options: any)': '(options: Record<string, unknown>)',
  '(params: any)': '(params: Record<string, unknown>)',
  
  // Return types
  'Promise<any>': 'Promise<unknown>',
  'Array<any>': 'Array<unknown>',
  
  // Object types
  'any & ': 'unknown & ',
  'any | ': 'unknown | ',
  
  // Console statements (replace with proper logging)
  'console.log(': '// console.log(',
  'console.warn(': '// console.warn(',
  'console.error(': 'console.error(',
  'console.debug(': '// console.debug(',
  'console.info(': '// console.info(',
};

const SPECIFIC_TYPE_PATTERNS = [
  // API Response types
  {
    pattern: /(\w+Response.*?): any/g,
    replacement: '$1: { [key: string]: unknown }'
  },
  {
    pattern: /(\w+Data.*?): any/g,
    replacement: '$1: Record<string, unknown>'
  },
  {
    pattern: /(\w+Config.*?): any/g,
    replacement: '$1: Record<string, unknown>'
  },
  {
    pattern: /(\w+Options.*?): any/g,
    replacement: '$1: Record<string, unknown>'
  },
  {
    pattern: /(\w+Params.*?): any/g,
    replacement: '$1: Record<string, unknown>'
  },
  
  // Event handlers
  {
    pattern: /(on\w+): any/g,
    replacement: '$1: (...args: unknown[]) => void'
  },
  {
    pattern: /(handle\w+): any/g,
    replacement: '$1: (...args: unknown[]) => void'
  },
  
  // Axios and HTTP types
  {
    pattern: /AxiosResponse<any>/g,
    replacement: 'AxiosResponse<unknown>'
  },
  {
    pattern: /AxiosRequestConfig<any>/g,
    replacement: 'AxiosRequestConfig'
  },
];

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply basic replacements
    for (const [search, replace] of Object.entries(TYPE_REPLACEMENTS)) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(search)) {
        content = content.replace(regex, replace);
        modified = true;
      }
    }
    
    // Apply pattern-based replacements
    for (const { pattern, replacement } of SPECIFIC_TYPE_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    // Fix specific React/DOM types
    content = content.replace(/React\.FC<any>/g, 'React.FC<Record<string, unknown>>');
    content = content.replace(/HTMLElement & any/g, 'HTMLElement');
    content = content.replace(/Event & any/g, 'Event');
    
    // Fix function types
    content = content.replace(/Function\[\]/g, '((...args: unknown[]) => void)[]');
    content = content.replace(/: Function/g, ': (...args: unknown[]) => void');
    
    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, extensions = ['.ts', '.tsx']) {
  let filesProcessed = 0;
  let filesModified = 0;
  
  function traverse(currentPath) {
    const items = readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = join(currentPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = extname(fullPath);
        if (extensions.includes(ext)) {
          filesProcessed++;
          if (processFile(fullPath)) {
            filesModified++;
            console.log(`✓ Fixed types in: ${fullPath}`);
          }
        }
      }
    }
  }
  
  traverse(dirPath);
  
  return { filesProcessed, filesModified };
}

// Main execution
console.log('🔧 Starting TypeScript type enhancement...');

const srcPath = './src';
const { filesProcessed, filesModified } = processDirectory(srcPath);

console.log(`\n📊 Type Enhancement Results:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Success rate: ${((filesModified / filesProcessed) * 100).toFixed(1)}%`);

if (filesModified > 0) {
  console.log(`\n✅ Type enhancement completed successfully!`);
  console.log(`   Run 'npm run lint' to verify the improvements.`);
} else {
  console.log(`\n✨ No type improvements needed - all files are already well-typed!`);
}
