import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePlayersTable1759867844000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create players table
    await queryRunner.createTable(
      new Table({
        name: 'players',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true, // Can be null for players not linked to users
          },
          {
            name: 'teamId',
            type: 'int',
            isNullable: true, // Can be null for free agents
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'nationality',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'enum',
            enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'],
          },
          {
            name: 'preferredFoot',
            type: 'enum',
            enum: ['LEFT', 'RIGHT', 'BOTH'],
            default: "'RIGHT'",
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
            comment: 'Height in centimeters',
          },
          {
            name: 'weight',
            type: 'int',
            isNullable: true,
            comment: 'Weight in kilograms',
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'photoUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INJURED', 'SUSPENDED', 'INACTIVE'],
            default: "'ACTIVE'",
          },
          {
            name: 'contractStart',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'contractEnd',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'marketValue',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Market value in currency',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create player_stats table
    await queryRunner.createTable(
      new Table({
        name: 'player_stats',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'playerId',
            type: 'int',
          },
          {
            name: 'season',
            type: 'varchar',
            length: '20',
            comment: 'e.g., 2023-2024',
          },
          {
            name: 'matchesPlayed',
            type: 'int',
            default: 0,
          },
          {
            name: 'minutesPlayed',
            type: 'int',
            default: 0,
          },
          {
            name: 'goals',
            type: 'int',
            default: 0,
          },
          {
            name: 'assists',
            type: 'int',
            default: 0,
          },
          {
            name: 'yellowCards',
            type: 'int',
            default: 0,
          },
          {
            name: 'redCards',
            type: 'int',
            default: 0,
          },
          {
            name: 'cleanSheets',
            type: 'int',
            default: 0,
            comment: 'For goalkeepers',
          },
          {
            name: 'saves',
            type: 'int',
            default: 0,
            comment: 'For goalkeepers',
          },
          {
            name: 'passAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Percentage 0-100',
          },
          {
            name: 'shotAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Percentage 0-100',
          },
          {
            name: 'averageRating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
            comment: 'Average match rating 0-10',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create player_attributes table
    await queryRunner.createTable(
      new Table({
        name: 'player_attributes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'playerId',
            type: 'int',
          },
          // Physical Attributes
          {
            name: 'pace',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'acceleration',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'stamina',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'strength',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'agility',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'jumping',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          // Technical Attributes
          {
            name: 'ballControl',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'dribbling',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'passing',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'crossing',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'shooting',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'longShots',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'finishing',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'heading',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          // Defensive Attributes
          {
            name: 'marking',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'tackling',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'interceptions',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'positioning',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          // Goalkeeper Attributes
          {
            name: 'diving',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100 (GK)',
          },
          {
            name: 'handling',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100 (GK)',
          },
          {
            name: 'kicking',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100 (GK)',
          },
          {
            name: 'reflexes',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100 (GK)',
          },
          // Mental Attributes
          {
            name: 'vision',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'composure',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'workRate',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          {
            name: 'teamwork',
            type: 'int',
            default: 50,
            comment: 'Rating 0-100',
          },
          // Overall Rating (calculated)
          {
            name: 'overallRating',
            type: 'int',
            default: 50,
            comment: 'Overall rating 0-100 (calculated)',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'players',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'players',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'player_stats',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'players',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'player_attributes',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'players',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYERS_USER_ID" ON "players" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYERS_TEAM_ID" ON "players" ("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYERS_POSITION" ON "players" ("position")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYERS_STATUS" ON "players" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYER_STATS_PLAYER_ID" ON "player_stats" ("playerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYER_STATS_SEASON" ON "player_stats" ("season")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PLAYER_ATTRIBUTES_PLAYER_ID" ON "player_attributes" ("playerId")`,
    );

    // Add unique constraints
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PLAYER_STATS_PLAYER_SEASON" ON "player_stats" ("playerId", "season")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PLAYER_ATTRIBUTES_PLAYER" ON "player_attributes" ("playerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const playersTable = await queryRunner.getTable('players');
    const playerStatsTable = await queryRunner.getTable('player_stats');
    const playerAttributesTable = await queryRunner.getTable('player_attributes');

    if (playersTable) {
      const userForeignKey = playersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      const teamForeignKey = playersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('teamId') !== -1,
      );
      if (userForeignKey) {
        await queryRunner.dropForeignKey('players', userForeignKey);
      }
      if (teamForeignKey) {
        await queryRunner.dropForeignKey('players', teamForeignKey);
      }
    }

    if (playerStatsTable) {
      const statsForeignKey = playerStatsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('playerId') !== -1,
      );
      if (statsForeignKey) {
        await queryRunner.dropForeignKey('player_stats', statsForeignKey);
      }
    }

    if (playerAttributesTable) {
      const attributesForeignKey = playerAttributesTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('playerId') !== -1,
      );
      if (attributesForeignKey) {
        await queryRunner.dropForeignKey('player_attributes', attributesForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('player_attributes', true);
    await queryRunner.dropTable('player_stats', true);
    await queryRunner.dropTable('players', true);
  }
}
