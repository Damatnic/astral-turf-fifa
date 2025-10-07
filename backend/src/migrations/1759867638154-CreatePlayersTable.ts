import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlayersTable1759867638154 implements MigrationInterface {
    name = 'CreatePlayersTable1759867638154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."team_members_role_enum" AS ENUM('owner', 'coach', 'player')`);
        await queryRunner.query(`CREATE TABLE "team_members" ("id" SERIAL NOT NULL, "teamId" integer NOT NULL, "userId" uuid NOT NULL, "role" "public"."team_members_role_enum" NOT NULL DEFAULT 'player', "jerseyNumber" integer, "position" character varying(50), "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca3eae89dcf20c9fd95bf7460aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."team_invitations_role_enum" AS ENUM('coach', 'player')`);
        await queryRunner.query(`CREATE TYPE "public"."team_invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'expired')`);
        await queryRunner.query(`CREATE TABLE "team_invitations" ("id" SERIAL NOT NULL, "teamId" integer NOT NULL, "email" character varying(255) NOT NULL, "role" "public"."team_invitations_role_enum" NOT NULL DEFAULT 'player', "token" character varying(64) NOT NULL, "invitedBy" uuid NOT NULL, "status" "public"."team_invitations_status_enum" NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_760191b7c119337743fb95b471b" UNIQUE ("token"), CONSTRAINT "PK_c14b443d431077f89344a3fd262" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teams" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, "logoUrl" character varying(500), "ownerId" uuid NOT NULL, "maxPlayers" integer NOT NULL DEFAULT '25', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_expires" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expires" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invitations" ADD CONSTRAINT "FK_51467b016e4b6bc51f2d2f080a8" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invitations" ADD CONSTRAINT "FK_c13981293192b9b825f489e86d7" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_b5ebe13256317503931ecabb556" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_b5ebe13256317503931ecabb556"`);
        await queryRunner.query(`ALTER TABLE "team_invitations" DROP CONSTRAINT "FK_c13981293192b9b825f489e86d7"`);
        await queryRunner.query(`ALTER TABLE "team_invitations" DROP CONSTRAINT "FK_51467b016e4b6bc51f2d2f080a8"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP TABLE "team_invitations"`);
        await queryRunner.query(`DROP TYPE "public"."team_invitations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."team_invitations_role_enum"`);
        await queryRunner.query(`DROP TABLE "team_members"`);
        await queryRunner.query(`DROP TYPE "public"."team_members_role_enum"`);
    }

}
