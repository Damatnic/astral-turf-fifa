import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { FormationPosition } from './formation-position.entity';
import { FormationShape, TacticalInstructions } from './formation.types';

@Entity('formations')
export class Formation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  shape: FormationShape;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ nullable: true })
  teamId: number | null;

  @ManyToOne(() => Team, (team) => team.formations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ default: false })
  isTemplate: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tacticalInstructions: TacticalInstructions;

  @OneToMany(() => FormationPosition, (position) => position.formation, {
    cascade: true,
  })
  positions: FormationPosition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
