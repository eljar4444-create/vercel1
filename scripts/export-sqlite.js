
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
        process.exit(1);
    }
});

const tables = [
    'User',
    'Account',
    'Session',
    // 'VerificationToken', // Often not needed for migration
    'ProviderProfile',
    'ServiceCategory',
    'City',
    'SubscriptionPlan',
    'ProviderSubscription',
    'Service',
    'ServiceImage',
    'Request',
    'ChatMessage',
    'Review',
    'Order'
];

const data = {};
let completed = 0;

console.log(`Exporting data from SQLite: ${dbPath}`);

// Helper to handle async table reading
function readTable(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM "${tableName}"`, [], (err, rows) => {
            if (err) {
                console.warn(`Warning reading table ${tableName}:`, err.message);
                // resolve with empty array to continue
                resolve([]);
            } else {
                console.log(`Read ${rows.length} rows from ${tableName}`);
                resolve(rows);
            }
        });
    });
}

async function exportData() {
    for (const table of tables) {
        data[table] = await readTable(table);
    }

    fs.writeFileSync(path.resolve(__dirname, 'data_dump.json'), JSON.stringify(data, null, 2));
    console.log('Data export completed to scripts/data_dump.json');
    db.close();
}

exportData();
