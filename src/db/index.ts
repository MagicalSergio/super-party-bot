import { DataSource } from 'typeorm';
import { PollEntity } from '../entity/Poll.entity.js';
import { SeasonPollEntity } from '../entity/SeasonPoll.entity.js';
import { SeasonScheduleNotifyEntity } from '../entity/SeasonScheduleNotify.entity.js';
import { AIPersonalityEntity } from '../modules/AIModel/entity/AIPersonality.entity.js';
import { XAIResponseHistoryEntity } from '../modules/AIModel/entity/XAIResponseHistory.entity.js';
import { MessageEntity } from '../entity/Message.entity.js';
import { XAIProcessedMessageEntity } from '../modules/AIModel/entity/XAIProcessedMessage.entity.js';

const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: '/app/data/app.db',
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
    migrations: [import.meta.dirname + '/migration/**/*{.js,.ts}'],
    migrationsRun: true,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all'
});

try {
    await AppDataSource.initialize();
} catch (e) {
    console.error('DB error: ', e);
}

export { AppDataSource };
