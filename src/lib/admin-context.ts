import { createContext, useContext } from "react";
import type { AdminTheme } from "./admin-themes";
import { THEMES } from "./admin-themes";

export const AdminTokenCtx = createContext<string>("");
export const useAdminToken = () => useContext(AdminTokenCtx);

type ThemeCtxValue = { theme: AdminTheme; setThemeId: (id: string) => void };
export const AdminThemeCtx = createContext<ThemeCtxValue>({
  theme: THEMES[0],
  setThemeId: () => {},
});
export const useAdminTheme = () => useContext(AdminThemeCtx);
