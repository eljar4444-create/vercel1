
console.log("--- ENV DIAGNOSTIC START ---");
const url = process.env.DATABASE_URL;
if (!url) {
    console.log("❌ DATABASE_URL is UNDEFINED or EMPTY.");
} else {
    console.log("✅ DATABASE_URL is present.");
    console.log("Length:", url.length);
    console.log("Starts with 'postgresql://':", url.startsWith("postgresql://"));
    console.log("Starts with 'postgres://':", url.startsWith("postgres://"));
    console.log("First 15 chars:", url.substring(0, 15));
    console.log("Contains spaces:", url.includes(" "));
    console.log("Contains quotes:", url.includes('"') || url.includes("'"));
}

const directUrl = process.env.DIRECT_URL;
if (directUrl) {
    console.log("✅ DIRECT_URL is present.");
}

console.log("--- ENV DIAGNOSTIC END ---");
