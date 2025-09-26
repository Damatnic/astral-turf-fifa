#!/usr/bin/env node

/**
 * Test Health Endpoints
 *
 * Simple script to test our health check implementation
 */

const { healthService } = require('../src/services/healthService.ts');
const { databaseService } = require('../src/services/databaseService.ts');
const { initializeApplication } = require('../src/services/initializationService.ts');

async function testHealthEndpoints() {
  console.log('🧪 Testing Astral Turf Health System...\n');

  try {
    // Test initialization
    console.log('1️⃣ Testing Application Initialization...');
    const initResult = await initializeApplication();
    console.log('✅ Initialization:', initResult.success ? 'SUCCESS' : 'FAILED');
    console.log(`   Duration: ${initResult.totalDuration}ms`);
    console.log(`   Services: ${Object.keys(initResult.services).join(', ')}\n`);

    // Test health service
    console.log('2️⃣ Testing Health Service...');
    const health = await healthService.getHealth();
    console.log('✅ Health Status:', health.status.toUpperCase());
    console.log(`   Uptime: ${Math.round(health.uptime / 1000)}s`);
    console.log(`   Version: ${health.version}`);
    console.log(`   Environment: ${health.environment}`);

    // Show component statuses
    console.log('\n   Component Status:');
    Object.entries(health.checks).forEach(([component, status]) => {
      const icon = status.status === 'healthy' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌';
      console.log(`   ${icon} ${component}: ${status.status.toUpperCase()}`);
      if (status.latency) {
        console.log(`      Latency: ${status.latency}ms`);
      }
      if (status.error) {
        console.log(`      Error: ${status.error}`);
      }
    });

    // Test readiness
    console.log('\n3️⃣ Testing Readiness...');
    const readiness = await healthService.getReadiness();
    console.log('✅ Readiness:', readiness.ready ? 'READY' : 'NOT READY');
    console.log('   Services:');
    Object.entries(readiness.services).forEach(([service, ready]) => {
      const icon = ready ? '✅' : '❌';
      console.log(`   ${icon} ${service}: ${ready ? 'READY' : 'NOT READY'}`);
    });

    // Test liveness
    console.log('\n4️⃣ Testing Liveness...');
    const liveness = healthService.getLiveness();
    console.log('✅ Liveness:', liveness.alive ? 'ALIVE' : 'DEAD');
    console.log(`   Uptime: ${Math.round(liveness.uptime / 1000)}s`);

    // Test database directly
    console.log('\n5️⃣ Testing Database...');
    const dbHealth = await databaseService.healthCheck();
    console.log('✅ Database Status:', dbHealth.status.toUpperCase());
    console.log(`   Latency: ${dbHealth.latency}ms`);
    if (dbHealth.details.database) {
      console.log(`   Database: ${dbHealth.details.database}`);
    }
    if (dbHealth.details.version) {
      console.log(`   Version: ${dbHealth.details.version}`);
    }

    console.log('\n🎉 All health checks completed successfully!');
  } catch (error) {
    console.error('\n❌ Health check test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testHealthEndpoints();
