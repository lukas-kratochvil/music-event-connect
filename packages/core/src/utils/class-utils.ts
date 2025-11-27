import { plainToInstance } from "class-transformer";
import { validate, type ValidatorOptions } from "class-validator";
import type { AbstractEntity } from "../entities";

/**
 * Converts plain (literal) object to entity.
 */
export const plainToEntity = <T extends AbstractEntity>(...parameters: Parameters<typeof plainToInstance<T, object>>) =>
  plainToInstance<T, object>(...parameters);

/**
 * Validates given entity.
 */
export const validateEntity = <T extends AbstractEntity>(entity: T, validatorOptions?: ValidatorOptions) =>
  validate(entity, validatorOptions);
