import type { Message } from 'grammy/types';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MessageEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message_id: number;

    @Column()
    chat_id: number;

    @Column()
    from_username: string;

    @Column()
    date: string;

    @Column()
    json: string;

    static async getSince(date: string) {
        return await this.createQueryBuilder('msg')
            .where('msg.date > :date', { date })
            .getMany();
    }

    static async getLast(count: number) {
        return (await this.find({ take: count, order: { id: 'DESC' } })).reverse();
    }

    getData(): Message {
        return JSON.parse(this.json);
    }
}
