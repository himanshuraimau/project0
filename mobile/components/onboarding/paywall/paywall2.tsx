import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/hooks/useTheme';

const features = [
  { name: 'Instant notes', basic: true, unlimited: true },
  { name: 'Unlimited notes', basic: false, unlimited: true },
  { name: 'Flashcards, Quizzes', basic: false, unlimited: true },
  { name: 'AI Mindmaps', basic: false, unlimited: true },
  { name: 'Upload images, PDFs', basic: false, unlimited: true },
  { name: 'YouTube videos', basic: false, unlimited: true },
  { name: 'Chat with notes', basic: false, unlimited: true },
  { name: 'Priority support', basic: false, unlimited: true },
];

export default function App() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'unlimited'>('unlimited');
  const slideAnim = useRef(new Animated.Value(1)).current; // 0 for basic, 1 for unlimited

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedPlan === 'basic' ? 0 : 1,
      useNativeDriver: false,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [selectedPlan]);

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 100, // Space for footer
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '500',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 36,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 20,
      // Shadow for iOS
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      // Elevation for Android
      elevation: isDark ? 0 : 5,
      borderWidth: isDark ? 0.5 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
    },
    toggleContainer: {
      alignItems: 'flex-end', // Align to right
      marginBottom: 20,
    },
    toggleWrapper: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.muted,
      borderRadius: 20,
      padding: 2,
      width: 180,
      height: 36,
      position: 'relative',
    },
    toggleActiveBackground: {
      position: 'absolute',
      width: 88, // Half of toggle width minus padding
      height: 32,
      backgroundColor: c.primary,
      borderRadius: 18,
      left: 2,
      top: 2,
    },
    toggleOption: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
      zIndex: 1,
    },
    toggleTextInactive: {
      color: c.mutedForeground,
      fontWeight: '600',
      fontSize: 13,
    },
    toggleTextActive: {
      color: c.primaryForeground,
      fontWeight: '500',
      fontSize: 13,
    },
    tableContainer: {
      marginTop: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    featureText: {
      flex: 1,
      fontSize: 15,
      color: c.foreground,
      fontWeight: '500',
    },
    iconColumn: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleGray: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCirclePurple: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dashLine: {
      width: 12,
      height: 2,
      backgroundColor: c.mutedForeground,
      borderRadius: 1,
    },
    footer: {
      position: 'absolute',
      bottom: 50,
      left: 20,
      right: 20,
    },
    button: {
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 10,
    },
    buttonInner: {
      backgroundColor: c.primary,
      paddingVertical: 18,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: c.primaryForeground,
      fontSize: 18,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Unlimited notes,</Text>
            <Text style={styles.headerTitle}>better grades</Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>

            {/* Toggle Switch */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleWrapper}>
                {/* Animated Background */}
                <Animated.View
                  style={[
                    styles.toggleActiveBackground,
                    {
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 88], // Half of toggle width (180/2 - 2px padding)
                          }),
                        },
                      ],
                    },
                  ]}
                />

                {/* Buttons */}
                <TouchableOpacity
                  style={styles.toggleOption}
                  onPress={() => setSelectedPlan('basic')}
                  activeOpacity={0.7}
                >
                  <Text style={selectedPlan === 'basic' ? styles.toggleTextActive : styles.toggleTextInactive}>
                    Basic
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toggleOption}
                  onPress={() => setSelectedPlan('unlimited')}
                  activeOpacity={0.7}
                >
                  <Text style={selectedPlan === 'unlimited' ? styles.toggleTextActive : styles.toggleTextInactive}>
                    Unlimited
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Features List */}
            <View style={styles.tableContainer}>
              {features.map((item, index) => (
                <View key={index} style={styles.row}>
                  {/* Feature Name */}
                  <Text style={styles.featureText}>{item.name}</Text>

                  {/* Basic Column */}
                  <View style={styles.iconColumn}>
                    {item.basic ? (
                      <View style={selectedPlan === 'basic' ? styles.checkCirclePurple : styles.checkCircleGray}>
                        <Feather
                          name="check"
                          size={selectedPlan === 'basic' ? 14 : 12}
                          color={selectedPlan === 'basic' ? c.primaryForeground : c.mutedForeground}
                        />
                      </View>
                    ) : (
                      <View style={styles.dashLine} />
                    )}
                  </View>

                  {/* Unlimited Column */}
                  <View style={styles.iconColumn}>
                    <View style={selectedPlan === 'unlimited' ? styles.checkCirclePurple : styles.checkCircleGray}>
                      <Feather
                        name="check"
                        size={selectedPlan === 'unlimited' ? 14 : 12}
                        color={selectedPlan === 'unlimited' ? c.primaryForeground : c.mutedForeground}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(onboarding)/paywall/paywall3' as any)}>
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Try 3 days FREE 🔥</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
