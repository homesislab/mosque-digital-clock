import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export function getPrayerTimes(config: MosqueConfig) {
    const { lat, lng } = config.prayerTimes.coordinates;
    const coordinates = new Coordinates(lat, lng);

    // Select method
    let method = CalculationMethod.Singapore(); // Default close to Indonesia
    if (config.prayerTimes.calculationMethod === 'Kemenag') {
        // Siapkan parameter Kemenag (mirip Singapore tapi dengan adjustment manual biasanya)
        // Untuk simplifikasi, kita pakai MuslimWorldLeague atau Singapore
        method = CalculationMethod.Singapore();
    }

    const date = new Date();
    const prayerTimes = new AdhanPrayerTimes(coordinates, date, method);

    // Apply adjustments
    // Note: Adhan lib doesn't support adding minutes directly easily in constructor, 
    // but we can manipulate result.
    // We will return formatted strings.

    // Calculate Imsak (Subuh - 10 minutes)
    const imsakTime = new Date(prayerTimes.fajr.getTime() - 10 * 60 * 1000);

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
