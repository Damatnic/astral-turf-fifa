import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  COACH = 'coach',
  PLAYER = 'player',
  FAMILY = 'family',
  ADMIN = 'admin',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ default: 'en' })
  language: string;

  // Role-specific associations
  @Column({ name: 'player_id', nullable: true })
  playerId?: string;

  @Column({ name: 'coach_id', nullable: true })
  coachId?: string;

  // Notification preferences (stored as JSONB)
  @Column({
    type: 'jsonb',
    default: {
      email: true,
      sms: false,
      push: true,
      matchUpdates: true,
      trainingReminders: true,
      emergencyAlerts: true,
      paymentReminders: false,
    },
  })
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    matchUpdates: boolean;
    trainingReminders: boolean;
    emergencyAlerts: boolean;
    paymentReminders: boolean;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'needs_password_reset', default: false })
  needsPasswordReset: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;
}
