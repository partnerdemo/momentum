import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../theme/bentoTokens';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

export default function ParentCalendarScreen() {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={bentoPalette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Family Calendar</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
          {/* Calendar grid rendering logic (simplified) */}
          {days.map(day => (
            <TouchableOpacity key={day.toString()} style={[styles.dayCell, isToday(day) && styles.todayCell]}>
              <Text style={[styles.dayText, isToday(day) && styles.todayText]}>{format(day, 'd')}</Text>
              <View style={styles.eventDot} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.eventList}>
        <Text style={styles.listTitle}>Events for {format(currentDate, 'MMMM do')}</Text>
        <View style={styles.emptyState}>
          <CalendarIcon size={32} color={bentoPalette.textTertiary} opacity={0.3} />
          <Text style={styles.emptyText}>Tap a day or use + to add an event</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  title: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: bentoPalette.brandPrimary, justifyContent: 'center', alignItems: 'center', ...shadows.float },
  calendarContainer: { padding: spacing.xl, backgroundColor: '#fff', marginHorizontal: spacing.xl, borderRadius: borderRadius.xl, ...shadows.soft },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textPrimary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: bentoPalette.textTertiary, marginBottom: spacing.md },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  todayCell: { backgroundColor: bentoPalette.brandPrimary },
  dayText: { fontSize: 15, color: bentoPalette.textPrimary },
  todayText: { color: '#fff', fontWeight: 'bold' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: bentoPalette.brandPrimary, marginTop: 2 },
  eventList: { flex: 1, padding: spacing.xl },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: bentoPalette.textPrimary, marginBottom: spacing.md },
  emptyState: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { marginTop: spacing.md, color: bentoPalette.textTertiary, textAlign: 'center' }
});
