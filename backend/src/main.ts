import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure body parser with higher limits for profile images
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for frontend communication
  // origin: true allows any origin (useful for local dev with varying ports)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // --- AUTO-START LOCAL WHISPER SERVICE ---
  const { spawn } = require('child_process');
  const path = require('path');
  const fs = require('fs');

  // Resolve path to local-whisper/server.js relative to process.cwd()
  // User runs "npm run start:dev" from "famlink/backend"
  // So local-whisper is "../local-whisper"

  console.log(`[DEBUG] Current process.cwd(): ${process.cwd()}`);

  // Try sibling directory first (standard dev structure)
  const localWhisperPath = path.resolve(process.cwd(), '..', 'local-whisper');
  const serverJsPath = path.join(localWhisperPath, 'server.js');

  console.log(`[DEBUG] Resolved Whisper Path: ${serverJsPath}`);

  if (fs.existsSync(serverJsPath)) {
    console.log(`\n🎙️  Starting Local Whisper Service from: ${localWhisperPath}`);

    // Spawn the node process
    const whisperProcess = spawn('node', ['server.js'], {
      cwd: localWhisperPath, // Important: Run inside the local-whisper folder
      stdio: 'inherit',      // Pipe output directly to this console
      shell: true
    });

    whisperProcess.on('error', (err) => {
      console.error('❌ Failed to start Local Whisper Service:', err);
    });

    // Ensure it dies when the backend dies
    process.on('exit', () => whisperProcess.kill());
    process.on('SIGINT', () => {
      whisperProcess.kill();
      process.exit();
    });
  } else {
    console.warn(`⚠️  Local Whisper Service not found at: ${serverJsPath}`);
  }
  // ----------------------------------------

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
