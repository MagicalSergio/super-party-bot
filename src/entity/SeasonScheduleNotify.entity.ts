import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class SeasonScheduleNotifyEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    start_date: string;

    @Column()
    end_date: string;

    @Column()
    periodicity: number;

    static async findByDate(date: string): Promise<SeasonScheduleNotifyEntity | null> {
        return this.createQueryBuilder("s")
            .where("s.start_date <= :date AND s.end_date >= :date", { date })
            .getOne();
    }
}
