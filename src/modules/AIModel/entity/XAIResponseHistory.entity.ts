import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class XAIResponseHistoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    response_id: string;

    @Column()
    personality_sysname: string;

    @Column()
    date_created: string;

    static async getLastResponseId(sysname: string) {
        return await this.findOne({
            where: { personality_sysname: sysname },
            order: { id: 'DESC' },
        });
    }
}
