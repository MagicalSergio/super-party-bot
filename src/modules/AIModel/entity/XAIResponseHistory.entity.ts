import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class XAIResponseHistoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    response_id: string;

    @Column()
    model_sysname: string;

    @Column()
    date_created: string;

    static async getLastResponseId(modelSysname: string) {
        return await this.findOne({
            where: { model_sysname: modelSysname },
            order: { id: 'DESC' },
        });
    }
}
