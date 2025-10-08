import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1728324000000 implements MigrationInterface {
  name = 'InitialSchema1728324000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create UserRole enum (if it doesn't exist)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM('coach', 'player', 'family', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'player',
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "profile_image" character varying,
        "phone_number" character varying,
        "timezone" character varying NOT NULL DEFAULT 'UTC',
        "language" character varying NOT NULL DEFAULT 'en',
        "player_id" character varying,
        "coach_id" character varying,
        "notifications" jsonb NOT NULL DEFAULT '{"email":true,"sms":false,"push":true,"matchUpdates":true,"trainingReminders":true,"emergencyAlerts":true,"paymentReminders":false}',
        "is_active" boolean NOT NULL DEFAULT true,
        "email_verified" boolean NOT NULL DEFAULT false,
        "needs_password_reset" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_login_at" TIMESTAMP,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Create email index
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
    `);

    // Create sessions table
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "refresh_token" character varying(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id")
      )
    `);

    // Create sessions indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_9cfe37d28c3b229a350e086d94" ON "sessions" ("expires_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id")
    `);

    // Create family_permissions_relationship enum
    await queryRunner.query(`
      CREATE TYPE "family_permissions_relationship_enum" AS ENUM('mother', 'father', 'guardian', 'sibling', 'other')
    `);

    // Create family_permissions table
    await queryRunner.query(`
      CREATE TABLE "family_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "family_member_id" uuid NOT NULL,
        "player_id" character varying NOT NULL,
        "relationship" "family_permissions_relationship_enum" NOT NULL DEFAULT 'other',
        "can_view_stats" boolean NOT NULL DEFAULT true,
        "can_view_schedule" boolean NOT NULL DEFAULT true,
        "can_view_medical" boolean NOT NULL DEFAULT false,
        "can_communicate_with_coach" boolean NOT NULL DEFAULT true,
        "can_view_financials" boolean NOT NULL DEFAULT false,
        "can_receive_notifications" boolean NOT NULL DEFAULT true,
        "approved_by_coach" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_7b644cb8610238efdf076d30267" PRIMARY KEY ("id")
      )
    `);

    // Create family_permissions unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_aba676d8d451c398c17b737c01" 
      ON "family_permissions" ("family_member_id", "player_id")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "sessions" 
      ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "family_permissions" 
      ADD CONSTRAINT "FK_3dc4a77988cf25ba550c8a9dc08" 
      FOREIGN KEY ("family_member_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "family_permissions" DROP CONSTRAINT "FK_3dc4a77988cf25ba550c8a9dc08"
    `);
    await queryRunner.query(`
      ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_aba676d8d451c398c17b737c01"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9cfe37d28c3b229a350e086d94"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "family_permissions"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "family_permissions_relationship_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
