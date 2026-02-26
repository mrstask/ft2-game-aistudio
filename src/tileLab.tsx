import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { TileLabPage } from './features/tile-lab/TileLabPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TileLabPage />
  </StrictMode>,
);

