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
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (health checks, server-to-server, mobile apps)
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.FRONTEND_URL, // Production URL from env
      ].filter(Boolean); // Remove empty strings if env var is missing

      // Strictly Enforce Origin for browser requests
      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${requestOrigin} not allowed`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  /* --- AUTO-START LOCAL WHISPER SERVICE (Local Dev Only) ---
  // Whisper uses Windows .exe binaries — skip entirely in production (Render)
  */
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    const net = require('net');

    // Helper: check if a port is already in use
    const isPortInUse = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const tester = net.createServer()
          .once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') resolve(true);
            else resolve(false);
          })
          .once('listening', () => {
            tester.once('close', () => resolve(false)).close();
          })
          .listen(port);
      });
    };

    const localWhisperPath = path.resolve(process.cwd(), '..', 'local-whisper');
    const serverJsPath = path.join(localWhisperPath, 'server.js');

    if (fs.existsSync(serverJsPath)) {
      const whisperPort = 3002;
      const portBusy = await isPortInUse(whisperPort);

      if (portBusy) {
        console.log(`🎙️  Local Whisper Service already running on port ${whisperPort} — skipping spawn.`);
      } else {
        console.log(`\n🎙️  Starting Local Whisper Service from: ${localWhisperPath}`);

        const whisperProcess = spawn('node', ['server.js'], {
          cwd: localWhisperPath,
          stdio: 'inherit',
          shell: true
        });

        whisperProcess.on('error', (err) => {
          console.error('❌ Failed to start Local Whisper Service:', err);
        });

        process.on('exit', () => whisperProcess.kill());
        process.on('SIGINT', () => {
          whisperProcess.kill();
          process.exit();
        });
      }
    } else {
      console.warn(`⚠️  Local Whisper Service not found at: ${serverJsPath}`);
    }
  } else {
    console.log('🎙️  Skipping Local Whisper Service (production environment).');
  }
  // ----------------------------------------


  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
