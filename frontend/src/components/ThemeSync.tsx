import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';

export function ThemeSync() {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    if (themeId === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeId]);

  return null;
}
