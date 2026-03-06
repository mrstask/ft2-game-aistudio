import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { CharacterEditorPage } from './features/dev-mode/CharacterEditorPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CharacterEditorPage />
  </StrictMode>,
);
