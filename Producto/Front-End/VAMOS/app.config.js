module.exports = {
  expo: {
    name: "VAMOS",
    slug: "VAMOS",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vamos",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.luis_ma.vamos",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMaps: {
          // Toma la variable de entorno directamente desde tu archivo .env
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "@react-native-community/datetimepicker",
      "expo-secure-store",
      "expo-web-browser",
      "@react-native-google-signin/google-signin",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "fdb61664-7ed1-4553-a4a1-d1638bcd092e"
      }
    }
  }
};