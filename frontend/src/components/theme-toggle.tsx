import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const { theme } = useTheme();

  return <>{theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}</>;
}