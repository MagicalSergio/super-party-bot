/**
 * Возвращает правильную форму слова в зависимости от числа.
 *
 * @param n — число
 * @param forms — [именительный ед., родительный ед., родительный мн.]
 *                например: ["день", "дня", "дней"]
 *                          ["остался", "осталось", "осталось"]
 *                          ["яблоко", "яблока", "яблок"]
 *                          ["минута", "минуты", "минут"]
 */
export function pluralize(n: number, forms: [string, string, string]): string {
    const abs = Math.abs(n) % 100;
    if (abs >= 11 && abs <= 19) return forms[2];
    const last = abs % 10;
    if (last === 1) return forms[0];
    if (last >= 2 && last <= 4) return forms[1];
    return forms[2];
}
