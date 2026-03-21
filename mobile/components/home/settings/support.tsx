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
import { neutral } from '@/lib/design-system'

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

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const faqSections: FAQSection[] = [
    {
      title: 'Most Popular',
      icon: 'star',
      iconBg: '#FF9500',
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
      iconBg: '#FF3B30',
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
      iconBg: '#5856D6',
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

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Help Centre</Text>
          <View style={{ width: 24 }} />
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
              style={[styles.quickCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => Linking.openURL('mailto:support@flinote.ai')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="mail" size={20} color="#fff" />
              </View>
              <Text style={[styles.quickLabel, { color: c.foreground }]}>Email Us</Text>
              <Text style={[styles.quickSub, { color: c.mutedForeground }]}>24h reply</Text>
            </Pressable>
            <Pressable
              style={[styles.quickCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => Linking.openURL('https://flinote.ai')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#34C759' }]}>
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
                {section.items.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <Pressable
                      style={styles.faqRow}
                      onPress={() => toggleExpanded(item.id)}
                    >
                      <Text style={[styles.faqQuestion, { color: c.foreground }]}>
                        {item.question}
                      </Text>
                      <Ionicons
                        name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={c.mutedForeground}
                      />
                    </Pressable>
                    {expandedId === item.id && (
                      <View style={[styles.faqAnswer, { borderTopColor: separatorColor }]}>
                        <Text style={[styles.faqAnswerText, { color: c.mutedForeground }]}>
                          {item.answer}
                        </Text>
                      </View>
                    )}
                    {idx < section.items.length - 1 && expandedId !== item.id && (
                      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </React.Fragment>
          ))}

          {/* Contact form */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="send" size={14} color="#fff" />
            </View>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Send a Message</Text>
          </View>
          <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.formInner}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: c.mutedForeground }]}>Subject</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: c.foreground }]}
                  placeholder="What can we help with?"
                  placeholderTextColor={c.mutedForeground}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: c.mutedForeground }]}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: c.foreground }]}
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
                    opacity: (!subject.trim() || !message.trim()) ? 0.5 : pressed ? 0.85 : 1,
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

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
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },

  group: {
    borderRadius: 14,
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
  },
  faqQuestion: { fontSize: 15, fontWeight: '500', flex: 1, marginRight: 12 },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqAnswerText: { fontSize: 14, lineHeight: 21, paddingTop: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },

  formInner: { padding: 16, gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1, marginLeft: 2 },
  input: {
    borderRadius: 10,
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
