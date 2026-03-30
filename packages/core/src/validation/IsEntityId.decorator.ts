import { registerDecorator, type ValidationArguments, type ValidationOptions } from "class-validator";
import { isEntityId } from "../utils/entity-id";

export const IsEntityId = (validationOptions?: ValidationOptions) => (object: object, propertyName: string) => {
  registerDecorator({
    name: "IsEntityId",
    target: object.constructor,
    propertyName: propertyName,
    options: validationOptions,
    validator: {
      validate: (value: unknown) => typeof value === "string" && isEntityId(value),
      defaultMessage: (args: ValidationArguments) =>
        `'${args.property}': value '${args.value}' is not in the valid format.`,
    },
  });
};
