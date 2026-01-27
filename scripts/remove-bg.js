const Jimp = require('jimp');

async function processImage(inputPath, outputPath, isHeader = false) {
    try {
        console.log(`Processing ${inputPath}...`);
        const image = await Jimp.read(inputPath);

        // Threshold for what counts as "white"
        const threshold = 240; // 0-255

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];

            // If pixel is close to white
            if (red > threshold && green > threshold && blue > threshold) {
                // Set alpha to 0 (transparent)
                this.bitmap.data[idx + 3] = 0;
            }
        });

        await image.writeAsync(outputPath);
        console.log(`Saved to ${outputPath}`);
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

async function main() {
    // Solid source files
    const iconSource = '/home/emamedov/.gemini/antigravity/brain/618165cc-cfe2-4833-a842-491f9747526b/logo_icon_solid_v2_1769261181328.png';
    const headerSource = '/home/emamedov/.gemini/antigravity/brain/618165cc-cfe2-4833-a842-491f9747526b/logo_header_solid_1769261163364.png';

    await processImage(iconSource, 'public/logo-icon.png');
    await processImage(headerSource, 'public/logo.png', true);
}

main();
