import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { WallLabPage } from './features/wall-lab/WallLabPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WallLabPage />
  </StrictMode>,
);

