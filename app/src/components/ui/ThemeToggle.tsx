import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      className="rounded-lg border border-rosebrand-100 bg-white p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      onClick={() => setDark((value) => !value)}
      title="Alternar tema"
      type="button"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
