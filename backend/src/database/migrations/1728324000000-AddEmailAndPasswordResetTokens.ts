import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailAndPasswordResetTokens1728324000000 implements MigrationInterface {
  name = 'AddEmailAndPasswordResetTokens1728324000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification token field
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verification_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // Add email verification expiration field
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verification_expires',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add password reset token field
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_reset_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // Add password reset expiration field
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_reset_expires',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Create index on email_verification_token for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
      ON users(email_verification_token) 
      WHERE email_verification_token IS NOT NULL
    `);

    // Create index on password_reset_token for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
      ON users(password_reset_token) 
      WHERE password_reset_token IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_password_reset_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email_verification_token`);

    // Drop columns
    await queryRunner.dropColumn('users', 'password_reset_expires');
    await queryRunner.dropColumn('users', 'password_reset_token');
    await queryRunner.dropColumn('users', 'email_verification_expires');
    await queryRunner.dropColumn('users', 'email_verification_token');
  }
}
