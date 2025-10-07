import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { PlayerStats } from './player-stats.entity';
import { PlayerAttributes } from './player-attributes.entity';

export enum PlayerPosition {
  GK = 'GK',   // Goalkeeper
  CB = 'CB',   // Center Back
  LB = 'LB',   // Left Back
  RB = 'RB',   // Right Back
  CDM = 'CDM', // Defensive Midfielder
  CM = 'CM',   // Center Midfielder
  CAM = 'CAM', // Attacking Midfielder
  LM = 'LM',   // Left Midfielder
  RM = 'RM',   // Right Midfielder
  LW = 'LW',   // Left Winger
  RW = 'RW',   // Right Winger
  ST = 'ST',   // Striker
}

export enum PreferredFoot {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  BOTH = 'BOTH',
}

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  INJURED = 'INJURED',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'int', nullable: true })
  teamId: number | null;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({
    type: 'enum',
    enum: PlayerPosition,
  })
  position: PlayerPosition;

  @Column({
    type: 'enum',
    enum: PreferredFoot,
    default: PreferredFoot.RIGHT,
  })
  preferredFoot: PreferredFoot;

  @Column({ type: 'int', nullable: true, comment: 'Height in centimeters' })
  height: number;

  @Column({ type: 'int', nullable: true, comment: 'Weight in kilograms' })
  weight: number;

  @Column({ type: 'int', nullable: true })
  jerseyNumber: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string;

  @Column({
    type: 'enum',
    enum: PlayerStatus,
    default: PlayerStatus.ACTIVE,
  })
  status: PlayerStatus;

  @Column({ type: 'date', nullable: true })
  contractStart: Date;

  @Column({ type: 'date', nullable: true })
  contractEnd: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Market value in currency',
  })
  marketValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Team, (team) => team.players, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @OneToMany(() => PlayerStats, (stats) => stats.player, { cascade: true })
  stats: PlayerStats[];

  @OneToOne(() => PlayerAttributes, (attributes) => attributes.player, {
    cascade: true,
  })
  attributes: PlayerAttributes;

  // Computed property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Computed property for age
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
}
