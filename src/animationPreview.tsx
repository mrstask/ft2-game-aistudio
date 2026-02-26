import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AnimationPreviewPage } from './features/animation-preview/AnimationPreviewPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnimationPreviewPage />
  </StrictMode>,
);

