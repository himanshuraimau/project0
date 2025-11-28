import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Jellinote AI",
    slug: "jellinote-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/main-logo.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        infoPlist: {
            UIViewControllerBasedStatusBarAppearance: false,
            UIStatusBarHidden: false,
            UIStatusBarStyle: "UIStatusBarStyleDefault"
        },
        bundleIdentifier: "com.kjish.mobile"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/images/main-logo.png",
            backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true,
        softwareKeyboardLayoutMode: "pan",


        permissions: [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
            "android.permission.ACCESS_MEDIA_LOCATION",
            "android.permission.READ_MEDIA_IMAGES"
        ],
        package: "com.kjish.mobile"
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/main-logo.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                "image": "./assets/images/splash-icon.png",
                "imageWidth": 200,
                "resizeMode": "contain",
                "backgroundColor": "#ffffff"
            }
        ],
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
            projectId: "48443544-2899-42df-a88f-430cc60f236a"
        },

        // Add your secrets here, e.g.:
        // apiKey: process.env.MY_API_KEY,
    },
    owner: "k-jish"
});
