export class RateLimitError extends Error {
  constructor(
    readonly resetTime: number,
    message: string,
    cause?: unknown
  ) {
    super(message, { cause });
  }
}
