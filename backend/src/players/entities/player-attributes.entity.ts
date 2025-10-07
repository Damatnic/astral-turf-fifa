import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from './player.entity';

@Entity('player_attributes')
export class PlayerAttributes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  playerId: number;

  // Physical Attributes
  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  pace: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  acceleration: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  stamina: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  strength: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  agility: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  jumping: number;

  // Technical Attributes
  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  ballControl: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  dribbling: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  passing: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  crossing: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  shooting: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  longShots: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  finishing: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  heading: number;

  // Defensive Attributes
  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  marking: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  tackling: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  interceptions: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  positioning: number;

  // Goalkeeper Attributes
  @Column({ type: 'int', default: 50, comment: 'Rating 0-100 (GK)' })
  diving: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100 (GK)' })
  handling: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100 (GK)' })
  kicking: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100 (GK)' })
  reflexes: number;

  // Mental Attributes
  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  vision: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  composure: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  workRate: number;

  @Column({ type: 'int', default: 50, comment: 'Rating 0-100' })
  teamwork: number;

  // Overall Rating (calculated)
  @Column({
    type: 'int',
    default: 50,
    comment: 'Overall rating 0-100 (calculated)',
  })
  overallRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Player, (player) => player.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  // Calculate overall rating based on position
  calculateOverallRating(position: string): number {
    const ratings: { [key: string]: number[] } = {
      GK: [this.diving, this.handling, this.kicking, this.reflexes, this.positioning],
      CB: [this.tackling, this.marking, this.strength, this.heading, this.positioning],
      LB: [this.tackling, this.marking, this.pace, this.stamina, this.crossing],
      RB: [this.tackling, this.marking, this.pace, this.stamina, this.crossing],
      CDM: [this.tackling, this.interceptions, this.passing, this.strength, this.positioning],
      CM: [this.passing, this.ballControl, this.stamina, this.vision, this.workRate],
      CAM: [this.passing, this.ballControl, this.shooting, this.vision, this.dribbling],
      LM: [this.pace, this.crossing, this.stamina, this.dribbling, this.passing],
      RM: [this.pace, this.crossing, this.stamina, this.dribbling, this.passing],
      LW: [this.pace, this.dribbling, this.shooting, this.crossing, this.agility],
      RW: [this.pace, this.dribbling, this.shooting, this.crossing, this.agility],
      ST: [this.finishing, this.shooting, this.heading, this.positioning, this.strength],
    };

    const positionRatings = ratings[position] || [];
    if (positionRatings.length === 0) {
      // Default calculation if position not found
      const defending = (this.tackling + this.marking) / 2;
      const physical = (this.strength + this.stamina) / 2;
      const allRatings = [
        this.pace,
        this.shooting,
        this.passing,
        this.dribbling,
        defending,
        physical,
      ];
      return Math.round(
        allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length,
      );
    }

    return Math.round(
      positionRatings.reduce((sum, rating) => sum + rating, 0) /
        positionRatings.length,
    );
  }
}
