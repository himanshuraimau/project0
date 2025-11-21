import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface TestimonialCardProps {
  name: string
  title: string
  quote: string
  stars?: number
}

export function TestimonialCard({ name, title, quote, stars = 5 }: TestimonialCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4C57FF', '#14C3A2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blurGradient}
      />
      
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.titleText}>{title}</Text>
            </View>
            <View style={styles.starsContainer}>
              {Array.from({ length: stars }).map((_, i) => (
                <Text key={i} style={styles.star}>⭐</Text>
              ))}
            </View>
          </View>
          
          <Text style={styles.quote}>{quote}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 345,
    position: 'relative',
    // height removed for auto-sizing
  },
  card: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#EBEDF2',
    shadowColor: '#4C57FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderRadius: 24,
    position: 'relative',
    zIndex: 1,
    // height removed for auto-sizing
  },
  blurGradient: {
    position: 'absolute',
    width: 128,
    height: 128,
    left: 254.6,
    top: -37.6,
    opacity: 0.2,
    borderRadius: 100,
    zIndex: 0,
  },
  content: {
    padding: 24.8,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  nameSection: {
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#0B0C10',
    fontFamily: 'Arimo',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#5A6171',
    fontFamily: 'Arimo',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 16,
  },
  quote: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#0B0C10',
    fontFamily: 'Arimo',
  },
})
