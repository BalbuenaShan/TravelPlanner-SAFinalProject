import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../config';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HEADER_MAX_HEIGHT = 210;
const HEADER_MIN_HEIGHT = 190; // keep in sync with list marginTop

const COLORS = {
  primary: '#2563EB',
  secondary: '#4B5563',
  accent: '#2563EB',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: {
    primary: '#2563EB',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  gradient: {
    start: '#2563EB',
    end: 'rgba(23, 100, 255, 1)',
  },
  success: '#16A34A',
  error: '#EF4444',
  border: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.06)',
};

const TripsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDestination, setEditDestination] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef(new Map());

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.97],
    extrapolate: 'clamp',
  });

  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}?action=get_trips`);
      setTrips(response.data || []);
    } catch (error) {
      Alert.alert('Connection error', 'Unable to connect to the server.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchTrips);
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const deleteTrip = async (tripId) => {
    Alert.alert('Delete trip', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(API_URL, {
              data: { action: 'delete_trip', trip_id: tripId },
            });
            fetchTrips();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete trip.');
          }
        },
      },
    ]);
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setEditDestination(trip.destination);
    setEditStartDate(trip.start_date);
    setEditEndDate(trip.end_date);
    setEditNotes(trip.notes || '');
    setEditModalVisible(true);
  };

  const handleEditTrip = async () => {
    if (!editDestination.trim()) {
      Alert.alert('Error', 'Please enter a destination.');
      return;
    }
    if (!editStartDate || !editEndDate) {
      Alert.alert('Error', 'Please enter both dates.');
      return;
    }

    try {
      const response = await axios.put(API_URL, {
        action: 'update_trip',
        trip_id: editingTrip.id,
        destination: editDestination.trim(),
        start_date: editStartDate,
        end_date: editEndDate,
        notes: editNotes.trim(),
      });

      if (response.data.success) {
        setEditModalVisible(false);
        fetchTrips();
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update trip.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update trip.');
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateTripDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const getStatusColor = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now > end) return COLORS.text.light;
    if (now >= start && now <= end) return COLORS.success;
    if (now < start) return COLORS.accent;
    return COLORS.accent;
  };

  const getStatusLabel = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now > end) return 'Completed';
    if (now >= start && now <= end) return 'Ongoing';
    if (now < start) return 'Upcoming';
    return 'Upcoming';
  };

  const renderRightActions = (progress, dragX, item) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipePanel, styles.editPanel]}
          activeOpacity={0.85}
          onPress={() => {
            swipeableRefs.current.get(item.id)?.close();
            openEditModal(item);
          }}
        >
          <Text style={styles.swipeText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipePanel, styles.deletePanel]}
          activeOpacity={0.85}
          onPress={() => {
            swipeableRefs.current.get(item.id)?.close();
            deleteTrip(item.id);
          }}
        >
          <Text style={styles.swipeText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTrip = ({ item }) => {
    const statusColor = getStatusColor(item.start_date, item.end_date);
    const duration = calculateTripDuration(item.start_date, item.end_date);
    const status = getStatusLabel(item.start_date, item.end_date);

    const cardScale = scrollY.interpolate({
      inputRange: [0, 80],
      outputRange: [1, 0.99],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item)
          }
          overshootRight={false}
          friction={2}
          containerStyle={styles.swipeContainer}
        >
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() =>
              navigation.navigate('TripDetails', { tripId: item.id })
            }
            activeOpacity={0.95}
          >
            <View
              style={[styles.statusStrip, { backgroundColor: statusColor }]}
            />

            <View style={styles.tripContent}>
              <View style={styles.tripHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.destination} numberOfLines={1}>
                    {item.destination}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text style={styles.statusLabel}>{status}</Text>
                  </View>
                </View>

                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>{duration}</Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Departure</Text>
                  <Text style={styles.dateValue}>
                    {formatFullDate(item.start_date)}
                  </Text>
                </View>

                <View style={styles.dateDivider} />

                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Return</Text>
                  <Text style={styles.dateValue}>
                    {formatFullDate(item.end_date)}
                  </Text>
                </View>
              </View>

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.secondaryButtonText}>Edit details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() =>
                    navigation.navigate('TripDetails', { tripId: item.id })
                  }
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    View itinerary
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  const upcomingCount = trips.filter(
    (t) => getStatusLabel(t.start_date, t.end_date) === 'Upcoming'
  ).length;
  const ongoingCount = trips.filter(
    (t) => getStatusLabel(t.start_date, t.end_date) === 'Ongoing'
  ).length;
  const completedCount = trips.filter(
    (t) => getStatusLabel(t.start_date, t.end_date) === 'Completed'
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />

      <Animated.View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 8,
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gradient.start, COLORS.gradient.end]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.headerTitle}>Trips</Text>
            <Text style={styles.headerSubtitle}>
              Plan, track, and revisit your journeys.
            </Text>
          </View>

        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{ongoingCount}</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first itinerary and keep your plans organized in one place.
            </Text>
            <TouchableOpacity
              style={styles.emptyPrimaryButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AddTrip')}
            >
              <Text style={styles.emptyPrimaryText}>Create a trip</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTrip')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[COLORS.gradient.start, COLORS.gradient.end]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.gradient.start, COLORS.gradient.end]}
              style={styles.modalHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit trip</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Destination</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Where are you going?"
                    placeholderTextColor={COLORS.text.light}
                    value={editDestination}
                    onChangeText={setEditDestination}
                  />
                </View>

                <View style={styles.dateRowModal}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Start date</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.text.light}
                      value={editStartDate}
                      onChangeText={setEditStartDate}
                    />
                  </View>

                  <View style={{ width: 10 }} />

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>End date</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.text.light}
                      value={editEndDate}
                      onChangeText={setEditEndDate}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="Add notes, reminders, or details."
                    placeholderTextColor={COLORS.text.light}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    multiline
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleEditTrip}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.gradient.start, COLORS.gradient.end]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalSaveText}>Save changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // HEADER
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text.inverse,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  newTripButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  newTripText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.inverse,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,42,0.30)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.inverse,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.80)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginHorizontal: 8,
  },

  // LIST
  list: {
    flex: 1,
    marginTop: HEADER_MIN_HEIGHT,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 110,
  },

  swipeContainer: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statusStrip: {
    width: 3,
    height: '100%',
  },
  tripContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  destination: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },

  dateRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  dateDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },

  notesBox: {
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 13,
    color: COLORS.text.primary,
  },

  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  primaryButtonText: {
    fontSize: 13,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },

  // SWIPE ACTIONS
  swipeActions: {
    flexDirection: 'row',
    width: 170,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 6,
  },
  swipePanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPanel: {
    backgroundColor: '#111827',
  },
  deletePanel: {
    backgroundColor: COLORS.error,
  },
  swipeText: {
    color: COLORS.text.inverse,
    fontSize: 13,
    fontWeight: '600',
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyPrimaryButton: {
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  emptyPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: COLORS.text.inverse,
    fontSize: 30,
    fontWeight: '300',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 18,
  },
  modalHeaderGradient: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: COLORS.text.inverse,
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: '#F9FAFB',
  },
  dateRowModal: {
    flexDirection: 'row',
  },
  modalTextArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    height: 50,
  },
  modalCancelButton: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  modalSaveButton: {
    overflow: 'hidden',
  },
  modalCancelText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
});

export default TripsScreen;
