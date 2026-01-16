import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native'
import BackButton from '@/components/ui/BackButton'

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQSection {
  title: string
  items: FAQItem[]
}

export default function Support() {
  const { theme } = useTheme()
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
      items: [
        {
          id: 'family-plan',
          question: 'Family plan?',
          answer: 'Yes! We offer family plans that allow multiple users to share a subscription. Family plans support up to 6 users and include all premium features for each member.',
        },
        {
          id: 'gift-Flinote',
          question: 'Gift Flinote?',
          answer: 'Absolutely! You can purchase gift subscriptions for friends, family, or colleagues. Gift subscriptions can be purchased for 1, 3, 6, or 12 months and can be redeemed at any time.',
        },
        {
          id: 'language-support',
          question: 'Do you support my language?',
          answer: 'We currently support over 50 languages including English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, and many more. If your language isn\'t supported, you can request it through our feature request form.',
        },
        {
          id: 'feature-request',
          question: 'Feature request/improvement!',
          answer: 'We love hearing from our users! You can submit feature requests and suggestions through the contact form below or email us directly. We review all suggestions and prioritize features based on user demand and feasibility.',
        },
      ],
    },
    {
      title: 'Recording & Notes',
      items: [
        {
          id: 'recording-quality',
          question: 'How do I improve recording quality?',
          answer: 'For best results, use a quiet environment, speak clearly, and ensure your microphone is positioned 6-12 inches from your mouth. External microphones typically provide better quality than built-in laptop mics.',
        },
        {
          id: 'file-formats',
          question: 'What file formats are supported?',
          answer: 'We support most common audio formats including MP3, WAV, M4A, FLAC, and more. For documents, we support PDF, TXT, DOCX, and direct text input.',
        },
        {
          id: 'note-organization',
          question: 'How can I organize my notes?',
          answer: 'You can search through your notes to quickly find what you need. Our AI also automatically categorizes notes to help you find them later.',
        },
      ],
    },
    {
      title: 'Subscription & Payments',
      items: [
        {
          id: 'cancel-subscription',
          question: 'How do I cancel my subscription?',
          answer: 'You can cancel your subscription anytime from your account settings. Your subscription will remain active until the end of your current billing period.',
        },
        {
          id: 'refund-policy',
          question: 'What\'s your refund policy?',
          answer: 'We offer a 30-day money-back guarantee for all new subscriptions. If you\'re not satisfied within the first 30 days, contact us for a full refund.',
        },
        {
          id: 'payment-methods',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay for convenient and secure payments.',
        },
      ],
    },
  ]

  const handleSendMessage = () => {
    // TODO: Implement email sending logic
    const email = 'support@https://project0-nu.vercel.app'
    const emailSubject = encodeURIComponent(subject)
    const emailBody = encodeURIComponent(message)
    Linking.openURL(`mailto:${email}?subject=${emailSubject}&body=${emailBody}`)
  }

  return (
    <>
      <LinearGradient
        colors={[theme.colors.background, '#FBF7FF', '#F3E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Title Row with Back Button */}
          <View style={styles.titleRow}>
            <BackButton iconColor="#374151" />
            <Text style={styles.title}>Help Centre</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.subtitle}>
            Find answers to common questions and get the help you need
          </Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* FAQ Sections */}
            {faqSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <View key={item.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestion}
                      onPress={() => toggleExpanded(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestionText}>{item.question}</Text>
                      <Feather
                        name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    {expandedId === item.id && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* Support Email */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support Email</Text>
              <View style={styles.emailCard}>
                <Feather name="mail" size={24} color="#8B5CF6" style={styles.emailIcon} />
                <View style={styles.emailContent}>
                  <Text style={styles.emailAddress}>support@https://project0-nu.vercel.app</Text>
                  <Text style={styles.emailDescription}>
                    Our support team typically responds within 24 hours during business days.
                    For urgent issues, please include &quot;URGENT&quot; in your subject line.
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What can we help you with?"
                    placeholderTextColor="#9CA3AF"
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your question or concern in detail..."
                    placeholderTextColor="#9CA3AF"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  activeOpacity={0.8}
                >
                  <Feather name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  timeBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  emailCard: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  emailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  emailContent: {
    flex: 1,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emailDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
    opacity: 0.3,
  },
})
