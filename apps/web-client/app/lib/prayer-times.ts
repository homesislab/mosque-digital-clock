import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

/**
 * Validates geographic coordinates.
 * Latitude: -90 to +90, Longitude: -180 to +180
 * Returns false if coordinates are invalid or NaN.
 */
function isValidCoordinates(lat: number, lng: number): boolean {
    return (
        typeof lat === 'number' && isFinite(lat) &&
        typeof lng === 'number' && isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

export function getPrayerTimes(config: MosqueConfig, date: Date = new Date()) {
    if (!config.prayerTimes?.coordinates) {
        return null;
    }
    const { lat, lng } = config.prayerTimes.coordinates;

    // Validate coordinates before passing to adhan library
    if (!isValidCoordinates(lat, lng)) {
        console.error(`[prayer-times] Invalid coordinates: lat=${lat}, lng=${lng}. Must be within valid ranges.`);
        return null;
    }

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

export function formatTime(date: Date | null | undefined) {
    if (!date || isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace('.', ':');
}
