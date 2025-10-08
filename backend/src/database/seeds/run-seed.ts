import { DataSource } from 'typeorm';
import { seedDemoUsers } from './demo-users.seed';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: true,
});

async function runSeeds() {
  try {
    console.log('🌱 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected!');

    console.log('🌱 Running seeds...');
    await seedDemoUsers(dataSource);

    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed.');
    }
  }
}

runSeeds()
  .then(() => {
    console.log('✅ Seeding process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
