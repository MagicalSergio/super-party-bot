import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AIPersonalityEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    sysname: string;

    @Column()
    name: string;

    @Column()
    instructions: string;

    @Column()
    model: string;

    static async getBySysname(sysname: string) {
        return await this.findOne({ where: { sysname } })
    }
}
