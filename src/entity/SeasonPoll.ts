import { BaseEntity, Column, Entity, ForeignKey, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SeasonPoll extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    poll_id: number;

    @Column({ default: false })
    is_processed: boolean;

    static async getUnprocessed(): Promise<SeasonPoll[]> {
        return this.createQueryBuilder('seasonPoll')
            .where('seasonPoll.is_processed = :isProcessed', { isProcessed: false })
            .getMany();
    }
}
