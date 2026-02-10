try {
    const pwa = require("@ducanh2912/next-pwa");
    console.log("Require success:", pwa);
    console.log("Default export:", pwa.default);

    const withPWA = pwa.default ? pwa.default({
        dest: "public"
    }) : pwa({
        dest: "public"
    });

    console.log("Init success");
} catch (e) {
    console.error("Error:", e);
}
