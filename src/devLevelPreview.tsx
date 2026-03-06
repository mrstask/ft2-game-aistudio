import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { LevelPreviewPage } from './features/dev-mode/LevelPreviewPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LevelPreviewPage />
  </StrictMode>,
);
