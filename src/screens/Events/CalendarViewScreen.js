import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Surface, Badge, FAB, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 48) / 7;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarViewScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { userProfile } = useAuth();
  const { events, loading, getEventsByMonth, getEventsForDate, categories } = useEvents();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthEvents, setMonthEvents] = useState([]);

  const styles = getStyles(theme, isDarkMode);

  const isAdmin = true; // Allow all users to create events

  useEffect(() => {
    loadMonthEvents();
  }, [currentMonth, currentYear, events]);

  const loadMonthEvents = () => {
    const eventsInMonth = getEventsByMonth(currentYear, currentMonth);
    setMonthEvents(eventsInMonth);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, i),
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get events for a specific date
  const getEventsForDay = (date) => {
    return monthEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const getCategoryColor = (categoryKey) => {
    const cat = categories.find((c) => c.key === categoryKey);
    return cat?.color || theme?.colors?.primary;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient
        colors={
          isDarkMode
            ? ['#1a1a2e', '#16213e']
            : ['#667eea', '#764ba2']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Event Calendar</Text>
          <Text style={styles.headerSubtitle}>
            {monthEvents.length} events this month
          </Text>
        </View>

        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Ionicons name="chevron-back" size={24} color={theme?.colors?.text} />
          </TouchableOpacity>

          <Text style={styles.monthYearText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <Ionicons name="chevron-forward" size={24} color={theme?.colors?.text} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <Surface style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const dayEvents = item.isCurrentMonth ? getEventsForDay(item.date) : [];
              const hasEvents = dayEvents.length > 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !item.isCurrentMonth && styles.otherMonthDay,
                    isToday(item.date) && styles.todayCell,
                    isSelected(item.date) && styles.selectedCell,
                  ]}
                  onPress={() => {
                    if (item.isCurrentMonth) {
                      setSelectedDate(item.date);
                    }
                  }}
                  activeOpacity={item.isCurrentMonth ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !item.isCurrentMonth && styles.otherMonthText,
                      isToday(item.date) && styles.todayText,
                      isSelected(item.date) && styles.selectedText,
                    ]}
                  >
                    {item.day}
                  </Text>

                  {/* Event Dots */}
                  {hasEvents && (
                    <View style={styles.eventDots}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <View
                          key={i}
                          style={[
                            styles.eventDot,
                            { backgroundColor: getCategoryColor(event.category) },
                          ]}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Surface>

        {/* Selected Day Events */}
        {selectedDate && (
          <View style={styles.selectedDaySection}>
            <Text style={styles.selectedDayTitle}>
              Events on {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {selectedDayEvents.length === 0 ? (
              <Surface style={styles.noEventsCard}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={theme?.colors?.textSecondary}
                />
                <Text style={styles.noEventsText}>No events scheduled</Text>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.createEventLink}
                    onPress={() => navigation.navigate('CreateEvent')}
                  >
                    <Text style={styles.createEventLinkText}>
                      + Create an event
                    </Text>
                  </TouchableOpacity>
                )}
              </Surface>
            ) : (
              selectedDayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <Surface style={styles.eventCard}>
                    <View
                      style={[
                        styles.eventTimeIndicator,
                        { backgroundColor: getCategoryColor(event.category) },
                      ]}
                    />
                    <View style={styles.eventCardContent}>
                      <View style={styles.eventTimeRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={getCategoryColor(event.category)}
                        />
                        <Text style={styles.eventTime}>
                          {formatTime(event.startDate)}
                        </Text>
                      </View>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Ionicons
                          name={event.isOnline ? 'videocam-outline' : 'location-outline'}
                          size={14}
                          color={theme?.colors?.textSecondary}
                        />
                        <Text style={styles.eventLocation}>
                          {event.isOnline ? 'Online' : event.location}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.eventArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme?.colors?.textSecondary}
                      />
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Categories</Text>
          <View style={styles.legendItems}>
            {categories.slice(0, 6).map((cat) => (
              <View key={cat.key} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: cat.color }]}
                />
                <Text style={styles.legendText}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB for Admin */}
      {isAdmin && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => navigation.navigate('CreateEvent')}
          color="#fff"
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f8f9fc',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: Platform.OS === 'android' ? 50 : 20,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 4,
      fontWeight: '600',
    },
    todayButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    todayButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#fff',
    },
    scrollView: {
      flex: 1,
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    navButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    monthYearText: {
      fontSize: 24,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      letterSpacing: -0.5,
    },
    calendarContainer: {
      marginHorizontal: 20,
      borderRadius: 28,
      padding: 20,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    dayHeaders: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 20,
      borderBottomWidth: 1.5,
      borderBottomColor: isDarkMode ? '#333' : '#f1f5f9',
    },
    dayHeader: {
      width: CELL_SIZE,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '800',
      color: isDarkMode ? '#888' : '#64748b',
      textTransform: 'uppercase',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingTop: 16,
    },
    dayCell: {
      width: CELL_SIZE,
      height: CELL_SIZE + 16,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 12,
    },
    otherMonthDay: {
      opacity: 0.3,
    },
    todayCell: {
      backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme?.colors?.primary + '40',
    },
    selectedCell: {
      backgroundColor: theme?.colors?.primary || '#667eea',
      borderRadius: 16,
      elevation: 6,
      shadowColor: theme?.colors?.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#1e293b',
    },
    otherMonthText: {
      color: isDarkMode ? '#666' : '#94a3b8',
    },
    todayText: {
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '900',
    },
    selectedText: {
      color: '#fff',
      fontWeight: '900',
    },
    eventDots: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 4,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    eventDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    moreEvents: {
      fontSize: 9,
      fontWeight: '800',
      color: theme?.colors?.primary,
      marginLeft: 2,
    },
    selectedDaySection: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    selectedDayTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 24,
      letterSpacing: -0.5,
    },
    noEventsCard: {
      padding: 48,
      borderRadius: 28,
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    noEventsText: {
      fontSize: 17,
      fontWeight: '600',
      color: isDarkMode ? '#aaa' : '#64748b',
      marginTop: 20,
    },
    createEventLink: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(102,126,234,0.2)',
    },
    createEventLinkText: {
      fontSize: 15,
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '800',
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      marginBottom: 20,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    eventTimeIndicator: {
      width: 8,
      height: '100%',
      position: 'absolute',
      left: 0,
    },
    eventCardContent: {
      flex: 1,
      padding: 24,
      paddingLeft: 30,
    },
    eventTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    eventTime: {
      fontSize: 14,
      fontWeight: '800',
      color: isDarkMode ? '#aaa' : '#64748b',
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    eventTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 10,
      lineHeight: 24,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    eventLocation: {
      fontSize: 15,
      color: isDarkMode ? '#aaa' : '#64748b',
      marginLeft: 8,
      fontWeight: '500',
    },
    eventArrow: {
      paddingRight: 20,
    },
    legend: {
      marginTop: 40,
      marginBottom: 120,
      paddingHorizontal: 24,
    },
    legendTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 20,
    },
    legendItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    legendText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#ccc' : '#475569',
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 30,
      borderRadius: 20,
      width: 64,
      height: 64,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
  });
