import { createWinstonLogger } from "@music-event-connect/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import type { ConfigSchema } from "./config/schema";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<ConfigSchema, true>);

  // Validation of HTTP requests
  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: true }));

  // Setup logger
  const logger = createWinstonLogger("API");
  app.useLogger(logger);

  // Starting the app
  const port = config.get("port", { infer: true });
  logger.log(`API is running on: http://localhost:${port}`);
  await app.listen(port);
}

void bootstrap();
