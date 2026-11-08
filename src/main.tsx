import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/inter'
import '@fontsource-variable/gabarito'
import './index.css'
import App from './App'

// Caches the app for offline use and updates it in the background when a new version is deployed.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Follows the system's reduced-motion setting. The motion primitives also check it, so content
        renders in its final state instead of fading in. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
