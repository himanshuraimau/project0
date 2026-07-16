import React, { useState } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import {
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { neutral, iconColors } from '@/lib/design-system'

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQSection {
  title: string
  icon: string
  iconBg: string
  items: FAQItem[]
}

export default function Support() {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Liquid glass
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const faqSections: FAQSection[] = [
    {
      title: 'Most Popular',
      icon: 'star',
      iconBg: iconColors.orange,
      items: [
        {
          id: 'family-plan',
          question: 'Family plan?',
          answer: 'Yes! We offer family plans that allow up to 6 users to share a subscription with all premium features.',
        },
        {
          id: 'gift-Flinote',
          question: 'Gift Flinote?',
          answer: 'You can purchase gift subscriptions for 1, 3, 6, or 12 months that can be redeemed at any time.',
        },
        {
          id: 'language-support',
          question: 'Do you support my language?',
          answer: "We support over 50 languages including English, Spanish, French, German, Chinese, Japanese, Korean, and many more. Request yours through our feature request form.",
        },
        {
          id: 'feature-request',
          question: 'Feature request or improvement',
          answer: 'We love hearing from users! Submit requests through the contact form below or email us directly. We prioritize features based on user demand.',
        },
      ],
    },
    {
      title: 'Recording & Notes',
      icon: 'mic',
      iconBg: iconColors.red,
      items: [
        {
          id: 'recording-quality',
          question: 'How do I improve recording quality?',
          answer: 'Use a quiet environment, speak clearly, and position your microphone 6\u201312 inches away. External microphones typically provide better quality.',
        },
        {
          id: 'file-formats',
          question: 'What file formats are supported?',
          answer: 'Audio: MP3, WAV, M4A, FLAC and more. Documents: PDF, TXT, DOCX, and direct text input.',
        },
        {
          id: 'note-organization',
          question: 'How can I organize my notes?',
          answer: 'Use folders to group notes, search to quickly find content, and our AI automatically categorizes notes for easy retrieval.',
        },
      ],
    },
    {
      title: 'Subscription & Payments',
      icon: 'card',
      iconBg: iconColors.indigo,
      items: [
        {
          id: 'cancel-subscription',
          question: 'How do I cancel my subscription?',
          answer: 'Cancel anytime from Settings \u2192 Manage Subscription. Your access continues until the end of your current billing period.',
        },
        {
          id: 'refund-policy',
          question: "What\u2019s your refund policy?",
          answer: "We offer a 30-day money-back guarantee for all new subscriptions. Contact us within 30 days for a full refund.",
        },
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept Visa, MasterCard, American Express, PayPal, Apple Pay, and Google Pay.',
        },
      ],
    },
  ]

  const handleSendMessage = () => {
    const email = 'support@flinote.ai'
    const emailSubject = encodeURIComponent(subject)
    const emailBody = encodeURIComponent(message)
    Linking.openURL(`mailto:${email}?subject=${emailSubject}&body=${emailBody}`)
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={[styles.headerWrap, { borderBottomColor: separatorColor, backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                },
              ]}
            >
              <Feather name="arrow-left" size={20} color={c.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Help Centre</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [
                styles.quickCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => Linking.openURL('mailto:support@flinote.ai')}
            >
              <View style={[styles.quickIcon, { backgroundColor: iconColors.blue }]}>
                <Ionicons name="mail" size={20} color="#fff" />
              </View>
              <Text style={[styles.quickLabel, { color: c.foreground }]}>Email Us</Text>
              <Text style={[styles.quickSub, { color: c.mutedForeground }]}>24h reply</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.quickCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => Linking.openURL('https://flinote.ai')}
            >
              <View style={[styles.quickIcon, { backgroundColor: iconColors.green }]}>
                <Ionicons name="globe" size={20} color="#fff" />
              </View>
              <Text style={[styles.quickLabel, { color: c.foreground }]}>Website</Text>
              <Text style={[styles.quickSub, { color: c.mutedForeground }]}>flinote.ai</Text>
            </Pressable>
          </View>

          {/* FAQ Sections */}
          {faqSections.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}>
                  <Ionicons name={section.icon as any} size={14} color="#fff" />
                </View>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>{section.title}</Text>
              </View>
              <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {section.items.map((item, idx) => {
                  const isExpanded = expandedId === item.id
                  return (
                    <React.Fragment key={item.id}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.faqRow,
                          {
                            backgroundColor: pressed
                              ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
                              : 'transparent',
                          },
                        ]}
                        onPress={() => toggleExpanded(item.id)}
                      >
                        <Text style={[styles.faqQuestion, { color: c.foreground }]}>
                          {item.question}
                        </Text>
                        <View
                          style={[
                            styles.chevronCircle,
                            {
                              backgroundColor: isExpanded
                                ? (isDark ? 'rgba(79,59,231,0.12)' : 'rgba(79,59,231,0.08)')
                                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                            },
                          ]}
                        >
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={isExpanded ? c.primary : c.mutedForeground}
                          />
                        </View>
                      </Pressable>
                      {isExpanded && (
                        <View style={[styles.faqAnswer, { borderTopColor: separatorColor }]}>
                          <Text style={[styles.faqAnswerText, { color: c.mutedForeground }]}>
                            {item.answer}
                          </Text>
                        </View>
                      )}
                      {idx < section.items.length - 1 && !isExpanded && (
                        <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                      )}
                    </React.Fragment>
                  )
                })}
              </View>
            </React.Fragment>
          ))}

          {/* Contact form */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: iconColors.blue }]}>
              <Ionicons name="send" size={14} color="#fff" />
            </View>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Send a Message</Text>
          </View>
          <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.formInner}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: c.mutedForeground }]}>Subject</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.foreground }]}
                  placeholder="What can we help with?"
                  placeholderTextColor={c.mutedForeground}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: c.mutedForeground }]}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: c.foreground }]}
                  placeholder="Describe your question or concern..."
                  placeholderTextColor={c.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: c.primary,
                    opacity: (!subject.trim() || !message.trim()) ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
                onPress={handleSendMessage}
                disabled={!subject.trim() || !message.trim()}
              >
                <Ionicons name="send" size={16} color={c.primaryForeground} />
                <Text style={[styles.sendText, { color: c.primaryForeground }]}>Send Message</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.footerText, { color: c.mutedForeground }]}>
            Our support team typically responds within 24 hours during business days.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  /* Header */
  headerWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  /* Quick actions */
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 15, fontWeight: '600' },
  quickSub: { fontSize: 12 },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 4,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },

  /* FAQ cards */
  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },

  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  faqQuestion: { fontSize: 15, fontWeight: '500', flex: 1 },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqAnswerText: { fontSize: 14, lineHeight: 21, paddingTop: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },

  /* Contact form */
  formInner: { padding: 16, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1, marginLeft: 2 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 110,
    paddingTop: 12,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  sendText: { fontSize: 16, fontWeight: '600' },

  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: -4,
    paddingHorizontal: 20,
  },
})
