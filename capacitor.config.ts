import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uber.platform',
  appName: 'Uber Move',
  webDir: 'www',
  server: {
    cleartext: true
  }
};

export default config;

