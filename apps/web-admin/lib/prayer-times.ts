import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export function getPrayerTimes(config: MosqueConfig) {
    if (!config.prayerTimes?.coordinates) {
        // Fallback default (Jakarta)
        return null;
    }

    const { lat, lng } = config.prayerTimes.coordinates;
    const coordinates = new Coordinates(lat, lng);

    // Select method
    let method = CalculationMethod.Singapore(); // Default close to Indonesia
    if (config.prayerTimes.calculationMethod === 'Kemenag') {
        method = CalculationMethod.Singapore();
    }

    const date = new Date();
    const prayerTimes = new AdhanPrayerTimes(coordinates, date, method);

    // Calculate Imsak (Subuh - X minutes)
    const imsakOffset = config.ramadhan?.imsakOffset || 10;
    const imsakTime = new Date(prayerTimes.fajr.getTime() - imsakOffset * 60000);

    return {
        imsak: imsakTime,
        subuh: prayerTimes.fajr,
        syuruq: prayerTimes.sunrise,
        dzuhur: prayerTimes.dhuhr,
        ashar: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isya: prayerTimes.isha,
    };
}

export function formatTime(date: Date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace('.', ':');
}
