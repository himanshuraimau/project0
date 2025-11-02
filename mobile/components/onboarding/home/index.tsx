import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'

export default function NotesHome() {
  const { theme } = useTheme()

  return (
    <LinearGradient
      colors={[theme.colors.background, '#FBF7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header with time and status icons */}
        <View style={styles.topBar}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>4:23</Text>
          </View>
          <View style={styles.statusIcons}>
            <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
            <Feather name="battery" size={18} color="#222" />
          </View>
        </View>

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>My notes</Text>
          <TouchableOpacity style={styles.settingsButton} accessibilityLabel="Settings">
            <Feather name="settings" size={22} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#9CA3AF" style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Search notes, tags, or people"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Filter pills */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {['All', 'Pinned', 'Shared', 'Folders', 'Archive'].map((f) => {
              const selected = f === 'All'
              return (
                <Pressable key={f} style={[styles.filterPill, selected && styles.filterPillSelected]}>
                  <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{f}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* Notes list (partial) */}
        <ScrollView style={styles.notesList}>
          <Pressable style={styles.noteCard}>
            <View style={styles.noteLeftIcon}>
              <Feather name="file-text" size={20} color="#6B7280" />
            </View>
            <View style={styles.noteBody}>
              <Text numberOfLines={2} style={styles.noteTitle}>
                Exploration of the Scope and Impact of Artificial Intelligence
              </Text>
              <Text style={styles.noteDate}>Mar 14, 2025</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        </ScrollView>

        {/* Floating Action Button */}
        <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.fab} accessibilityLabel="Add note">
            <Text style={styles.fabPlus}>+</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Bottom home indicator */}
        <View style={styles.homeIndicator} />
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeBadge: {
    backgroundColor: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  settingsButton: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  filtersWrapper: {
    height: 48,
    marginBottom: 12,
  },
  filtersScroll: {
    alignItems: 'center',
    paddingRight: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  filterPillSelected: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    color: '#374151',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#fff',
  },
  notesList: {
    flex: 1,
    marginTop: 6,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noteLeftIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  noteDate: {
    color: '#6B7280',
    fontSize: 13,
  },
  fabGradient: {
    position: 'absolute',
    right: 18,
    bottom: 36,
    borderRadius: 999,
  },
  fab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
  },
  homeIndicator: {
    height: 6,
    backgroundColor: '#E6E6F0',
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 6,
    alignSelf: 'center',
    width: 120,
    opacity: 0.7,
  },
})
