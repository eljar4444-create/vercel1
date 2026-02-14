console.log("--- DEBUG ENVIRONMENT VARIABLES ---");
const url = process.env.DATABASE_URL;
if (!url) {
    console.log("DATABASE_URL is undefined or empty");
} else {
    console.log(`DATABASE_URL length: ${url.length}`);
    console.log(`DATABASE_URL starts with: '${url.substring(0, 15)}...'`);
    console.log(`DATABASE_URL first char code: ${url.charCodeAt(0)}`);
    if (url.startsWith('"') || url.startsWith("'")) {
        console.log("WARNING: DATABASE_URL seems to be wrapped in quotes!");
    }
    if (url.startsWith(" ")) {
        console.log("WARNING: DATABASE_URL has a leading space!");
    }
}
console.log("-----------------------------------");
