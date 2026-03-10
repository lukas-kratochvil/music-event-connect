import type { ClassTransformOptions } from "class-transformer";
import type { MusicEventsQueueNameType } from "../queue";

export interface EntityClassTransformOptions extends ClassTransformOptions {
  context: {
    origin: MusicEventsQueueNameType;
  };
}
