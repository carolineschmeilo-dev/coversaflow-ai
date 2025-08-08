import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coversaflow.transbridge',
  appName: 'CoversaFlow',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Contacts: {
      // Contact permissions configuration
    },
  },
};

export default config;