import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.89d0a2880a7a40a19d85559f505f367c',
  appName: 'chat-translate-live',
  webDir: 'dist',
  server: {
    url: 'https://89d0a288-0a7a-40a1-9d85-559f505f367c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;