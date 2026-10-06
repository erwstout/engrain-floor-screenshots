import { useState } from "react";

const STORAGE_KEY = "unitmap-api-key";

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const write = (value: string | null) => {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked; key stays in memory only.
  }
};

// Key lives in memory by default; persisted only when the user opts in.
export const useApiKey = () => {
  const [apiKey, setApiKeyState] = useState(read);
  const [remember, setRememberState] = useState(() => read() !== "");

  const setApiKey = (value: string) => {
    setApiKeyState(value);
    if (remember) write(value);
  };

  const setRemember = (value: boolean) => {
    setRememberState(value);
    write(value ? apiKey : null);
  };

  return { apiKey: apiKey.trim(), rawApiKey: apiKey, setApiKey, remember, setRemember };
};
