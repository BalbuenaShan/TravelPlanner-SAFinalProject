import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#2563EB',
  secondary: '#4B5563',
  accent: '#2563EB',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  gradient: {
    start: '#2563EB',
    end: 'rgba(23, 100, 255, 1)',
  },
  border: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.06)',
  error: '#EF4444',
  success: '#10B981',
};

const HEADER_HEIGHT = 120;

const TripDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tripId, startDate: startParam, endDate: endParam } = route.params || {};

  const [activities, setActivities] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);

  const [newActivity, setNewActivity] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editActivityName, setEditActivityName] = useState('');

  // ---------- DATE / DAY LOGIC ----------
  const tripStartDate = startParam ? new Date(startParam) : null;
  const tripEndDate = endParam ? new Date(endParam) : null;

  const totalDays = useMemo(() => {
    if (!tripStartDate || !tripEndDate || isNaN(tripStartDate) || isNaN(tripEndDate)) {
      return 5; // fallback
    }
    const diffTime = Math.abs(tripEndDate - tripStartDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), 30);
  }, [tripStartDate, tripEndDate]);

  const dayItems = useMemo(() => {
    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      const index = i + 1;
      let label = `Day ${index}`;
      if (tripStartDate && !isNaN(tripStartDate)) {
        const d = new Date(tripStartDate);
        d.setDate(d.getDate() + i);
        const pretty = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        label = `Day ${index} • ${pretty}`;
      }
      arr.push({ index, label });
    }
    return arr;
  }, [totalDays, tripStartDate]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?action=get_activities&trip_id=${tripId}`
      );
      setActivities(response.data || []);
    } catch (error) {
      console.log('Error loading activities', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const toggleActivity = async (activityId, currentDone) => {
    try {
      await axios.put(API_URL, {
        action: 'toggle_activity',
        activity_id: activityId,
        is_done: currentDone ? 0 : 1,
      });
      fetchActivities();
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity status.');
    }
  };

  const addActivity = async () => {
    if (!newActivity.trim()) {
      Alert.alert('Missing name', 'Please enter an activity name.');
      return;
    }

    try {
      await axios.post(API_URL, {
        action: 'add_activity',
        trip_id: tripId,
        activity_name: newActivity.trim(),
        day_number: selectedDay,
      });
      setNewActivity('');
      setShowAddModal(false);
      fetchActivities();
    } catch (error) {
      Alert.alert('Error', 'Failed to add activity.');
    }
  };

  const openEditModal = (activity) => {
    setEditingActivity(activity);
    setEditActivityName(activity.activity_name);
    setEditModalVisible(true);
  };

  const updateActivity = async () => {
    if (!editActivityName.trim()) {
      Alert.alert('Missing name', 'Please enter an activity name.');
      return;
    }

    try {
      await axios.put(API_URL, {
        action: 'update_activity',
        activity_id: editingActivity.id,
        activity_name: editActivityName.trim(),
      });
      setEditModalVisible(false);
      setEditingActivity(null);
      setEditActivityName('');
      fetchActivities();
    } catch (error) {
      Alert.alert('Error', 'Failed to update activity.');
    }
  };

  const confirmDeleteActivity = (activityId) => {
    Alert.alert('Delete activity', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteActivity(activityId),
      },
    ]);
  };

  const deleteActivity = async (activityId) => {
    try {
      await axios.delete(API_URL, {
        data: {
          action: 'delete_activity',
          activity_id: activityId,
        },
      });
      fetchActivities();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete activity.');
    }
  };

  const filteredActivities = activities.filter(
    (a) => a.day_number === selectedDay
  );

  const completedCount = filteredActivities.filter((a) => a.is_done).length;
  const totalForDay = filteredActivities.length;

  const renderActivity = ({ item }) => {
    const isDone = !!item.is_done;

    return (
      <View style={styles.activityCard}>
        <TouchableOpacity
          style={styles.activityLeft}
          onPress={() => toggleActivity(item.id, isDone)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxBox,
              isDone && styles.checkboxBoxDone,
            ]}
          >
            {isDone && <View style={styles.checkboxInner} />}
          </View>
          <Text
            style={[
              styles.activityText,
              isDone && styles.doneText,
            ]}
            numberOfLines={2}
          >
            {item.activity_name}
          </Text>
        </TouchableOpacity>

        <View style={styles.activityActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDeleteActivity(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const emptyTitle = `No activities for Day ${selectedDay}`;
  const emptySubtitle = 'Add activities to organize your plans for this day.';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['left', 'right', 'bottom']}  // ← DO NOT include "top"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER – gradient goes under status bar */}
      <View
        style={[
          styles.headerContainer,
          {
            height: HEADER_HEIGHT + insets.top,
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gradient.start, COLORS.gradient.end]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View
          style={[
            styles.headerTopRow,
            { paddingTop: insets.top + 8 }, // pad content away from notch
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Trips');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Trip activities</Text>
            <Text style={styles.headerSubtitle}>
              Plan what you’ll do on each day of this trip.
            </Text>
          </View>
        </View>
      </View>

      {/* CONTENT (no big outer card) */}
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.cardContainer}>
            {/* Day selector row */}
            <View style={styles.daySelectorHeader}>
              <Text style={styles.sectionLabel}>Days</Text>
              {totalForDay > 0 && (
                <Text style={styles.progressText}>
                  {completedCount}/{totalForDay} done
                </Text>
              )}
            </View>

            <View style={styles.dayPillsRow}>
              {dayItems.map((dayObj) => {
                const isActive = selectedDay === dayObj.index;
                return (
                  <TouchableOpacity
                    key={dayObj.index}
                    style={[
                      styles.dayPill,
                      isActive && styles.dayPillActive,
                    ]}
                    onPress={() => setSelectedDay(dayObj.index)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        isActive && styles.dayPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {dayObj.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Activities list */}
            <FlatList
              data={filteredActivities}
              renderItem={renderActivity}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle} />
                  <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                  <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
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
      </View>

      {/* Add Activity Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
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
                <Text style={styles.modalTitle}>Add activity</Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Day</Text>
              <View style={styles.dayChipRow}>
                {dayItems.map((d) => {
                  const isActive = selectedDay === d.index;
                  return (
                    <TouchableOpacity
                      key={d.index}
                      style={[
                        styles.dayChip,
                        isActive && styles.dayChipActive,
                      ]}
                      onPress={() => setSelectedDay(d.index)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          isActive && styles.dayChipTextActive,
                        ]}
                      >
                        {d.index}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalLabel}>Activity name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., City tour, Try local food"
                placeholderTextColor={COLORS.text.light}
                value={newActivity}
                onChangeText={setNewActivity}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={addActivity}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>Add activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Activity Modal */}
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
                <Text style={styles.modalTitle}>Edit activity</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingActivity(null);
                    setEditActivityName('');
                  }}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Activity name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Update activity name"
                placeholderTextColor={COLORS.text.light}
                value={editActivityName}
                onChangeText={setEditActivityName}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingActivity(null);
                  setEditActivityName('');
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={updateActivity}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>Save changes</Text>
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
  container: {
    flex: 1,
  },

  /* HEADER – aligned with TripsScreen */
  headerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: COLORS.text.inverse,
    marginTop: -1,
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
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 19,
  },

  /* CONTENT – no big card */
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cardContainer: {
    flex: 1,
    // no background, border, or shadow – flat like TripsScreen
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: COLORS.text.secondary,
  },
  daySelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.light,
  },

  dayPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
  },
  dayPillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: COLORS.accent,
  },
  dayPillText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  dayPillTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },

  listContent: {
    paddingTop: 8,
    paddingBottom: 80,
  },

  /* ACTIVITY CARD */
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxDone: {
    borderColor: COLORS.accent,
    backgroundColor: '#DBEAFE',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: COLORS.text.light,
  },
  activityActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  editText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
    marginRight: 10,
  },
  deleteText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#E5EDFF',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 26,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
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
    fontSize: 30,
    color: COLORS.text.inverse,
    fontWeight: '300',
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 18,
  },
  modalHeaderGradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    color: COLORS.text.inverse,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  dayChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 6,
  },
  dayChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: COLORS.accent,
  },
  dayChipText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  dayChipTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: '#F9FAFB',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: '#F9FAFB',
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.accent,
  },
  modalCancelText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  modalPrimaryText: {
    fontSize: 14,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
});

export default TripDetailsScreen;
