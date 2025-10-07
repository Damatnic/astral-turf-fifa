import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFormationsTable1759868500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create formations table
    await queryRunner.createTable(
      new Table({
        name: 'formations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'shape',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'Formation shape (e.g., 4-4-2, 4-3-3, 3-5-2)',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
            comment: 'User who created this formation',
          },
          {
            name: 'teamId',
            type: 'int',
            isNullable: true,
            comment: 'Team this formation is associated with (optional)',
          },
          {
            name: 'isTemplate',
            type: 'boolean',
            default: false,
            comment: 'Whether this is a system template',
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
            comment: 'Whether this is the default formation for the team',
          },
          {
            name: 'tacticalInstructions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Tactical instructions (pressing, tempo, width, etc.)',
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
            name: 'IDX_formations_owner',
            columnNames: ['ownerId'],
          },
          {
            name: 'IDX_formations_team',
            columnNames: ['teamId'],
          },
          {
            name: 'IDX_formations_template',
            columnNames: ['isTemplate'],
          },
        ],
      }),
      true,
    );

    // Create formation_positions table
    await queryRunner.createTable(
      new Table({
        name: 'formation_positions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'formationId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'playerId',
            type: 'int',
            isNullable: true,
            comment: 'Player assigned to this position (optional)',
          },
          {
            name: 'position',
            type: 'varchar',
            length: '10',
            isNullable: false,
            comment: 'Position code (GK, CB, LB, RB, CM, CAM, LW, RW, ST, etc.)',
          },
          {
            name: 'positionX',
            type: 'float',
            isNullable: false,
            comment: 'X coordinate on field (0-100 scale)',
          },
          {
            name: 'positionY',
            type: 'float',
            isNullable: false,
            comment: 'Y coordinate on field (0-100 scale)',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Specific role (e.g., Ball-Playing Defender, Box-to-Box Midfielder)',
          },
          {
            name: 'instructions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Position-specific instructions',
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
            name: 'IDX_formation_positions_formation',
            columnNames: ['formationId'],
          },
          {
            name: 'IDX_formation_positions_player',
            columnNames: ['playerId'],
          },
        ],
      }),
      true,
    );

    // Add foreign keys for formations table
    await queryRunner.createForeignKey(
      'formations',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_formations_owner',
      }),
    );

    await queryRunner.createForeignKey(
      'formations',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_formations_team',
      }),
    );

    // Add foreign keys for formation_positions table
    await queryRunner.createForeignKey(
      'formation_positions',
      new TableForeignKey({
        columnNames: ['formationId'],
        referencedTableName: 'formations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_formation_positions_formation',
      }),
    );

    await queryRunner.createForeignKey(
      'formation_positions',
      new TableForeignKey({
        columnNames: ['playerId'],
        referencedTableName: 'players',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_formation_positions_player',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('formation_positions', 'FK_formation_positions_player');
    await queryRunner.dropForeignKey('formation_positions', 'FK_formation_positions_formation');
    await queryRunner.dropForeignKey('formations', 'FK_formations_team');
    await queryRunner.dropForeignKey('formations', 'FK_formations_owner');

    // Drop tables
    await queryRunner.dropTable('formation_positions');
    await queryRunner.dropTable('formations');
  }
}
