import { registerDecorator, type ValidationArguments, type ValidationOptions } from "class-validator";
import { ENTITY_ID_DELIM, VALID_ENTITY_ID_PREFIXES } from "../utils/entity-id";

export const IsEntityId = (validationOptions?: ValidationOptions) => (object: object, propertyName: string) => {
  registerDecorator({
    name: "IsEntityId",
    target: object.constructor,
    propertyName: propertyName,
    options: validationOptions,
    validator: {
      validate: (value: unknown) => {
        if (typeof value !== "string") {
          return false;
        }

        const parts = value.split(ENTITY_ID_DELIM);

        // don't check the exact equality of 2 parts, because the origin id can possibly contain the same delimiter that is used for separation of the origin's prefix and id
        if (parts.length < 2) {
          return false;
        }

        const originPrefix = parts.at(0);
        const originId = parts.slice(1).join(ENTITY_ID_DELIM);
        return (
          originPrefix !== undefined
          && VALID_ENTITY_ID_PREFIXES.some((validIdPrefix) => validIdPrefix === originPrefix)
          && originId.length > 0
        );
      },
      defaultMessage: (args: ValidationArguments) =>
        `'${args.property}': value '${args.value}' is not in the valid format.`,
    },
  });
};
