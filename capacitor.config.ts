import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motocarburant.app',
  appName: 'Moto Carburant',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'MotoCarburant'
  }
};

export default config;
