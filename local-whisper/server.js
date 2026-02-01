const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 3002;

app.use(cors());

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original extension or default to .wav
        const ext = path.extname(file.originalname) || '.wav';
        cb(null, `raw-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });

const MAIN_EXE = path.join(__dirname, 'main.exe');
const MODEL_PATH = path.join(__dirname, 'models', 'ggml-base.en.bin');

// Helper: Convert audio to 16kHz Mono WAV (Strict format for whisper.cpp)
const convertToWav = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioFrequency(16000) // Whisper expects 16kHz
            .audioChannels(1)      // Mono
            .audioCodec('pcm_s16le') // 16-bit PCM
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
};

// Endpoint: Transcribe
app.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const rawFilePath = req.file.path;
    const processedFilePath = path.join('uploads', `processed-${Date.now()}.wav`);

    console.log(`Received: ${rawFilePath}`);
    console.log(`Converting to friendly WAV...`);

    try {
        // 1. Convert File
        await convertToWav(rawFilePath, processedFilePath);
        console.log(`Conversion Complete: ${processedFilePath}`);

        // 2. Run Whisper on Processed File
        const args = [
            '-m', MODEL_PATH,
            '-f', processedFilePath,
            '--output-json',
            '-nt' // No timestamps
        ];

        console.log(`Running Whisper...`);
        const process = spawn(MAIN_EXE, args);

        let outputText = '';
        let errorText = '';

        process.stdout.on('data', (data) => {
            const str = data.toString();
            outputText += str;
        });

        process.stderr.on('data', (data) => {
            errorText += data; // Whisper logs progress to stderr usually
        });

        process.on('close', (code) => {
            console.log(`Whisper finished (code ${code}).`);

            // 3. Cleanup Files
            try {
                if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
                if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr);
            }

            if (code !== 0) {
                console.error("Whisper Error Log:", errorText);
                return res.status(500).json({ error: 'Transcription process failed' });
            }

            // 4. Parse Output
            // Filter out system logs if they appear in stdout
            const cleanText = outputText
                .split('\n')
                .filter(line => !line.startsWith('system_info') && !line.startsWith('main:') && !line.startsWith('whisper_'))
                .join(' ')
                .replace(/\[.*?\]/g, '') // remove [timestamps]
                .trim();

            console.log(`Transcript: "${cleanText}"`);
            res.json({ text: cleanText });
        });

    } catch (err) {
        console.error("Processing Error:", err);
        // Cleanup on error
        try {
            if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
            if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
        } catch (e) { }

        res.status(500).json({ error: 'Audio processing failed' });
    }
});

app.listen(PORT, () => {
    console.log(`🎙️ Local Whisper Service (Binary Mode) running on port ${PORT}`);
    console.log(`Ensure 'main.exe' and 'models/ggml-base.en.bin' exist.`);
});
