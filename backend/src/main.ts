import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse Cookies
  app.use(cookieParser());

  // Configure body parser with higher limits for profile images
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Global Validation Pipe (Cycle 3: Injection Guard)
  // Whitelist strips properties that don't have decorators
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for frontend communication
  // origin: true allows any origin (useful for local dev with varying ports)
  app.enableCors({
    origin: (requestOrigin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.FRONTEND_URL || 'https://famlink.com', // Replace with actual prod URL
      ].filter(Boolean); // Remove empty strings if env var is missing

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${requestOrigin} not allowed`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  /* --- AUTO-START LOCAL WHISPER SERVICE ENABLED ---
  // User explicitly requested backend to start Whisper
  */
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
