import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.ctr.fardc.mobile',
  appName: 'CTR.NET Mobile',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3F5A2E',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      backgroundColor: '#3F5A2E',
      style: 'LIGHT' as const,
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
