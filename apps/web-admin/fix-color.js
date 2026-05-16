const pool = require('./lib/db');

async function fixColor() {
  try {
    const [rows] = await pool.default.query("SELECT mosque_key, JSON_EXTRACT(config_json, '$.advancedDisplay.prayerTimesActiveColor') as activeColor FROM mosque_configs;");
    for (const row of rows) {
      if (row.activeColor && row.activeColor.includes('orange')) {
        await pool.default.query("UPDATE mosque_configs SET config_json = JSON_SET(config_json, '$.advancedDisplay.prayerTimesActiveColor', '#059669') WHERE mosque_key = ?;", [row.mosque_key]);
        console.log(`Fixed ${row.mosque_key}`);
      } else {
        await pool.default.query("UPDATE mosque_configs SET config_json = JSON_REMOVE(config_json, '$.advancedDisplay.prayerTimesActiveColor') WHERE mosque_key = ?;", [row.mosque_key]);
        console.log(`Removed active color for ${row.mosque_key} (fallback to styling)`);
      }
    }
    console.log("Done");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
fixColor();
