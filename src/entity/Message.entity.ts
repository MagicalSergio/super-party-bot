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
}
