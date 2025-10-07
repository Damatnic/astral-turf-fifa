import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum FamilyRelationship {
  MOTHER = 'mother',
  FATHER = 'father',
  GUARDIAN = 'guardian',
  SIBLING = 'sibling',
  OTHER = 'other',
}

@Entity('family_permissions')
@Index(['familyMemberId', 'playerId'], { unique: true })
export class FamilyPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'family_member_id' })
  familyMemberId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_member_id' })
  familyMember: User;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({
    type: 'enum',
    enum: FamilyRelationship,
    default: FamilyRelationship.OTHER,
  })
  relationship: FamilyRelationship;

  @Column({ name: 'can_view_stats', default: true })
  canViewStats: boolean;

  @Column({ name: 'can_view_schedule', default: true })
  canViewSchedule: boolean;

  @Column({ name: 'can_view_medical', default: false })
  canViewMedical: boolean;

  @Column({ name: 'can_communicate_with_coach', default: true })
  canCommunicateWithCoach: boolean;

  @Column({ name: 'can_view_financials', default: false })
  canViewFinancials: boolean;

  @Column({ name: 'can_receive_notifications', default: true })
  canReceiveNotifications: boolean;

  @Column({ name: 'approved_by_coach', default: false })
  approvedByCoach: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
