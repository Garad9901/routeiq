import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { LoggingInterceptor } from './telemetry/logging.interceptor';
import { HttpExceptionFilter } from './telemetry/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('RouteIQ-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Apply Helmet Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable Global Versioning Prefix
  app.setGlobalPrefix('v1');

  // Enable Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Apply Global Filters and Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('RouteIQ API Gateway')
    .setDescription('Enterprise business logic gateway orchestrating RouteIQ municipalities services.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`RouteIQ Gateway API bootstrap completed. Port: ${port}`);
  logger.log(`Swagger OpenAPI documentation live at: http://localhost:${port}/api-docs`);
}
bootstrap();
