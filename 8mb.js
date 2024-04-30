const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

function getFileSizeInMB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
}

async function compressVideo(inputPath, outputPath, targetSizeMB) {
    const targetBitrate = await calculateBitrate(inputPath, targetSizeMB, 0.85);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                `-b:v ${targetBitrate}k`,
                `-bufsize ${targetBitrate}k`,
                `-maxrate ${targetBitrate}k`,
                `-preset slow`,
                `-movflags +faststart`
            ])
            .videoCodec('libx264')
            .format('mp4')
            .on('end', function () {
                console.log('Compression finished.');
                resolve();
            })
            .on('error', function (err) {
                console.error('Error:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

async function calculateBitrate(inputPath, targetSizeMB, safetyFactor = 1) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, function (err, metadata) {
            if (err) {
                reject(err);
                return;
            }
            const duration = metadata.format.duration;
            const targetSizeKilobits = targetSizeMB * 8 * 1024 * safetyFactor;
            const targetBitrate = Math.floor(targetSizeKilobits / duration);
            resolve(targetBitrate);
        });
    });
}

async function run() {
    const inputVideoPath = path.join(__dirname, "/Local/Path/To/Video.mp4");
    const baseName = path.basename(inputVideoPath, path.extname(inputVideoPath));
    const outputVideoPath = path.join(__dirname, `Videos/${baseName} [8MB].mp4`);

    try {
        await compressVideo(inputVideoPath, outputVideoPath, 8);
        console.log('Video compressed successfully.');
    } catch (error) {
        console.error('Failed to compress video:', error);
    }
}

run();
