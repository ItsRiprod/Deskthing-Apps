import { createContext } from "react";
import { AppSettings } from "@deskthing/types";

// Define the context type
export type SettingsContextType = {
  settings: AppSettings | undefined;
};

// Create the context with a default value
export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);
