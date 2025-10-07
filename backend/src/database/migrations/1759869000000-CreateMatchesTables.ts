import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMatchesTables1759869000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create matches table
    await queryRunner.createTable(
      new Table({
        name: 'matches',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'homeTeamId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'awayTeamId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'scheduledAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'scheduled'",
            comment: 'Match status: scheduled, in_progress, completed, cancelled, postponed',
          },
          {
            name: 'homeScore',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'awayScore',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'venue',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'competition',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'round',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'homeFormationId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'awayFormationId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_matches_home_team',
            columnNames: ['homeTeamId'],
          },
          {
            name: 'IDX_matches_away_team',
            columnNames: ['awayTeamId'],
          },
          {
            name: 'IDX_matches_scheduled_at',
            columnNames: ['scheduledAt'],
          },
          {
            name: 'IDX_matches_status',
            columnNames: ['status'],
          },
        ],
      }),
      true,
    );

    // Create match_lineups table
    await queryRunner.createTable(
      new Table({
        name: 'match_lineups',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'matchId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'teamId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'playerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'isStarting',
            type: 'boolean',
            default: true,
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'minutesPlayed',
            type: 'int',
            default: 0,
          },
          {
            name: 'rating',
            type: 'float',
            isNullable: true,
            comment: 'Post-match performance rating (0-10)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_match_lineups_match',
            columnNames: ['matchId'],
          },
          {
            name: 'IDX_match_lineups_team',
            columnNames: ['teamId'],
          },
          {
            name: 'IDX_match_lineups_player',
            columnNames: ['playerId'],
          },
        ],
      }),
      true,
    );

    // Create match_events table
    await queryRunner.createTable(
      new Table({
        name: 'match_events',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'matchId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'teamId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'playerId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'eventType',
            type: 'varchar',
            length: '30',
            isNullable: false,
            comment: 'Event type: goal, assist, yellow_card, red_card, substitution_in, substitution_out, injury',
          },
          {
            name: 'minute',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'extraTime',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'relatedPlayerId',
            type: 'int',
            isNullable: true,
            comment: 'For assists or substitutions (player being replaced)',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_match_events_match',
            columnNames: ['matchId'],
          },
          {
            name: 'IDX_match_events_team',
            columnNames: ['teamId'],
          },
          {
            name: 'IDX_match_events_player',
            columnNames: ['playerId'],
          },
          {
            name: 'IDX_match_events_type',
            columnNames: ['eventType'],
          },
        ],
      }),
      true,
    );

    // Add foreign keys for matches table
    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['homeTeamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_matches_home_team',
      }),
    );

    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['awayTeamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_matches_away_team',
      }),
    );

    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['homeFormationId'],
        referencedTableName: 'formations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_matches_home_formation',
      }),
    );

    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['awayFormationId'],
        referencedTableName: 'formations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_matches_away_formation',
      }),
    );

    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_matches_created_by',
      }),
    );

    // Add foreign keys for match_lineups table
    await queryRunner.createForeignKey(
      'match_lineups',
      new TableForeignKey({
        columnNames: ['matchId'],
        referencedTableName: 'matches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_match_lineups_match',
      }),
    );

    await queryRunner.createForeignKey(
      'match_lineups',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_match_lineups_team',
      }),
    );

    await queryRunner.createForeignKey(
      'match_lineups',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_match_lineups_player',
      }),
    );

    // Add foreign keys for match_events table
    await queryRunner.createForeignKey(
      'match_events',
      new TableForeignKey({
        columnNames: ['matchId'],
        referencedTableName: 'matches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_match_events_match',
      }),
    );

    await queryRunner.createForeignKey(
      'match_events',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_match_events_team',
      }),
    );

    await queryRunner.createForeignKey(
      'match_events',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_match_events_player',
      }),
    );

    await queryRunner.createForeignKey(
      'match_events',
      new TableForeignKey({
        columnNames: ['relatedPlayerId'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_match_events_related_player',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys for match_events
    await queryRunner.dropForeignKey('match_events', 'FK_match_events_related_player');
    await queryRunner.dropForeignKey('match_events', 'FK_match_events_player');
    await queryRunner.dropForeignKey('match_events', 'FK_match_events_team');
    await queryRunner.dropForeignKey('match_events', 'FK_match_events_match');

    // Drop foreign keys for match_lineups
    await queryRunner.dropForeignKey('match_lineups', 'FK_match_lineups_player');
    await queryRunner.dropForeignKey('match_lineups', 'FK_match_lineups_team');
    await queryRunner.dropForeignKey('match_lineups', 'FK_match_lineups_match');

    // Drop foreign keys for matches
    await queryRunner.dropForeignKey('matches', 'FK_matches_created_by');
    await queryRunner.dropForeignKey('matches', 'FK_matches_away_formation');
    await queryRunner.dropForeignKey('matches', 'FK_matches_home_formation');
    await queryRunner.dropForeignKey('matches', 'FK_matches_away_team');
    await queryRunner.dropForeignKey('matches', 'FK_matches_home_team');

    // Drop tables
    await queryRunner.dropTable('match_events');
    await queryRunner.dropTable('match_lineups');
    await queryRunner.dropTable('matches');
  }
}
