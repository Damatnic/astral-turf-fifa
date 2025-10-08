import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';

export async function seedDemoUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if demo users already exist
  const existingCoach = await userRepository.findOne({
    where: { email: 'coach@astralfc.com' },
  });

  if (existingCoach) {
    console.log('Demo users already exist, skipping seed...');
    return;
  }

  console.log('Creating demo users...');

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  const demoUsers = [
    {
      email: 'coach@astralfc.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Anderson',
      role: UserRole.COACH,
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'player1@astralfc.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Hunter',
      role: UserRole.PLAYER,
      isEmailVerified: true,
      isActive: true,
    },
    {
      email: 'linda.smith@astralfc.com',
      password: hashedPassword,
      firstName: 'Linda',
      lastName: 'Smith',
      role: UserRole.FAMILY,
      isEmailVerified: true,
      isActive: true,
    },
  ];

  for (const userData of demoUsers) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
    console.log(`✅ Created demo user: ${userData.email} (${userData.role})`);
  }

  console.log('✅ Demo users seeded successfully!');
}
