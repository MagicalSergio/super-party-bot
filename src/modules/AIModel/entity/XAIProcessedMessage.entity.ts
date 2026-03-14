import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class XAIProcessedMessageEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    personality_sysname: string;

    @Column()
    message_id: number;

    @Column()
    chat_id: number;

    @Column()
    date_processed: string;

    static async getLast(personSysname?: string) {
        return await this.findOne({ order: { id: 'DESC' }, where: { personality_sysname: personSysname } });
    }

    static async getLastDateProcessed(personSysname?: string) {
        const last = await this.findOne({ order: { id: 'DESC' }, where: { personality_sysname: personSysname } });
        return last ? last.date_processed : null;
    }
}
