import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EventContext = createContext();

const EVENT_REMINDERS_KEY = '@event_reminders';

// Event Categories
export const EVENT_CATEGORIES = [
  { key: 'all', label: 'All Events', icon: 'apps', color: '#667eea' },
  { key: 'workshop', label: 'Workshop', icon: 'construct', color: '#4CAF50' },
  { key: 'webinar', label: 'Webinar', icon: 'videocam', color: '#2196F3' },
  { key: 'competition', label: 'Competition', icon: 'trophy', color: '#FF9800' },
  { key: 'networking', label: 'Networking', icon: 'people', color: '#9C27B0' },
  { key: 'conference', label: 'Conference', icon: 'business', color: '#607D8B' },
  { key: 'hackathon', label: 'Hackathon', icon: 'code-slash', color: '#E91E63' },
  { key: 'demo_day', label: 'Demo Day', icon: 'rocket', color: '#00BCD4' },
  { key: 'mentorship', label: 'Mentorship', icon: 'school', color: '#795548' },
  { key: 'funding', label: 'Funding Event', icon: 'cash', color: '#F44336' },
];

// Event Status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within EventProvider');
  }
  return context;
};

export function EventProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState({});

  // Load reminders from storage
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(EVENT_REMINDERS_KEY);
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (newReminders) => {
    try {
      await AsyncStorage.setItem(EVENT_REMINDERS_KEY, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  // Fetch all events
  const fetchEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'events'),
        orderBy('startDate', 'asc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const fetchedEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.() || new Date(doc.data().startDate),
        endDate: doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
      }));

      // Apply client-side filters
      let filtered = fetchedEvents;

      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter((e) => e.category === filters.category);
      }

      if (filters.status) {
        filtered = filtered.filter((e) => e.status === filters.status);
      }

      if (filters.upcoming) {
        const now = new Date();
        filtered = filtered.filter((e) => new Date(e.startDate) >= now);
      }

      setEvents(filtered);

      // Update upcoming events
      const now = new Date();
      const upcoming = fetchedEvents
        .filter((e) => new Date(e.startDate) >= now)
        .slice(0, 10);
      setUpcomingEvents(upcoming);

      return filtered;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single event
  const fetchEventById = useCallback(async (eventId) => {
    try {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }, []);

  // Create event (admin/government only)
  const createEvent = useCallback(async (eventData, userId) => {
    try {
      const newEvent = {
        ...eventData,
        createdBy: userId || eventData.organizer?.id || 'anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        registrations: [],
        waitlist: [],
        registrationCount: 0,
        status: EVENT_STATUS.PUBLISHED,
      };

      const docRef = await addDoc(collection(db, 'events'), newEvent);
      
      // Refresh events
      await fetchEvents();
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  }, [fetchEvents]);

  // Update event
  const updateEvent = useCallback(async (eventId, updates) => {
    try {
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      await fetchEvents();
      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  }, [fetchEvents]);

  // Delete event
  const deleteEvent = useCallback(async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      await fetchEvents();
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }
  }, [fetchEvents]);

  // Register for event
  const registerForEvent = useCallback(async (eventId, userId, userInfo) => {
    try {
      const event = await fetchEventById(eventId);
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      // Check if already registered
      if (event.registrations?.some((r) => r.userId === userId)) {
        return { success: false, error: 'Already registered' };
      }

      const registrations = event.registrations || [];
      const waitlist = event.waitlist || [];
      const maxCapacity = event.maxCapacity || Infinity;

      const registration = {
        userId,
        userName: userInfo.name,
        userEmail: userInfo.email,
        registeredAt: new Date().toISOString(),
      };

      let updates = {};
      let status = 'registered';

      if (registrations.length < maxCapacity) {
        updates = {
          registrations: [...registrations, registration],
          registrationCount: registrations.length + 1,
        };
      } else {
        // Add to waitlist
        updates = {
          waitlist: [...waitlist, registration],
        };
        status = 'waitlisted';
      }

      await updateDoc(doc(db, 'events', eventId), updates);

      // Update local registrations
      setMyRegistrations((prev) => [...prev, { eventId, status }]);

      return { success: true, status };
    } catch (error) {
      console.error('Error registering for event:', error);
      return { success: false, error: error.message };
    }
  }, [fetchEventById]);

  // Cancel registration
  const cancelRegistration = useCallback(async (eventId, userId) => {
    try {
      const event = await fetchEventById(eventId);
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }

      const registrations = event.registrations?.filter((r) => r.userId !== userId) || [];
      const waitlist = event.waitlist || [];

      let updates = {
        registrations,
        registrationCount: registrations.length,
      };

      // If someone was on waitlist and spot opened, move them to registered
      if (waitlist.length > 0 && registrations.length < (event.maxCapacity || Infinity)) {
        const [nextInLine, ...remainingWaitlist] = waitlist;
        updates = {
          registrations: [...registrations, nextInLine],
          registrationCount: registrations.length + 1,
          waitlist: remainingWaitlist,
        };
      }

      await updateDoc(doc(db, 'events', eventId), updates);

      // Update local registrations
      setMyRegistrations((prev) => prev.filter((r) => r.eventId !== eventId));

      return { success: true };
    } catch (error) {
      console.error('Error cancelling registration:', error);
      return { success: false, error: error.message };
    }
  }, [fetchEventById]);

  // Toggle reminder
  const toggleReminder = useCallback(async (eventId) => {
    const newReminders = { ...reminders };
    
    if (newReminders[eventId]) {
      delete newReminders[eventId];
    } else {
      newReminders[eventId] = true;
    }
    
    await saveReminders(newReminders);
    return !reminders[eventId];
  }, [reminders]);

  // Check if user is registered
  const isRegistered = useCallback((eventId, userId) => {
    const event = events.find((e) => e.id === eventId);
    return event?.registrations?.some((r) => r.userId === userId) || false;
  }, [events]);

  // Check if user is on waitlist
  const isOnWaitlist = useCallback((eventId, userId) => {
    const event = events.find((e) => e.id === eventId);
    return event?.waitlist?.some((r) => r.userId === userId) || false;
  }, [events]);

  // Get events by month for calendar
  const getEventsByMonth = useCallback((year, month) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date) => {
    const dateStr = date.toDateString();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === dateStr;
    });
  }, [events]);

  const value = {
    // State
    events,
    upcomingEvents,
    myRegistrations,
    loading,
    reminders,

    // Actions
    fetchEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    toggleReminder,

    // Helpers
    isRegistered,
    isOnWaitlist,
    getEventsByMonth,
    getEventsForDate,

    // Constants
    categories: EVENT_CATEGORIES,
    statuses: EVENT_STATUS,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
