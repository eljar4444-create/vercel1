const net = require('net');
const tls = require('tls');
const url = require('url');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
    console.error("❌ No connection string found in env.");
    process.exit(1);
}

const params = url.parse(connectionString);
const REMOTE_HOST = params.hostname;
const REMOTE_PORT = params.port || 5432;
const LOCAL_PORT = 5433;

// SSL Request packet: Int32(8) + Int32(80877103)
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f]);

const server = net.createServer((clientSocket) => {
    console.log(`[Bridge] New connection from local client`);

    // Force IPv4 lookup for the remote host
    // Note: net.connect with family: 4 handles the lookup order
    const remoteSocket = net.connect({
        host: REMOTE_HOST,
        port: REMOTE_PORT,
        family: 4
    });

    remoteSocket.on('connect', () => {
        console.log(`[Bridge] Connected to remote ${REMOTE_HOST}:${REMOTE_PORT} (IPv4). Sending SSL Request...`);
        remoteSocket.write(SSL_REQUEST);
    });

    let isSecure = false;

    remoteSocket.on('data', (data) => {
        if (isSecure) return; // Handled by TLS socket

        // Check for 'S' response
        if (data.length > 0 && data[0] === 0x53) { // 'S'
            console.log(`[Bridge] Received 'S'. Upgrading to TLS...`);
            isSecure = true;

            // Remove this listener so data flows to TLS socket
            remoteSocket.removeAllListeners('data');

            const secureSocket = tls.connect({
                socket: remoteSocket,
                servername: REMOTE_HOST,
                rejectUnauthorized: false // Allow self-signed certs if needed (for ease)
            });

            secureSocket.on('secureConnect', () => {
                console.log(`[Bridge] TLS Handshake successful. Piping data...`);
                // Pipe cleartext from client -> TLS -> Remote
                clientSocket.pipe(secureSocket).pipe(clientSocket);
            });

            secureSocket.on('error', (err) => {
                console.error(`[Bridge] TLS Error:`, err.message);
                clientSocket.destroy();
            });
        } else {
            console.error(`[Bridge] Unexpected response from server during SSL handshake:`, data);
            clientSocket.destroy();
            remoteSocket.destroy();
        }
    });

    remoteSocket.on('error', (err) => {
        console.error(`[Bridge] Remote Connection Error:`, err.message);
        clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
        console.error(`[Bridge] Client Connection Error:`, err.message);
        remoteSocket.destroy();
    });
});

server.listen(LOCAL_PORT, () => {
    console.log(`🚀 DB Bridge listening on localhost:${LOCAL_PORT}`);
    console.log(`👉 Point your Prisma to: postgresql://...?host=localhost&port=${LOCAL_PORT}&sslmode=disable`);
});
