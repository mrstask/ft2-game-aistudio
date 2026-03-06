import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SystemsReferencePage } from './features/dev-mode/SystemsReferencePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemsReferencePage />
  </StrictMode>,
);
