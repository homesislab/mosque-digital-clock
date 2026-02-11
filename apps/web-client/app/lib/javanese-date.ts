
export function getPasaran(date: Date): string {
    // Reference date: 1 Jan 2024 was Monday, Pahing (Wait, let's pick a known one)
    // 14 Oct 2023 was Saturday, Kliwon?
    // Let's use a standard algorithm.
    // 1 Jan 1900 was Monday, Pahing. 
    // Or simpler reference:
    // 26 Jan 2024 is Friday, Pahing.

    // Pasaran cycle: Legi, Pahing, Pon, Wage, Kliwon (5 days)
    const pasaranNames = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];

    // Known reference: 
    // January 1, 2024 = Senin Pahing
    const refDate = new Date(2024, 0, 1); // Month is 0-indexed
    const refPasaranIndex = 1; // Pahing

    // Calculate difference in days
    const diffTime = date.getTime() - refDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Modulo 5
    let index = (refPasaranIndex + diffDays) % 5;
    if (index < 0) index += 5;

    // return pasaranNames[index];
    return ''; // User requested to remove Pasaran (Wage, Kliwon, etc.)
}
