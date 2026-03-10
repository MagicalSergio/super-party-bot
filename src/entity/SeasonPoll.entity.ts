import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SeasonPollEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    poll_id: number;

    @Column({ default: false })
    is_processed: boolean;

    static async getUnprocessed(): Promise<SeasonPollEntity[]> {
        return this.createQueryBuilder('seasonPoll')
            .where('seasonPoll.is_processed = :isProcessed', { isProcessed: false })
            .getMany();
    }
}
