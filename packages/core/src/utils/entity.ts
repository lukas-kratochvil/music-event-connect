import { plainToInstance } from "class-transformer";
import { validate, type ValidatorOptions } from "class-validator";
import { diff } from "deep-object-diff";
import type { AbstractEntity } from "../entities";
import { cloneObject, deepSortArraysInPlace, deleteExtraObjectProperties, isDiffEmpty } from "./internal";

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

/**
 * Checks if entities are same.
 */
export const areEntitiesSame = <T extends AbstractEntity>(entity1: T, entity2: T): boolean => {
  const prepareEntity = (entity: T) => {
    const clonedEntity = cloneObject(entity);
    deleteExtraObjectProperties(clonedEntity);
    deepSortArraysInPlace(clonedEntity);
    return clonedEntity;
  };
  const diffResult = diff(prepareEntity(entity1), prepareEntity(entity2));
  return diffResult === null ? true : isDiffEmpty(diffResult);
};
