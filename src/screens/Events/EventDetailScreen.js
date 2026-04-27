import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Button, Surface, Divider, Avatar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents, EVENT_CATEGORIES } from '../../context/EventContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { theme, isDarkMode } = useTheme();
  const { userProfile, currentUser } = useAuth();
  const {
    fetchEventById,
    registerForEvent,
    cancelRegistration,
    toggleReminder,
    isRegistered,
    isOnWaitlist,
    reminders,
    categories,
  } = useEvents();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const styles = getStyles(theme, isDarkMode);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    const data = await fetchEventById(eventId);
    setEvent(data);
    setLoading(false);
  };

  const getCategoryInfo = (categoryKey) => {
    return categories.find((c) => c.key === categoryKey) || categories[0];
  };

  const formatDate = (date, showTime = true) => {
    const d = new Date(date);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(showTime && { hour: 'numeric', minute: '2-digit' }),
    };
    return d.toLocaleDateString('en-US', options);
  };

  const formatDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to register for this event.');
      return;
    }

    setRegistering(true);
    const result = await registerForEvent(eventId, currentUser.uid, {
      name: userProfile?.name || 'Anonymous',
      email: currentUser.email,
    });

    setRegistering(false);

    if (result.success) {
      Alert.alert(
        'Registration Successful',
        result.status === 'waitlisted'
          ? "You've been added to the waitlist. We'll notify you if a spot opens up."
          : "You're registered for this event!",
        [{ text: 'OK', onPress: loadEvent }]
      );
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  const handleCancelRegistration = async () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setRegistering(true);
            const result = await cancelRegistration(eventId, currentUser.uid);
            setRegistering(false);

            if (result.success) {
              Alert.alert('Cancelled', 'Your registration has been cancelled.', [
                { text: 'OK', onPress: loadEvent },
              ]);
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n\nDate: ${formatDate(event.startDate)}\n\nLocation: ${event.isOnline ? 'Online' : event.location}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCalendar = () => {
    // Generate calendar link (Google Calendar)
    const startDate = new Date(event.startDate).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(event.endDate).toISOString().replace(/-|:|\.\d+/g, '');
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;

    Linking.openURL(calendarUrl);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme?.colors?.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme?.colors?.error} />
        <Text style={styles.errorText}>Event not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const category = getCategoryInfo(event.category);
  const registered = isRegistered(eventId, currentUser?.uid);
  const onWaitlist = isOnWaitlist(eventId, currentUser?.uid);
  const hasReminder = reminders[eventId];
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - (event.registrationCount || 0)
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isPast = new Date(event.endDate) < new Date();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={category.color}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        {event.bannerUrl ? (
          <Image source={{ uri: event.bannerUrl }} style={styles.banner} />
        ) : (
          <LinearGradient
            colors={[category.color, category.color + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <Ionicons name={category.icon} size={64} color="#fff" />
          </LinearGradient>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleReminder(eventId)}
          >
            <Ionicons
              name={hasReminder ? 'notifications' : 'notifications-outline'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '15' }]}>
              <Ionicons name={category.icon} size={14} color={category.color} />
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
            </View>
            <TouchableOpacity style={styles.addToCalBtn} onPress={handleAddToCalendar}>
              <Ionicons name="calendar-outline" size={18} color={theme?.colors?.primary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Quick Info Cards */}
          <View style={styles.infoCards}>
            {/* Date Card */}
            <Surface style={styles.infoCard}>
              <View style={[styles.infoIconContainer, { backgroundColor: category.color + '10' }]}>
                <Ionicons name="time" size={22} color={category.color} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Timeline</Text>
                <Text style={styles.infoValue}>
                  {formatDate(event.startDate)}
                </Text>
                <Text style={styles.infoSummary}>
                  {formatDuration(event.startDate, event.endDate)} duration
                </Text>
              </View>
            </Surface>

            {/* Location Card */}
            <Surface style={styles.infoCard}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons
                  name={event.isOnline ? 'videocam' : 'location'}
                  size={22}
                  color="#1E88E5"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>
                  {event.isOnline ? 'Virtual Hub' : 'Physical Arena'}
                </Text>
                <Text style={styles.infoValue}>
                  {event.isOnline ? 'Hosted Online' : event.location}
                </Text>
                {event.meetingLink && (
                  <TouchableOpacity onPress={() => Linking.openURL(event.meetingLink)}>
                    <Text style={styles.linkText}>Join Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Surface>
          </View>

          {/* Registration Status */}
          {!isPast && (
            <Surface style={styles.registrationCard}>
              <View style={styles.registrationInfo}>
                <View style={styles.registrationStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{event.registrationCount || 0}</Text>
                    <Text style={styles.statLabel}>Registered</Text>
                  </View>
                  {event.maxCapacity && (
                    <>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{event.maxCapacity}</Text>
                        <Text style={styles.statLabel}>Capacity</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text
                          style={[
                            styles.statValue,
                            isFull && { color: theme?.colors?.error },
                          ]}
                        >
                          {spotsLeft > 0 ? spotsLeft : 'Full'}
                        </Text>
                        <Text style={styles.statLabel}>
                          {spotsLeft > 0 ? 'Spots Left' : 'Waitlist'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {event.waitlist?.length > 0 && (
                  <Text style={styles.waitlistInfo}>
                    {event.waitlist.length} on waitlist
                  </Text>
                )}
              </View>
            </Surface>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>
              {event.description || 'No description provided.'}
            </Text>
          </View>

          {/* Organizer */}
          {event.organizer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizer</Text>
              <View style={styles.organizerCard}>
                <Avatar.Text
                  size={48}
                  label={(event.organizer.name || 'O').charAt(0)}
                  style={{ backgroundColor: category.color }}
                />
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>{event.organizer.name}</Text>
                  {event.organizer.email && (
                    <Text style={styles.organizerEmail}>{event.organizer.email}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Tags */}
          {event.tags?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Calendar Sync */}
          <TouchableOpacity
            style={styles.calendarSyncButton}
            onPress={handleAddToCalendar}
          >
            <Ionicons name="calendar-outline" size={20} color={theme?.colors?.primary} />
            <Text style={styles.calendarSyncText}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Registration Button */}
      {!isPast && (
        <View style={styles.footer}>
          {registered ? (
            <View style={styles.registeredContainer}>
              <View style={styles.registeredBadge}>
                <Ionicons name="checkmark-circle" size={20} color={theme?.colors?.success} />
                <Text style={styles.registeredText}>You're Registered</Text>
              </View>
              <Button
                mode="outlined"
                onPress={handleCancelRegistration}
                loading={registering}
                textColor={theme?.colors?.error}
                style={styles.cancelButton}
              >
                Cancel Registration
              </Button>
            </View>
          ) : onWaitlist ? (
            <View style={styles.registeredContainer}>
              <View style={styles.waitlistBadge}>
                <Ionicons name="time" size={20} color={theme?.colors?.warning} />
                <Text style={styles.waitlistText}>You're on the Waitlist</Text>
              </View>
              <Button
                mode="outlined"
                onPress={handleCancelRegistration}
                loading={registering}
                textColor={theme?.colors?.error}
                style={styles.cancelButton}
              >
                Leave Waitlist
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={registering}
              disabled={registering}
              style={[styles.registerButton, { backgroundColor: category.color }]}
              labelStyle={styles.registerButtonLabel}
            >
              {isFull ? 'Join Waitlist' : 'Register Now'}
            </Button>
          )}
        </View>
      )}

      {/* Past Event Indicator */}
      {isPast && (
        <View style={styles.pastEventBanner}>
          <Ionicons name="time-outline" size={20} color="#fff" />
          <Text style={styles.pastEventText}>This event has ended</Text>
        </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#f8f9fc',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: isDarkMode ? '#121212' : '#f8f9fc',
    },
    errorText: {
      fontSize: 22,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginVertical: 16,
      letterSpacing: -0.5,
    },
    scrollView: {
      flex: 1,
    },
    banner: {
      width: '100%',
      height: 320,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
      left: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    topActions: {
      position: 'absolute',
      top: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
      right: 20,
      flexDirection: 'row',
      gap: 14,
    },
    actionButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    content: {
      padding: 28,
      paddingBottom: 140,
      marginTop: -40,
      backgroundColor: isDarkMode ? '#121212' : '#f8f9fc',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    categoryBadgeText: {
      fontSize: 14,
      fontWeight: '900',
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    addToCalBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 32,
      lineHeight: 40,
      letterSpacing: -1,
    },
    infoCards: {
      gap: 20,
      marginBottom: 40,
    },
    infoCard: {
      flexDirection: 'row',
      padding: 24,
      borderRadius: 28,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    infoIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 20,
    },
    infoTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: isDarkMode ? '#888' : '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    infoValue: {
      fontSize: 17,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      lineHeight: 22,
    },
    infoSummary: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#64748b',
      fontWeight: '600',
      marginTop: 4,
    },
    linkText: {
      fontSize: 15,
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '800',
      marginTop: 8,
    },
    registrationCard: {
      padding: 28,
      borderRadius: 32,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      marginBottom: 40,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
    registrationStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: isDarkMode ? '#888' : '#94a3b8',
      marginTop: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1.5,
      backgroundColor: isDarkMode ? '#333' : '#f1f5f9',
    },
    waitlistInfo: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '800',
      color: '#FF9800',
      marginTop: 20,
    },
    section: {
      marginBottom: 40,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 20,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 17,
      lineHeight: 28,
      color: isDarkMode ? '#ccc' : '#475569',
      fontWeight: '500',
    },
    organizerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      padding: 20,
      borderRadius: 24,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    organizerInfo: {
      marginLeft: 20,
    },
    organizerName: {
      fontSize: 19,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
    },
    organizerEmail: {
      fontSize: 15,
      color: isDarkMode ? '#aaa' : '#64748b',
      marginTop: 4,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tag: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 100,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#333' : '#e2e8f0',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    tagText: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#aaa' : '#64748b',
    },
    calendarSyncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      borderWidth: 2,
      borderColor: isDarkMode ? '#333' : '#e2e8f0',
      borderStyle: 'dashed',
      marginTop: 12,
    },
    calendarSyncText: {
      fontSize: 16,
      fontWeight: '900',
      color: isDarkMode ? '#ccc' : '#475569',
      marginLeft: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 28,
      paddingBottom: Platform.OS === 'ios' ? 44 : 28,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#222' : '#f1f5f9',
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
    },
    registerButton: {
      borderRadius: 20,
      height: 64,
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    registerButtonLabel: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    registeredContainer: {
      alignItems: 'center',
    },
    registeredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(46, 125, 50, 0.3)' : '#C8E6C9',
    },
    registeredText: {
      fontSize: 16,
      fontWeight: '900',
      color: isDarkMode ? '#81C784' : '#2E7D32',
      marginLeft: 10,
    },
    waitlistBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: isDarkMode ? 'rgba(239, 108, 0, 0.15)' : '#FFF3E0',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 108, 0, 0.3)' : '#FFE0B2',
    },
    waitlistText: {
      fontSize: 16,
      fontWeight: '900',
      color: isDarkMode ? '#FFB74D' : '#EF6C00',
      marginLeft: 10,
    },
    cancelButton: {
      borderColor: isDarkMode ? '#444' : '#ffcdd2',
      borderWidth: 1.5,
      width: '100%',
      height: 56,
      borderRadius: 20,
    },
    pastEventBanner: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#333',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333' : '#222',
    },
    pastEventText: {
      fontSize: 16,
      fontWeight: '900',
      color: '#fff',
      marginLeft: 10,
    },
  });
