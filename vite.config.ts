import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Inside Docker on macOS, bind-mounted files emit no inotify events, so the
      // watcher silently serves stale modules. CHOKIDAR_USEPOLLING (set by
      // docker-compose) switches to polling; Vite needs it here explicitly —
      // chokidar does not read that env var on its own.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : process.env.CHOKIDAR_USEPOLLING === 'true'
            ? {usePolling: true, interval: 300}
            : {},
    },
  };
});
