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
  const nodeEnv = config.get("nodeEnv", { infer: true });

  // Setup logger
  const logger = createWinstonLogger("API");
  app.useLogger(logger);

  // Validation of HTTP requests
  app.useGlobalPipes(
    // See: https://docs.nestjs.com/techniques/validation#using-the-built-in-validationpipe
    new ValidationPipe({
      forbidUnknownValues: true,
      transform: true, // enables class-transformer transformations (like `@Type()`)
      enableDebugMessages: nodeEnv === "development",
    })
  );

  // Starting the app
  const port = config.get("port", { infer: true });
  logger.log(`API is running on: http://localhost:${port}`);
  await app.listen(port);
}

void bootstrap();
