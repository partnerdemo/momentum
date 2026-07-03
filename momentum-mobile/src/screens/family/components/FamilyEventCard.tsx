import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../../theme/bentoTokens';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react-native';
import { format } from 'date-fns';

interface FamilyEventCardProps {
  event: any;
  onPress?: () => void;
}

export function FamilyEventCard({ event, onPress }: FamilyEventCardProps) {
  const startTime = new Date(event.startDate);
  const isAllDay = event.allDay;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.colorBar, { backgroundColor: event.calendarType === 'family' ? '#8b5cf6' : '#3b82f6' }]} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <View style={styles.infoRow}>
          <Clock size={14} color={bentoPalette.textTertiary} />
          <Text style={styles.infoText}>
            {isAllDay ? 'All Day' : format(startTime, 'h:mm a')}
          </Text>
          {event.location && (
            <>
              <View style={styles.dot} />
              <MapPin size={14} color={bentoPalette.textTertiary} />
              <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.md,
    height: 64,
    ...shadows.soft,
    overflow: 'hidden',
  },
  colorBar: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: bentoPalette.textPrimary,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: bentoPalette.textTertiary,
    marginHorizontal: 2,
  },
});
