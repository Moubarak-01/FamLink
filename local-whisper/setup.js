const fs = require('fs');
const path = require('path');
const https = require('https');

// URLs
const WHISPER_RELEASE_URL = "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip";
const MODEL_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin";

const TARGET_DIR = __dirname;
const MODEL_DIR = path.join(TARGET_DIR, 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'ggml-base.en.bin');
const ZIP_PATH = path.join(TARGET_DIR, 'whisper-bin.zip');

if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR);
}

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

async function setup() {
    console.log("🚀 Setting up Local Whisper for Windows...");

    // 1. Download Model
    if (!fs.existsSync(MODEL_PATH)) {
        console.log("📥 Downloading Whisper Model (base.en)...");
        await downloadFile(MODEL_URL, MODEL_PATH);
        console.log("✅ Model downloaded.");
    } else {
        console.log("✅ Model already exists.");
    }

    // 2. Download Binaries
    if (!fs.existsSync(path.join(TARGET_DIR, 'main.exe'))) {
        console.log("📥 Downloading Whisper Binaries...");
        await downloadFile(WHISPER_RELEASE_URL, ZIP_PATH);
        console.log("✅ Binaries downloaded.");

        console.log("📦 Extracting binaries...");
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(ZIP_PATH);
            zip.extractAllTo(TARGET_DIR, true);
            console.log("✅ Extracted.");

            // Cleanup
            if (fs.existsSync(ZIP_PATH)) {
                fs.unlinkSync(ZIP_PATH);
            }
        } catch (e) {
            console.error("❌ Failed to extract. Please manually unzip whisper-bin.zip inside local-whisper folder.");
            console.error(e);
        }
    } else {
        console.log("✅ Binaries already exist.");
    }

    console.log("\n🎉 Setup Complete! Run 'node server.js' to start.");
}

setup();
