
console.log("Start");
try {
    require('@prisma/client');
    console.log("Loaded");
} catch (e) {
    console.error("Failed:", e);
}
