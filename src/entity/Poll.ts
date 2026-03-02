import { DateTime } from 'luxon';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TIMEZONE } from '../const.js';

@Entity()
export class Poll extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message_id: number;

    @Column()
    options: string;

    @Column({ default: -1 })
    win_index: number;

    @Column()
    until_date: string;

    static async getExpired(): Promise<Poll[]> {
        return this.createQueryBuilder("poll")
            .where("poll.win_index = :winIndex", { winIndex: -1 })
            .andWhere("poll.until_date <= :now", { now: DateTime.now().setZone(TIMEZONE).toISO() })
            .getMany();
    }
}
