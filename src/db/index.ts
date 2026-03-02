import { DataSource } from 'typeorm';
import { Poll } from '../entity/Poll.js';
import { SeasonPoll } from '../entity/SeasonPoll.js';
import { SeasonScheduleNotify } from '../entity/SeasonScheduleNotify.js';

const AppDataSource = new DataSource({
    type: 'better-sqlite3',
    database: '/app/data/app.db',
    entities: [Poll, SeasonPoll, SeasonScheduleNotify],
    synchronize: true,
});

try {
    await AppDataSource.initialize();
} catch (e) {
    console.error('DB error: ', e);
}

export { AppDataSource };
