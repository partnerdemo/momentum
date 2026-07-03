import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../../theme/bentoTokens';
import { FamilyEventCard } from './FamilyEventCard';
import { format, isToday, isTomorrow } from 'date-fns';

interface FamilyTimelineCardProps {
  events: any[];
}

export function FamilyTimelineCard({ events }: FamilyTimelineCardProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const renderDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    let label = format(date, 'EEEE, MMM do');
    if (isToday(date)) label = 'Today';
    else if (isTomorrow(date)) label = 'Tomorrow';

    return <Text style={styles.dateHeader}>{label}</Text>;
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedEvents.map((event, index) => {
        const showHeader = index === 0 || 
          format(new Date(event.startDate), 'yyyy-MM-dd') !== 
          format(new Date(sortedEvents[index-1].startDate), 'yyyy-MM-dd');

        return (
          <View key={event.id || index} style={styles.eventWrapper}>
            {showHeader && renderDateHeader(event.startDate)}
            <FamilyEventCard event={event} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  eventWrapper: {
    gap: spacing.xs,
  },
  dateHeader: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.textTertiary,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.md,
    ...shadows.soft,
  },
  emptyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textTertiary,
  },
});
