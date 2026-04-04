import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.ctr.fardc.enrollement.mobile',
  appName: 'ENROL.NET',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#003C8F',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      backgroundColor: '#003C8F',
      style: 'LIGHT' as const,
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
