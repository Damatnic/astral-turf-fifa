import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
  }

  async initialize() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async seed() {
    await this.initialize();

    console.log('🌱 Starting database seeding...');

    await this.seedUsers();
    await this.seedSessions();

    console.log('✅ Database seeding completed!');
  }

  private async seedUsers() {
    const userRepository = this.dataSource.getRepository('users');

    // Check if users already exist
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('⏭️  Users already exist, skipping user seeding');
      return;
    }

    console.log('👥 Seeding users...');

    const hashedPassword = await bcrypt.hash('Demo123!', 10);

    const users = [
      {
        email: 'admin@astralturf.com',
        password: hashedPassword,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        email_verified: true,
        is_active: true,
      },
      {
        email: 'coach.demo@astralturf.com',
        password: hashedPassword,
        role: 'coach',
        first_name: 'Demo',
        last_name: 'Coach',
        email_verified: true,
        is_active: true,
      },
      {
        email: 'player.demo@astralturf.com',
        password: hashedPassword,
        role: 'player',
        first_name: 'Demo',
        last_name: 'Player',
        email_verified: true,
        is_active: true,
      },
      {
        email: 'family.demo@astralturf.com',
        password: hashedPassword,
        role: 'family',
        first_name: 'Demo',
        last_name: 'Family',
        email_verified: true,
        is_active: true,
      },
    ];

    for (const userData of users) {
      await userRepository.save(userData);
      console.log(`   ✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('✅ Users seeded successfully');
  }

  private async seedSessions() {
    // Sessions will be created when users log in
    console.log('⏭️  Sessions will be created on login');
  }

  async close() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

// Run seeder if executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder
    .seed()
    .then(() => {
      console.log('🎉 Seeding process finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
