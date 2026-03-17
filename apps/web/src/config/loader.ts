import type { Schema } from "yup";

const load = async <TSchema extends Schema<object>>(schema: TSchema) => {
  const response = await fetch("/config.json");
  const config = await response.json();
  return schema.validate(config);
};

export default load;
