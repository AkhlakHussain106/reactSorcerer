export const getStorage = (key) => {
  return localStorage.getItem(key) || null;
};

export const setStorage = (key, value) => {
  return localStorage.setItem(key, value) || null;
};

export const jsonParse = (value) => {
  return JSON.parse(value) || null;
};

export const jsonStringify = (value) => {
  return JSON.stringify(value) || null;
};
