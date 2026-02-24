import { plainToInstance } from "class-transformer";
import { validate, type ValidatorOptions } from "class-validator";
import { diff } from "deep-object-diff";
import type { AbstractEntity } from "../entities";
import { cloneObject, deepSortArraysInPlace, deleteExtraObjectProperties, isDiffEmpty } from "./internal";

type IdObject = { id: string };

type ObjectWithIds<T extends object & IdObject> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? ObjectWithIds<T[K] & IdObject>
    : T[K] extends (infer U)[]
      ? U extends Record<string, unknown>
        ? ObjectWithIds<U & IdObject>[]
        : T[K]
      : T[K];
};

/**
 * Converts plain (literal) object to entity.
 */
export const plainToEntity = <T extends AbstractEntity>(
  ...parameters: Parameters<typeof plainToInstance<T, ObjectWithIds<T>>>
) => plainToInstance<T, ObjectWithIds<T>>(...parameters);

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
