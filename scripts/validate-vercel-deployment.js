#!/usr/bin/env node

/**
 * Vercel Deployment Validation Script
 * Validates that the Astral Turf application is properly deployed and configured
 */

const https = require('https');
const http = require('http');

class DeploymentValidator {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Deployment-Validator/1.0',
          ...options.headers
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(data) 
              : data;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}`);
    if (details) {
      console.log(`    ${details}`);
    }
    
    this.results.tests.push({ name, passed, details });
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  async testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint...');
    
    try {
      const response = await this.makeRequest('/api/health');
      
      if (response.statusCode === 200) {
        this.logTest('Health endpoint responds', true, `Status: ${response.statusCode}`);
        
        if (response.data && typeof response.data === 'object') {
          this.logTest('Health endpoint returns JSON', true);
          
          const requiredFields = ['status', 'message', 'version', 'checks'];
          const hasAllFields = requiredFields.every(field => 
            response.data.hasOwnProperty(field)
          );
          
          if (hasAllFields) {
            this.logTest('Health response has required fields', true);
            
            if (response.data.status === 'healthy') {
              this.logTest('Application status is healthy', true);
            } else {
              this.logTest('Application status is healthy', false, 
                `Status: ${response.data.status}`);
            }
            
            if (response.data.checks?.database?.status === 'connected') {
              this.logTest('Database connection is healthy', true, 
                `Response time: ${response.data.checks.database.responseTime}`);
            } else {
              this.logTest('Database connection is healthy', false,
                `DB Status: ${response.data.checks?.database?.status}`);
            }
          } else {
            this.logTest('Health response has required fields', false,
              `Missing: ${requiredFields.filter(f => !response.data.hasOwnProperty(f)).join(', ')}`);
          }
        } else {
          this.logTest('Health endpoint returns JSON', false, 'Response is not valid JSON');
        }
      } else {
        this.logTest('Health endpoint responds', false, 
          `Status: ${response.statusCode}`);
      }
    } catch (error) {
      this.logTest('Health endpoint responds', false, error.message);
    }
  }

  async testStaticAssets() {
    console.log('\n🔍 Testing Static Assets...');
    
    const staticFiles = [
      { path: '/', name: 'Main page' },
      { path: '/manifest.json', name: 'PWA manifest' },
      { path: '/favicon.ico', name: 'Favicon' }
    ];

    for (const file of staticFiles) {
      try {
        const response = await this.makeRequest(file.path);
        if (response.statusCode === 200) {
          this.logTest(`${file.name} loads`, true, `Status: ${response.statusCode}`);
        } else {
          this.logTest(`${file.name} loads`, false, `Status: ${response.statusCode}`);
        }
      } catch (error) {
        this.logTest(`${file.name} loads`, false, error.message);
      }
    }
  }

  async testSecurityHeaders() {
    console.log('\n🔍 Testing Security Headers...');
    
    try {
      const response = await this.makeRequest('/');
      const headers = response.headers;
      
      const securityHeaders = [
        { name: 'x-content-type-options', expected: 'nosniff' },
        { name: 'x-frame-options', expected: 'DENY' },
        { name: 'x-xss-protection', expected: '1; mode=block' },
        { name: 'strict-transport-security', required: true },
        { name: 'referrer-policy', expected: 'strict-origin-when-cross-origin' }
      ];

      for (const header of securityHeaders) {
        const headerValue = headers[header.name];
        
        if (headerValue) {
          if (header.expected && headerValue === header.expected) {
            this.logTest(`${header.name} header correct`, true, headerValue);
          } else if (header.required && !header.expected) {
            this.logTest(`${header.name} header present`, true, headerValue);
          } else if (header.expected) {
            this.logTest(`${header.name} header correct`, false, 
              `Expected: ${header.expected}, Got: ${headerValue}`);
          }
        } else {
          this.logTest(`${header.name} header present`, false, 'Header missing');
        }
      }
    } catch (error) {
      this.logTest('Security headers check', false, error.message);
    }
  }

  async testApiEndpoints() {
    console.log('\n🔍 Testing API Endpoints...');
    
    const apiEndpoints = [
      { path: '/api/health', name: 'Health API' },
      { path: '/api/formations', name: 'Formations API' },
      { path: '/api/teams', name: 'Teams API' },
      { path: '/api/analytics', name: 'Analytics API' }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await this.makeRequest(endpoint.path);
        
        if (response.statusCode === 200 || response.statusCode === 401) {
          // 401 is acceptable for protected endpoints without auth
          this.logTest(`${endpoint.name} responds`, true, 
            `Status: ${response.statusCode}`);
        } else {
          this.logTest(`${endpoint.name} responds`, false, 
            `Status: ${response.statusCode}`);
        }
      } catch (error) {
        this.logTest(`${endpoint.name} responds`, false, error.message);
      }
    }
  }

  async testPerformance() {
    console.log('\n🔍 Testing Performance...');
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/');
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 2000) {
        this.logTest('Page load time', true, `${responseTime}ms`);
      } else {
        this.logTest('Page load time', false, `${responseTime}ms (should be < 2000ms)`);
      }
      
      if (response.statusCode === 200) {
        // Check for common performance optimizations
        const headers = response.headers;
        
        if (headers['cache-control']) {
          this.logTest('Cache headers present', true, headers['cache-control']);
        } else {
          this.logTest('Cache headers present', false, 'No cache-control header');
        }
        
        if (headers['content-encoding']) {
          this.logTest('Content compression enabled', true, 
            headers['content-encoding']);
        } else {
          this.logTest('Content compression enabled', false, 
            'No content-encoding header');
        }
      }
    } catch (error) {
      this.logTest('Performance check', false, error.message);
    }
  }

  async testDatabaseConnectivity() {
    console.log('\n🔍 Testing Database Connectivity...');
    
    try {
      const response = await this.makeRequest('/api/health');
      
      if (response.statusCode === 200 && response.data?.checks?.database) {
        const dbCheck = response.data.checks.database;
        
        if (dbCheck.status === 'connected') {
          this.logTest('Database connection', true, 
            `Response time: ${dbCheck.responseTime}`);
          
          if (dbCheck.tablesFound > 0) {
            this.logTest('Database schema exists', true, 
              `Tables found: ${dbCheck.tablesFound}`);
          } else {
            this.logTest('Database schema exists', false, 
              'No tables found - may need migration');
          }
        } else {
          this.logTest('Database connection', false, 
            `Status: ${dbCheck.status}, Error: ${dbCheck.error}`);
        }
      } else {
        this.logTest('Database connection', false, 
          'Unable to get database status from health endpoint');
      }
    } catch (error) {
      this.logTest('Database connection', false, error.message);
    }
  }

  async runAllTests() {
    console.log(`🚀 Validating Vercel Deployment: ${this.baseUrl}\n`);
    console.log('Running comprehensive deployment validation...\n');
    
    await this.testHealthEndpoint();
    await this.testStaticAssets();
    await this.testSecurityHeaders();
    await this.testApiEndpoints();
    await this.testDatabaseConnectivity();
    await this.testPerformance();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
    
    const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! Your Vercel deployment is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above before going live.');
      
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.details}`);
        });
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('   • Review Vercel dashboard for detailed metrics');
    console.log('   • Check Vercel Analytics for performance data');
    console.log('   • Monitor error logs for any issues');
    console.log('   • Set up alerts for critical endpoints');
    
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// CLI Usage
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('❌ Error: Please provide the deployment URL');
    console.log('Usage: node validate-vercel-deployment.js https://your-app.vercel.app');
    process.exit(1);
  }
  
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    console.error('❌ Error: URL must include protocol (http:// or https://)');
    process.exit(1);
  }
  
  const validator = new DeploymentValidator(baseUrl);
  validator.runAllTests().catch(error => {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = DeploymentValidator;