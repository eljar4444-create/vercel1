const dns = require('dns');
const { Client } = require('pg');
require('dotenv').config();

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

async function run() {
    const client = new Client({
        user: 'neondb_owner',
        host: 'ep-late-wind-ags571mb.c-2.eu-central-1.aws.neon.tech',
        database: 'neondb',
        password: 'npg_q6XQ1jWJgIsA',
        port: 5432,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log("Connecting to Neon (IPv4 forced)...");
        await client.connect();
        console.log("✅ Connected!");

        // 1. Create Category table
        console.log("Creating Category table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "icon" TEXT,
        "form_schema" JSONB NOT NULL
      );
    `);
        console.log("✅ Category created");

        // 2. Create Profile table
        console.log("Creating Profile table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Profile" (
        "id" SERIAL PRIMARY KEY,
        "user_email" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "address" TEXT,
        "category_id" INTEGER NOT NULL,
        "attributes" JSONB NOT NULL,
        "image_url" TEXT,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("✅ Profile created");

        // 3. Create Service table
        console.log("Creating Service table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Service" (
        "id" SERIAL PRIMARY KEY,
        "profile_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "duration_min" INTEGER NOT NULL
      );
    `);
        console.log("✅ Service created");

        // 4. Create indexes
        console.log("Creating indexes...");
        await client.query(`CREATE INDEX IF NOT EXISTS "Profile_category_id_idx" ON "Profile"("category_id");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "Service_profile_id_idx" ON "Service"("profile_id");`);
        console.log("✅ Indexes created");

        // 5. Add foreign keys (safe - skip if already exist)
        console.log("Adding foreign keys...");
        try {
            await client.query(`ALTER TABLE "Profile" ADD CONSTRAINT "Profile_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
        } catch (e) { if (e.code !== '42710') throw e; }

        try {
            await client.query(`ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;`);
        } catch (e) { if (e.code !== '42710') throw e; }

        try {
            await client.query(`ALTER TABLE "Service" ADD CONSTRAINT "Service_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
        } catch (e) { if (e.code !== '42710') throw e; }
        console.log("✅ Foreign keys added");

        // 6. Verify
        const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`);
        console.log("\n📋 Tables in database:");
        tables.rows.forEach(r => console.log("  -", r.table_name));

        console.log("\n🎉 Migration completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
