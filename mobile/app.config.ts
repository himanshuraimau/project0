import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Flinote",
    slug: "flinote-mobile",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "flinote",
    icon: "./assets/images/flinote-logo.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    runtimeVersion: "1.0.0",
    description: "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    ios: {
        supportsTablet: true,
        infoPlist: {
            UIViewControllerBasedStatusBarAppearance: false,
            UIStatusBarHidden: false,
            UIStatusBarStyle: "UIStatusBarStyleDefault"
        },
        bundleIdentifier: "com.abhishekhq11.flinote"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/images/flinote-logo.png",
            backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true,
        softwareKeyboardLayoutMode: "resize",
        permissions: [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
            "android.permission.ACCESS_MEDIA_LOCATION",
            "android.permission.READ_MEDIA_IMAGES"
        ],
        package: "com.abhishekhq11.flinote"
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/flinote-logo.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                "image": "./assets/images/flinote-logo.png",
                "imageWidth": 200,
                "resizeMode": "contain",
                "backgroundColor": "#ffffff"
            }
        ],
        "expo-font",
        "expo-secure-store",
        "expo-web-browser",
        "expo-localization",
        [
            "expo-media-library",
            {
                "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
                "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
                "isAccessMediaLocationEnabled": false
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        eas: {
            projectId: "77ed724e-8d19-4327-a25e-b74810a4150a"
        },

        // Add your secrets here, e.g.:
        // apiKey: process.env.MY_API_KEY,
    },
    owner: "abhishekhq11"
});
