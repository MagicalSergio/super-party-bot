import type { Dayjs } from 'dayjs';
import { calcDaysTo } from './utils/calcDaysTo.js';
import dayjs from './utils/dayjs.js';

export type SeasonType = 'winter' | 'spring' | 'summer' | 'autumn';

interface SeasonsInfo {
    curSeasonIndex: number | null;
    curSeason: SeasonType | null;
    nextSeasonIndex: number | null;
    nextSeason: SeasonType | null;
    daysUntilNextSeason: number | null;
}

interface SeasonForms {
    inf: string;
    until: string;
}

export abstract class SeasonHandler {
    public static readonly MONTHS_SEASONS: Record<SeasonType, number[]> = {
        winter: [11, 0, 1],
        spring: [2, 3, 4],
        summer: [5, 6, 7],
        autumn: [8, 9, 10],
    }

    public static readonly MONTHS_INDEXES: Record<number, SeasonType> = {
        0: 'winter',
        1: 'spring',
        2: 'summer',
        3: 'autumn',
    }

    public static readonly SEASONS_FORMS: Record<SeasonType, SeasonForms> = {
        winter: {
            inf: 'зима',
            until: 'зимы',
        },
        spring: {
            inf: 'весна',
            until: 'весны',
        },
        summer: {
            inf: 'лето',
            until: 'лета',
        },
        autumn: {
            inf: 'осень',
            until: 'осени',
        },
    }

    public static readonly SEASON_CONGRATS: Record<SeasonType, string> = {
        winter: 'Поздравляем зимоёбов! Наступила зима!',
        spring: 'Поздравляем весноёбов! Наступила весна!',
        summer: 'Поздравляем жароёбов! Наступило лето!',
        autumn: 'Поздравляем... слякотоёбов? Ну мб кому-то это и нравится.',
    }

    private static date: Dayjs;

    public static getSeasonInfo(date: Dayjs): SeasonsInfo {
        SeasonHandler.date = date;

        const curSeasonIndex = SeasonHandler.getCurrentSeasonIndex();
        const curSeason = curSeasonIndex != null
            ? SeasonHandler.MONTHS_INDEXES[curSeasonIndex] ?? null
            : null;

        const nextSeasonIndex = SeasonHandler.getNextSeasonIndex();
        const nextSeason = nextSeasonIndex != null
            ? SeasonHandler.MONTHS_INDEXES[nextSeasonIndex] ?? null
            : null;

        let daysUntilNextSeason = null;
        if (nextSeason) {
            const to = dayjs()
                .millisecond(0)
                .second(0)
                .minute(0)
                .hour(0)
                .date(1)
                .month(SeasonHandler.MONTHS_SEASONS[nextSeason][0]!)

            daysUntilNextSeason = calcDaysTo(to);
        }

        return {
            curSeasonIndex,
            curSeason,
            nextSeasonIndex,
            nextSeason,
            daysUntilNextSeason,
        };
    }

    private static getCurrentSeasonIndex(): number | null {
        const now = dayjs(this.date);
        let index: number | null = null
        Object.keys(SeasonHandler.MONTHS_SEASONS).forEach((seasonType) => {
            if (SeasonHandler.MONTHS_SEASONS[seasonType as SeasonType].includes(now.month())) {
                Object.entries(SeasonHandler.MONTHS_INDEXES).forEach(([key, val]) => {
                    if (val === seasonType) {
                        index = Number(key);
                    }
                });
            }
        });
        return index;
    }

    private static getNextSeasonIndex(): number | null {
        const curIndex = SeasonHandler.getCurrentSeasonIndex();
        if (curIndex === null) {
            return null;
        }

        let index = null;
        if (Object.keys(SeasonHandler.MONTHS_INDEXES).length - 1 === curIndex) {
            index = 0;
        } else {
            index = curIndex + 1;
        }

        return index;
    }
}
