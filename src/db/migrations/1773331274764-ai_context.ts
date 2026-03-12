import { MigrationInterface, QueryRunner } from "typeorm";

export class AiContext1773331274764 implements MigrationInterface {
    name = 'AiContext1773331274764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "poll_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message_id" integer NOT NULL, "options" varchar NOT NULL, "win_index" integer NOT NULL DEFAULT (-1), "until_date" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "season_poll_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "poll_id" integer NOT NULL, "is_processed" boolean NOT NULL DEFAULT (0))`);
        await queryRunner.query(`CREATE TABLE "season_schedule_notify_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "start_date" varchar NOT NULL, "end_date" varchar NOT NULL, "periodicity" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "ai_personality_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sysname" varchar NOT NULL, "name" varchar NOT NULL, "instructions" varchar NOT NULL, "model" varchar NOT NULL, CONSTRAINT "UQ_3954ce43f0d293f46e981c4bf7b" UNIQUE ("sysname"))`);
        await queryRunner.query(`CREATE TABLE "xai_response_history_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "response_id" varchar NOT NULL, "personality_sysname" varchar NOT NULL, "date_created" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "message_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message_id" integer NOT NULL, "chat_id" integer NOT NULL, "from_username" varchar NOT NULL, "date" varchar NOT NULL, "json" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "xai_processed_message_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "personality_sysname" varchar NOT NULL, "message_id" integer NOT NULL, "chat_id" integer NOT NULL, "date_processed" varchar NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "xai_processed_message_entity"`);
        await queryRunner.query(`DROP TABLE "message_entity"`);
        await queryRunner.query(`DROP TABLE "xai_response_history_entity"`);
        await queryRunner.query(`DROP TABLE "ai_personality_entity"`);
        await queryRunner.query(`DROP TABLE "season_schedule_notify_entity"`);
        await queryRunner.query(`DROP TABLE "season_poll_entity"`);
        await queryRunner.query(`DROP TABLE "poll_entity"`);
    }

}
