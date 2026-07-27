import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AirGapKit — Offline File Suite',
    description: '100% Client-Side PDF, Image, Convert & Security Toolkit',
    version: '1.0.0',
    permissions: ['storage', 'downloads'],
    action: {
      default_title: 'AirGapKit Quick Access'
    }
  }
});
