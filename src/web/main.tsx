import { LangProvider } from './lib/i18n';
import { SettingsProvider } from './lib/settings';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { App } from './App';
import { applyTheme, storedTheme } from './lib/theme';
import './index.css';

applyTheme(storedTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <LangProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </LangProvider>
    </TooltipProvider>
  </StrictMode>,
);
