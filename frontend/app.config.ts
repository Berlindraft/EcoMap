import "dotenv/config";

export default ({ config }: { config: any }) => ({
  ...config,
  name: "EcoMap",
  slug: "EcoMap",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/EcoMapIcon.png",
  scheme: "ecomap",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAP_API_KEY || "",
    },
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/images/EcoMapIcon.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAP_API_KEY || "",
      },
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.anonymous.ecomap",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/EcoMapIcon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/EcoMapIcon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000000",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
