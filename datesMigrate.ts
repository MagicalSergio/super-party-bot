import { DataSource, EntityMetadata } from 'typeorm';
import { AppDataSource } from './src/db/index.js';

/**
 * Определяет, похожа ли строка на дату в ISO-формате
 * Поддерживает форматы:
 *   "2026-06-01T00:00:00.000+03:00"
 *   "2026-06-01T00:00:00.000Z"
 *   "2026-06-01T00:00:00+03:00"
 *   "2026-06-01"
 */
function looksLikeIsoDate(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    // ISO 8601: дата + опционально время + опционально тайм-зона
    return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value.trim());
}

/**
 * Конвертирует ISO-строку в Unix timestamp (миллисекунды).
 * Возвращает null, если дата невалидна.
 */
function toTimestamp(value: string): number | null {
    const ms = new Date(value).getTime();
    return isNaN(ms) ? null : ms;
}

/**
 * Сканирует все строковые колонки во всех таблицах и
 * конвертирует значения, похожие на ISO-дату, в timestamp (число, хранящееся как TEXT).
 *
 * @param dataSource  Инициализированный DataSource
 * @param dryRun      true — только вывод без записи в БД
 */
export async function migrateDatesToTimestamp(
    dataSource: DataSource,
    dryRun = false,
): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    let totalConverted = 0;
    let totalSkipped = 0;

    try {
        const entities: EntityMetadata[] = dataSource.entityMetadatas;

        for (const entity of entities) {
            const tableName = entity.tableName;

            // Берём только строковые колонки (varchar / text / simple-array и т.д.)
            const stringColumns = entity.columns.filter((col) => {
                const type = typeof col.type === 'function' ? typeof (new col.type()).valueOf() : col.type;
                return type === 'string';
            });

            if (stringColumns.length === 0) continue;

            const columnNames = stringColumns.map((c) => c.databaseName);
            console.log(`\n📋 Таблица: ${tableName} | Колонки: ${columnNames.join(', ')}`);

            // Читаем все строки
            const rows: Record<string, unknown>[] = await queryRunner.query(
                `SELECT rowid, ${columnNames.map((c) => `"${c}"`).join(', ')} FROM "${tableName}"`,
            );

            // Собираем UPDATE-и батчами по 500 строк
            const BATCH = 500;
            const updates: { rowid: number; col: string; newValue: string }[] = [];

            for (const row of rows) {
                const rowid = row['id'] as number;

                for (const col of columnNames) {
                    const raw = row[col];
                    if (!looksLikeIsoDate(raw)) continue;

                    const ts = toTimestamp(raw);
                    if (ts === null) {
                        console.warn(`  ⚠️  rowid=${rowid} col=${col}: невалидная дата "${raw}", пропускаем`);
                        totalSkipped++;
                        continue;
                    }

                    updates.push({ rowid, col, newValue: String(ts) });
                    totalConverted++;
                }
            }

            if (updates.length === 0) {
                console.log('  ✅ Нечего конвертировать');
                continue;
            }

            console.log(`  🔄 Найдено для конвертации: ${updates.length} значений`);

            if (!dryRun) {
                await queryRunner.startTransaction();
                try {
                    for (let i = 0; i < updates.length; i += BATCH) {
                        const batch = updates.slice(i, i + BATCH);
                        for (const { rowid, col, newValue } of batch) {
                            await queryRunner.query(
                                `UPDATE "${tableName}" SET "${col}" = ? WHERE rowid = ?`,
                                [newValue, rowid],
                            );
                        }
                    }
                    await queryRunner.commitTransaction();
                    console.log(`  ✅ Записано ${updates.length} значений`);
                } catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.error(`  ❌ Ошибка при обновлении таблицы ${tableName}, откат:`, err);
                    throw err;
                }
            } else {
                // Dry-run: показываем первые 10 примеров
                console.log('  🔍 DRY RUN — примеры конвертаций (первые 10):');
                updates.slice(0, 10).forEach(({ rowid, col, newValue }) => {
                    const original = rows.find((r) => r['rowid'] === rowid)?.[col];
                    console.log(`     rowid=${rowid} col=${col}: "${original}" → ${newValue}`);
                });
            }
        }
    } finally {
        await queryRunner.release();
    }

    console.log('\n========================================');
    console.log(`Итого конвертировано : ${totalConverted}`);
    console.log(`Итого пропущено      : ${totalSkipped}`);
    if (dryRun) console.log('⚠️  DRY RUN — изменения НЕ записаны в БД');
    console.log('========================================\n');
}

// ---------------------------------------------------------------------------
// Точка входа — запуск напрямую: ts-node migrate-dates-to-timestamp.ts
// ---------------------------------------------------------------------------
async function main() {
    await AppDataSource.destroy();

    await AppDataSource.initialize();
    console.log('✅ DataSource инициализирован');

    const DRY_RUN = process.argv.includes('--dry-run');
    if (DRY_RUN) console.log('🔍 Режим DRY RUN — изменения не будут применены\n');

    try {
        await migrateDatesToTimestamp(AppDataSource, DRY_RUN);
    } finally {
        await AppDataSource.destroy();
        console.log('🔌 DataSource закрыт');
    }
}

main().catch((err) => {
    console.error('Ошибка миграции:', err);
    process.exit(1);
});
