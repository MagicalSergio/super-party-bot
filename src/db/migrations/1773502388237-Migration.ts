import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1773502388237 implements MigrationInterface {
    name = 'Migration1773502388237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "xai_processed_message_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "personality_sysname" varchar NOT NULL, "message_id" integer NOT NULL, "chat_id" integer NOT NULL, "date_processed" varchar NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "xai_processed_message_entity"`);
    }

}
