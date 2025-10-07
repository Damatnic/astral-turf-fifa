import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailAndPasswordResetTokens1759862813293 implements MigrationInterface {
  name = 'AddEmailAndPasswordResetTokens1759862813293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_expires" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expires" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token"`);
  }
}
