import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTeamsTable1759866511255 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
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
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'int',
          },
          {
            name: 'maxPlayers',
            type: 'int',
            default: 25,
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
      true
    );

    // Create team_members table
    await queryRunner.createTable(
      new Table({
        name: 'team_members',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'teamId',
            type: 'int',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'coach', 'player'],
            default: "'player'",
          },
          {
            name: 'jerseyNumber',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create team_invitations table
    await queryRunner.createTable(
      new Table({
        name: 'team_invitations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'teamId',
            type: 'int',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['coach', 'player'],
            default: "'player'",
          },
          {
            name: 'token',
            type: 'varchar',
            length: '64',
            isUnique: true,
          },
          {
            name: 'invitedBy',
            type: 'int',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: "'pending'",
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign keys for teams table
    await queryRunner.createForeignKey(
      'teams',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add foreign keys for team_members table
    await queryRunner.createForeignKey(
      'team_members',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'team_members',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add foreign keys for team_invitations table
    await queryRunner.createForeignKey(
      'team_invitations',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'team_invitations',
      new TableForeignKey({
        columnNames: ['invitedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'teams',
      new TableIndex({
        name: 'IDX_TEAMS_OWNER',
        columnNames: ['ownerId'],
      })
    );

    await queryRunner.createIndex(
      'team_members',
      new TableIndex({
        name: 'IDX_TEAM_MEMBERS_TEAM',
        columnNames: ['teamId'],
      })
    );

    await queryRunner.createIndex(
      'team_members',
      new TableIndex({
        name: 'IDX_TEAM_MEMBERS_USER',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'team_members',
      new TableIndex({
        name: 'IDX_TEAM_MEMBERS_UNIQUE',
        columnNames: ['teamId', 'userId'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'team_invitations',
      new TableIndex({
        name: 'IDX_TEAM_INVITATIONS_TEAM',
        columnNames: ['teamId'],
      })
    );

    await queryRunner.createIndex(
      'team_invitations',
      new TableIndex({
        name: 'IDX_TEAM_INVITATIONS_EMAIL',
        columnNames: ['email'],
      })
    );

    await queryRunner.createIndex(
      'team_invitations',
      new TableIndex({
        name: 'IDX_TEAM_INVITATIONS_TOKEN',
        columnNames: ['token'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('team_invitations', 'IDX_TEAM_INVITATIONS_TOKEN');
    await queryRunner.dropIndex('team_invitations', 'IDX_TEAM_INVITATIONS_EMAIL');
    await queryRunner.dropIndex('team_invitations', 'IDX_TEAM_INVITATIONS_TEAM');
    await queryRunner.dropIndex('team_members', 'IDX_TEAM_MEMBERS_UNIQUE');
    await queryRunner.dropIndex('team_members', 'IDX_TEAM_MEMBERS_USER');
    await queryRunner.dropIndex('team_members', 'IDX_TEAM_MEMBERS_TEAM');
    await queryRunner.dropIndex('teams', 'IDX_TEAMS_OWNER');

    // Drop foreign keys
    const teamInvitationsTable = await queryRunner.getTable('team_invitations');
    if (teamInvitationsTable) {
      const teamInvitationsForeignKeys = teamInvitationsTable.foreignKeys;
      for (const fk of teamInvitationsForeignKeys) {
        await queryRunner.dropForeignKey('team_invitations', fk);
      }
    }

    const teamMembersTable = await queryRunner.getTable('team_members');
    if (teamMembersTable) {
      const teamMembersForeignKeys = teamMembersTable.foreignKeys;
      for (const fk of teamMembersForeignKeys) {
        await queryRunner.dropForeignKey('team_members', fk);
      }
    }

    const teamsTable = await queryRunner.getTable('teams');
    if (teamsTable) {
      const teamsForeignKeys = teamsTable.foreignKeys;
      for (const fk of teamsForeignKeys) {
        await queryRunner.dropForeignKey('teams', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('team_invitations');
    await queryRunner.dropTable('team_members');
    await queryRunner.dropTable('teams');
  }
}
