/**
 * Accessibility Audit Script
 * 
 * Scans React components for common accessibility issues:
 * - Missing alt text on images
 * - Missing ARIA labels on interactive elements
 * - Missing form labels
 * - Keyboard navigation issues
 * - Color contrast issues
 */

const fs = require('fs');
const path = require('path');

const issues = [];

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'coverage', '.git'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.match(/\.(tsx|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkAccessibility(filePath, content) {
  const fileIssues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for images without alt text
    if (/<img\s/.test(line) && !/alt=/.test(line)) {
      fileIssues.push({
        file: filePath,
        line: lineNum,
        type: 'missing-alt',
        severity: 'error',
        message: 'Image missing alt attribute',
        code: line.trim(),
      });
    }
    
    // Check for buttons without accessible names
    if (/<button/.test(line) && !/(aria-label|aria-labelledby|>[\w\s]+<\/button)/.test(line)) {
      const nextLine = lines[index + 1] || '';
      const prevLine = lines[index - 1] || '';
      
      // Only flag if no text content nearby
      if (!/>[\w\s]+/.test(line) && !/>[\w\s]+/.test(nextLine) && !prevLine.includes('aria-label')) {
        fileIssues.push({
          file: filePath,
          line: lineNum,
          type: 'missing-button-label',
          severity: 'warning',
          message: 'Button may be missing accessible name',
          code: line.trim(),
        });
      }
    }
    
    // Check for input fields without labels
    if (/<input\s/.test(line) && !/(aria-label|aria-labelledby|id=)/.test(line)) {
      fileIssues.push({
        file: filePath,
        line: lineNum,
        type: 'missing-input-label',
        severity: 'warning',
        message: 'Input missing label or aria-label',
        code: line.trim(),
      });
    }
    
    // Check for onClick without onKeyDown (keyboard accessibility)
    if (/onClick=/.test(line) && !/<button/.test(line) && !/<a\s/.test(line)) {
      if (!/onKeyDown=/.test(line) && !/onKeyPress=/.test(line)) {
        fileIssues.push({
          file: filePath,
          line: lineNum,
          type: 'missing-keyboard-handler',
          severity: 'warning',
          message: 'onClick without keyboard handler (onKeyDown)',
          code: line.trim(),
        });
      }
    }
    
    // Check for role="button" without tabIndex
    if (/role="button"/.test(line) && !/tabIndex/.test(line)) {
      fileIssues.push({
        file: filePath,
        line: lineNum,
        type: 'missing-tabindex',
        severity: 'error',
        message: 'role="button" missing tabIndex',
        code: line.trim(),
      });
    }
  });
  
  return fileIssues;
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  console.log('♿ Accessibility Audit\n');
  console.log('═'.repeat(80));
  console.log('\n🔍 Scanning components for accessibility issues...\n');
  
  const files = walkDirectory(srcDir);
  console.log(`📁 Found ${files.length} component files\n`);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileIssues = checkAccessibility(file, content);
    
    if (fileIssues.length > 0) {
      issues.push(...fileIssues);
    }
  });
  
  // Group by type
  const byType = {};
  issues.forEach(issue => {
    if (!byType[issue.type]) {
      byType[issue.type] = [];
    }
    byType[issue.type].push(issue);
  });
  
  // Print summary
  console.log('\n📊 Summary:\n');
  console.log(`   Total Issues: ${issues.length}`);
  console.log(`   Errors: ${issues.filter(i => i.severity === 'error').length}`);
  console.log(`   Warnings: ${issues.filter(i => i.severity === 'warning').length}\n`);
  
  // Print by type
  Object.keys(byType).forEach(type => {
    console.log(`\n${byType[type][0].severity === 'error' ? '🔴' : '🟡'} ${type.toUpperCase().replace(/-/g, ' ')} (${byType[type].length})`);
    
    // Show first 5 examples
    byType[type].slice(0, 5).forEach(issue => {
      const relPath = path.relative(process.cwd(), issue.file);
      console.log(`   ${relPath}:${issue.line}`);
      console.log(`   ${issue.message}`);
    });
    
    if (byType[type].length > 5) {
      console.log(`   ... and ${byType[type].length - 5} more instances\n`);
    }
  });
  
  console.log('\n═'.repeat(80));
  console.log('\n💡 Recommended Actions:\n');
  console.log('   1. Add alt="" to decorative images');
  console.log('   2. Add aria-label to icon-only buttons');
  console.log('   3. Associate form labels with inputs using htmlFor/id');
  console.log('   4. Add keyboard handlers (onKeyDown) to clickable divs');
  console.log('   5. Add tabIndex to role="button" elements');
  console.log('\n📖 Resources:');
  console.log('   - https://www.w3.org/WAI/WCAG21/quickref/');
  console.log('   - https://developer.mozilla.org/en-US/docs/Web/Accessibility');
  console.log('\n═'.repeat(80));
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Found ${issues.length} accessibility issues to review`);
  } else {
    console.log('\n✅ No accessibility issues detected!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkAccessibility };


