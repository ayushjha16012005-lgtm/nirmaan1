import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nirmaan.app',
  appName: 'Nirmaan',
  webDir: 'dist',
  server: {
    url: 'https://nirmaan-m.vercel.app/',
    allowNavigation: ['nirmaan-m.vercel.app'],
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
