import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { CharacterPreviewPage } from './features/dev-mode/CharacterPreviewPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CharacterPreviewPage />
  </StrictMode>,
);
