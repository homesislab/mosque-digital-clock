import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export function getPrayerTimes(config: MosqueConfig, date: Date = new Date()) {
    const { lat, lng } = config.prayerTimes.coordinates;
    const coordinates = new Coordinates(lat, lng);

    // Select method
    let method = CalculationMethod.Singapore(); // Default close to Indonesia
    if (config.prayerTimes.calculationMethod === 'Kemenag') {
        method = CalculationMethod.Singapore();
    }

    const prayerTimes = new AdhanPrayerTimes(coordinates, date, method);

    // Helper to add minutes
    const addMin = (d: Date, m: number = 0) => new Date(d.getTime() + (m || 0) * 60000);
    const adj = config.prayerTimes.adjustments || {};

    // Apply adjustments
    const subuhAdjusted = addMin(prayerTimes.fajr, adj.subuh);

    // Calculate Imsak (Subuh - X minutes - Subuh adjustment)
    const imsakOffset = config.ramadhan?.imsakOffset || 10;
    const imsakTime = addMin(subuhAdjusted, -imsakOffset);

    const isFriday = date.getDay() === 5;
    const dhuhrAdjusted = addMin(prayerTimes.dhuhr, isFriday ? (adj.jumat ?? adj.dzuhur) : adj.dzuhur);

    return {
        imsak: imsakTime,
        subuh: subuhAdjusted,
        syuruq: prayerTimes.sunrise,
        [isFriday ? 'jumat' : 'dzuhur']: dhuhrAdjusted,
        ashar: addMin(prayerTimes.asr, adj.ashar),
        maghrib: addMin(prayerTimes.maghrib, adj.maghrib),
        isya: addMin(prayerTimes.isha, adj.isya),
    };
}

export function formatTime(date: Date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace('.', ':');
}
