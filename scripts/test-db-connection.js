const net = require('net');
const url = require('url');
const dns = require('dns');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
    console.error("❌ No connection string found.");
    process.exit(1);
}

const params = url.parse(connectionString);
const host = params.hostname;
const port = params.port || 5432;

console.log(`🔍 Resolving host: ${host}`);

dns.lookup(host, { all: true }, (err, addresses) => {
    if (err) {
        console.error("❌ DNS Lookup failed:", err);
        return;
    }
    console.log("🔍 Resolved addresses:", addresses);

    // Try to connect to the first IPv4 address if available
    const ipv4 = addresses.find(a => a.family === 4);

    if (ipv4) {
        console.log(`\n🔍 Attempting TCP connection to IPv4: ${ipv4.address} (forcing IPv4)`);
        testConnection(ipv4.address, port);
    } else {
        console.log(`\n⚠️ No IPv4 address found. Attempting first available: ${addresses[0].address}`);
        testConnection(addresses[0].address, port);
    }
});

function testConnection(address, port) {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on('connect', () => {
        console.log(`✅ SUCCESS! Connected to ${address}:${port}`);
        socket.destroy();
    });

    socket.on('timeout', () => {
        console.error(`❌ TIMEOUT connecting to ${address}:${port}`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.error(`❌ ERROR connecting to ${address}:${port}: ${err.message}`);
        socket.destroy();
    });

    socket.connect(port, address);
}
