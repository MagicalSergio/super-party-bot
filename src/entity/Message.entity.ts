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
    from_id: number;

    @Column()
    date: number;

    @Column()
    json: string;
}
