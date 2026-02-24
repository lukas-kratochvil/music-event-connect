/**
 * Creates object deep-copy.
 */
export const cloneObject = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (Array.isArray(obj)) {
    const clonedArray = [...obj];
    return clonedArray.map((elem) => cloneObject(elem)) as T;
  }

  const clonedObj = { ...obj };

  for (const key in clonedObj) {
    if (Object.prototype.hasOwnProperty.call(clonedObj, key)) {
      clonedObj[key] = cloneObject(clonedObj[key]);
    }
  }
  return clonedObj;
};

/**
 * Checks whether the object is empty.
 */
const isObjectEmpty = (obj: object) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isArrayWithObjName = (array: any[]): array is { name: string }[] =>
  "name" in array.at(0) && typeof array.at(0).name === "string";

/**
 * Recursively traverses an object or array and sorts in-place all internal arrays of primitive types.
 */
export const deepSortArraysInPlace = <T extends object>(data: T): T => {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        deepSortArraysInPlace(item);
      }
    }

    const isPrimitiveArray = data.every((item) => typeof item !== "object" || item === null);

    if (isPrimitiveArray) {
      data.sort((a, b) => {
        if (a === null || a === undefined) {
          return 1;
        }
        if (b === null || b === undefined) {
          return -1;
        }
        if (typeof a === "string" && typeof b === "string") {
          return a.localeCompare(b);
        }
        return a > b ? 1 : a < b ? -1 : 0;
      });
    } else if (isArrayWithObjName(data)) {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }

    return data;
  }

  if (typeof data === "object" && data !== null) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        if (typeof value === "object" && value !== null) {
          data[key] = deepSortArraysInPlace(value);
        }
      }
    }
    return data;
  }

  return data;
};

/**
 * Recursively deletes in-place all properties named 'id', empty arrays and empty objects from an object and its nested properties.
 */
export const deleteExtraObjectProperties = <T extends object>(data: T): T => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const value = data[i];

      if (typeof value === "object" && value !== null) {
        data[i] = deleteExtraObjectProperties(value);

        if (isObjectEmpty(data[i])) {
          data.splice(i, 1);
          i--;
        }
      }
    }
  } else {
    if ("id" in data) {
      delete data.id;
    }

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        if (typeof value === "object" && value !== null) {
          data[key] = deleteExtraObjectProperties(value);

          if (isObjectEmpty(data[key] as object)) {
            delete data[key];
          }
        }
      }
    }
  }

  return data;
};

/**
 * Checks if diff object returned by `diff` from `deep-object-diff` is empty.
 *
 * Empty object is also for example: `{ artists: { '1': {} } }`.
 */
export const isDiffEmpty = <T extends object>(diffObj: T): boolean => {
  for (const key in diffObj) {
    if (Object.prototype.hasOwnProperty.call(diffObj, key)) {
      const value = diffObj[key];

      if (value === undefined) {
        continue;
      }

      // primitive value
      if (typeof value !== "object") {
        return false;
      }

      if (typeof value === "object" && value !== null) {
        if (!isDiffEmpty(value)) {
          return false;
        }
      }
    }
  }

  return true;
};
