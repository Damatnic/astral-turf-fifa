import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Formation } from './formation.entity';
import { Player, PlayerPosition } from '../../players/entities/player.entity';
import { PlayerRole } from './formation.types';

export interface PositionInstructions {
  stayBack?: boolean;
  stayForward?: boolean;
  cutInside?: boolean;
  getInBox?: boolean;
  conservative?: boolean;
  aggressive?: boolean;
  supportRun?: boolean;
  overlappingRun?: boolean;
}

@Entity('formation_positions')
export class FormationPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formationId: number;

  @ManyToOne(() => Formation, (formation) => formation.positions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'formationId' })
  formation: Formation;

  @Column({ nullable: true })
  playerId: number | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ length: 10 })
  position: PlayerPosition;

  @Column({ type: 'float' })
  positionX: number;

  @Column({ type: 'float' })
  positionY: number;

  @Column({ length: 50, nullable: true })
  role: PlayerRole;

  @Column({ type: 'jsonb', nullable: true })
  instructions: PositionInstructions;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
