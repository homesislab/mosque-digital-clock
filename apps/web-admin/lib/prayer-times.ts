import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export function getPrayerTimes(config: MosqueConfig, date: Date = new Date()) {
    if (!config.prayerTimes?.coordinates) {
        return null;
    }

    const { lat, lng } = config.prayerTimes.coordinates;
    const coordinates = new Coordinates(lat, lng);

    let method = CalculationMethod.Singapore();
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
        hour12: false,
        timeZone: 'Asia/Jakarta'
    }).replace('.', ':');
}

export function getNextPrayer(prayers: any, now: Date) {
    const isFriday = now.getDay() === 5;
    const dhuhrKey = isFriday ? 'jumat' : 'dzuhur';

    const prayerList = [
        { name: 'Imsak', time: prayers.imsak },
        { name: 'Subuh', time: prayers.subuh },
        { name: isFriday ? 'Jumat' : 'Dzuhur', time: prayers[dhuhrKey] },
        { name: 'Ashar', time: prayers.ashar },
        { name: 'Maghrib', time: prayers.maghrib },
        { name: 'Isya', time: prayers.isya },
    ];

    // Sort by time
    prayerList.sort((a, b) => {
        if (!a.time || isNaN(a.time.getTime())) return 1;
        if (!b.time || isNaN(b.time.getTime())) return -1;
        return a.time.getTime() - b.time.getTime();
    });

    // Find next
    let nextPrayerName = '';
    let nextPrayerTime: Date | null = null;
    let minDiff = Infinity;

    for (const p of prayerList) {
        if (!p.time || isNaN(p.time.getTime())) continue;
        const diff = p.time.getTime() - now.getTime();
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayerName = p.name;
            nextPrayerTime = p.time;
        }
    }

    // If no next prayer today, pick first of tomorrow
    if (!nextPrayerTime) {
        if (prayerList[0] && prayerList[0].time && !isNaN(prayerList[0].time.getTime())) {
            nextPrayerName = 'Besok ' + prayerList[0].name;
            const tomorrow = new Date(prayerList[0].time);
            tomorrow.setDate(tomorrow.getDate() + 1);
            nextPrayerTime = tomorrow;
            minDiff = nextPrayerTime.getTime() - now.getTime();
        } else {
            return {
                name: 'Data Tidak Tersedia',
                time: '--:--',
                delta: '--:--',
                diff: 0
            };
        }
    }

    const hours = Math.floor(minDiff / (1000 * 60 * 60));
    const minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
        name: nextPrayerName,
        time: formatTime(nextPrayerTime),
        delta: `${hours}j ${minutes}m`,
        diff: minDiff
    };
}
