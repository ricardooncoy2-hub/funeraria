import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const API_PREFIX = 'api/v1';
const DOCS_PATH = `${API_PREFIX}/docs`;

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return ['http://localhost:3000', 'http://localhost:3002'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Funeraria Minaya API')
    .setDescription('API REST del sistema multi-sede Funeraria Minaya')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(DOCS_PATH, app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
