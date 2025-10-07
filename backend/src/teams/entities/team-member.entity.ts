import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';

export enum TeamRole {
  OWNER = 'owner',
  COACH = 'coach',
  PLAYER = 'player',
}

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  teamId: number;

  @ManyToOne(() => Team, team => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: TeamRole,
    default: TeamRole.PLAYER,
  })
  role: TeamRole;

  @Column({ nullable: true })
  jerseyNumber: number;

  @Column({ length: 50, nullable: true })
  position: string;

  @CreateDateColumn()
  joinedAt: Date;
}
