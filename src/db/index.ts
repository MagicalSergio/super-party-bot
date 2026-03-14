import NodePath from 'node:path';
import { DataSource } from 'typeorm';
import { PollEntity } from '../entity/Poll.entity.js';
import { SeasonPollEntity } from '../entity/SeasonPoll.entity.js';
import { SeasonScheduleNotifyEntity } from '../entity/SeasonScheduleNotify.entity.js';
import { MessageEntity } from '../entity/Message.entity.js';
import { AIPersonalityEntity } from '../modules/AIModel/entity/AIPersonality.entity.js';
import { XAIResponseHistoryEntity } from '../modules/AIModel/entity/XAIResponseHistory.entity.js';
import { XAIProcessedMessageEntity } from '../modules/AIModel/entity/XAIProcessedMessage.entity.js';
import { PROJECT_ROOT_DIR } from '../utils/findProjectRoot.js';

const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: NodePath.resolve(PROJECT_ROOT_DIR, 'data/app.db'),
    entities: [
        PollEntity,
        SeasonPollEntity,
        SeasonScheduleNotifyEntity,
        AIPersonalityEntity,
        XAIResponseHistoryEntity,
        MessageEntity,
        XAIProcessedMessageEntity,
    ],
    synchronize: false,
    migrations: process.env.MIGRATION_RUN ? [NodePath.join(PROJECT_ROOT_DIR, 'src/db/migrations/*{.js,.ts}')] : undefined,
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
});

export { AppDataSource };
