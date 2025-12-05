// src/screens/AddTripScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '../config';
import CalendarPicker from 'react-native-calendar-picker';

const COLORS = {
  primary: '#0F172A',
  secondary: '#4B5563',
  accent: '#2563EB',
  background: '#F3F4F6', // light, minimal background
  surface: '#FFFFFF',
  text: {
    primary: '#0F172A',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  gradient: {
    start: '#2563EB',
    end: '#1D4ED8',
  },
  success: '#10B981',
  error: '#EF4444',
  border: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.10)',
  lightGray: '#F3F4F6',
};

const HEADER_HEIGHT = 110;

const AddTripScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForDB = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateSelect = (date) => setTempStartDate(date);
  const handleEndDateSelect = (date) => setTempEndDate(date);

  const saveStartDate = () => {
    if (tempStartDate) {
      setStartDate(tempStartDate);
      if (endDate && tempStartDate > endDate) {
        setEndDate(null);
      }
    }
    setShowStartCalendar(false);
  };

  const saveEndDate = () => {
    if (tempEndDate) {
      if (startDate && tempEndDate < startDate) {
        Alert.alert('Invalid date', 'End date must be after start date.');
        return;
      }
      setEndDate(tempEndDate);
    }
    setShowEndCalendar(false);
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return '';
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const handleAddTrip = async () => {
    if (!destination.trim()) {
      Alert.alert('Missing destination', 'Please enter a destination.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Missing dates', 'Please select both start and end dates.');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Invalid date range', 'End date must be after start date.');
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        action: 'add_trip',
        destination: destination.trim(),
        start_date: formatDateForDB(startDate),
        end_date: formatDateForDB(endDate),
        notes: notes.trim(),
      });

      if (response.data.success) {
        Alert.alert('Trip added', 'Your trip has been saved.', [
          {
            text: 'OK',
            onPress: () => {
              setDestination('');
              setStartDate(null);
              setEndDate(null);
              setNotes('');
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Trips');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to add trip.');
      }
    } catch (error) {
      Alert.alert(
        'Connection error',
        'Cannot connect to server. Check:\n1. XAMPP is running\n2. IP address in config.js\n3. Phone & computer on same WiFi'
      );
    }
  };

  const canSave = destination.trim() && startDate && endDate;

  // ---------- QUICK PICK HELPERS ----------
  const setStartQuickOffset = (daysOffset) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + daysOffset);
    setTempStartDate(base);
  };

  const setEndQuickOffsetFromStart = (daysOffset) => {
    if (!startDate && !tempStartDate) return;
    const base = new Date(tempStartDate || startDate);
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + daysOffset);
    setTempEndDate(base);
  };

  const findNextWeekend = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sun ... 6 = Sat
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSat);
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(0, 0, 0, 0);
    setTempStartDate(saturday);
    setTempEndDate(sunday);
  };

  const oneYearFromNow = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Trips');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />

      {/* Gradient header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 8,
            height: HEADER_HEIGHT + insets.top,
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <Text style={styles.backIcon}>{'‹'}</Text>
          </TouchableOpacity>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>New trip</Text>
            <Text style={styles.headerSubtitle}>
              Create a clean overview of your upcoming journey.
            </Text>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_HEIGHT - 8 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* FORM CARD */}
          <View style={styles.formCard}>
            {/* Small eyebrow label */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Trip details</Text>
            </View>

            {/* Destination */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Destination</Text>
                <Text style={styles.required}> *</Text>
              </View>
              <Text style={styles.helperText}>
                Where are you travelling to?
              </Text>
              <View style={styles.textFieldWrapper}>
                <TextInput
                  style={styles.textField}
                  placeholder="e.g., Tokyo, Paris, New York"
                  placeholderTextColor={COLORS.text.light}
                  value={destination}
                  onChangeText={setDestination}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Dates */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Dates</Text>
                <Text style={styles.required}> *</Text>
              </View>
              <Text style={styles.helperText}>
                Choose when this trip starts and ends.
              </Text>

              <View style={styles.dateRow}>
                {/* Start date */}
                <View style={styles.dateColumn}>
                  <View style={styles.subLabelRow}>
                    <Text style={styles.subLabel}>Start date</Text>
                    <Text style={styles.required}> *</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dateField}
                    onPress={() => {
                      setTempStartDate(startDate || new Date());
                      setShowStartCalendar(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={
                        startDate ? styles.dateValueText : styles.datePlaceholder
                      }
                    >
                      {startDate ? formatDate(startDate) : 'Select start date'}
                    </Text>
                    <View style={styles.dateAddBadge}>
                      <Text style={styles.dateAddText}>+</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* End date */}
                <View style={styles.dateColumn}>
                  <View style={styles.subLabelRow}>
                    <Text style={styles.subLabel}>End date</Text>
                    <Text style={styles.required}> *</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.dateField,
                      !startDate && styles.dateFieldDisabled,
                    ]}
                    onPress={() => {
                      if (!startDate) return;
                      setTempEndDate(endDate || startDate);
                      setShowEndCalendar(true);
                    }}
                    activeOpacity={startDate ? 0.9 : 1}
                  >
                    <Text
                      style={[
                        endDate ? styles.dateValueText : styles.datePlaceholder,
                        !startDate && styles.disabledText,
                      ]}
                    >
                      {endDate ? formatDate(endDate) : 'Select end date'}
                    </Text>
                    <View
                      style={[
                        styles.dateAddBadge,
                        !startDate && styles.dateAddBadgeDisabled,
                      ]}
                    >
                      <Text style={styles.dateAddText}>+</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {startDate && endDate && (
                <View style={styles.durationRow}>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationText}>
                      {calculateDuration()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.optional}> (optional)</Text>
              </View>
              <Text style={styles.helperText}>
                Add bookings, reminders, or important details.
              </Text>

              <View style={styles.notesWrapper}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Any notes you want to keep for this trip."
                  placeholderTextColor={COLORS.text.light}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.charCount}>{notes.length}/500</Text>
              </View>
            </View>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBack}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              disabled={!canSave}
              onPress={handleAddTrip}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[COLORS.gradient.start, COLORS.gradient.end]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveText}>Save trip</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Start date calendar */}
      <Modal
        visible={showStartCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartCalendar(false)}
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
                <View>
                  <Text style={styles.modalTitle}>Select start date</Text>
                  <Text style={styles.modalSubtitle}>
                    Pick when your trip begins.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowStartCalendar(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.calendarContent}>
              {/* Selected date summary */}
              <View style={styles.modalInfoRow}>
                <View>
                  <Text style={styles.modalInfoLabel}>Selected</Text>
                  <Text style={styles.modalInfoValue}>
                    {tempStartDate
                      ? formatDate(tempStartDate)
                      : 'No date selected yet'}
                  </Text>
                </View>
                {startDate && (
                  <View style={styles.modalInfoBadge}>
                    <Text style={styles.modalInfoBadgeText}>
                      Current: {formatDate(startDate)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick actions */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickChip}
                  onPress={() => setStartQuickOffset(0)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickChip}
                  onPress={() => setStartQuickOffset(7)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>+ 7 days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickChip}
                  onPress={findNextWeekend}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>Next weekend</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar (no white outline) */}
              <View style={styles.calendarCard}>
                <CalendarPicker
                  onDateChange={handleStartDateSelect}
                  selectedStartDate={tempStartDate}
                  minDate={new Date()}
                  maxDate={endDate || oneYearFromNow()}
                  weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                  selectedDayColor={COLORS.accent}
                  selectedDayTextColor="#FFFFFF"
                  todayBackgroundColor={COLORS.lightGray}
                  todayTextStyle={{ color: COLORS.accent, fontWeight: '600' }}
                  textStyle={{
                    color: COLORS.text.primary,
                    fontSize: 14,
                  }}
                  previousTitle="‹"
                  nextTitle="›"
                  previousTitleStyle={styles.navArrow}
                  nextTitleStyle={styles.navArrow}
                  monthTitleStyle={styles.monthTitle}
                  yearTitleStyle={styles.yearTitle}
                  dayLabelsWrapper={styles.dayLabelsWrapper}
                  restrictMonthNavigation={false}
                  scaleFactor={340}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowStartCalendar(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveStartDate}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.gradient.start, COLORS.gradient.end]}
                  style={styles.modalSaveGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalSaveText}>Select</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End date calendar */}
      <Modal
        visible={showEndCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndCalendar(false)}
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
                <View>
                  <Text style={styles.modalTitle}>Select end date</Text>
                  <Text style={styles.modalSubtitle}>
                    Choose when your trip ends.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEndCalendar(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.calendarContent}>
              {/* Selected date summary */}
              <View style={styles.modalInfoRow}>
                <View>
                  <Text style={styles.modalInfoLabel}>Selected</Text>
                  <Text style={styles.modalInfoValue}>
                    {tempEndDate
                      ? formatDate(tempEndDate)
                      : 'No date selected yet'}
                  </Text>
                </View>
                {endDate && (
                  <View style={styles.modalInfoBadge}>
                    <Text style={styles.modalInfoBadgeText}>
                      Current: {formatDate(endDate)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick actions based on start date */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.quickChip,
                    !startDate && styles.quickChipDisabled,
                  ]}
                  onPress={() => setEndQuickOffsetFromStart(2)}
                  disabled={!startDate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>Weekend trip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickChip,
                    !startDate && styles.quickChipDisabled,
                  ]}
                  onPress={() => setEndQuickOffsetFromStart(6)}
                  disabled={!startDate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>1 week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickChip,
                    !startDate && styles.quickChipDisabled,
                  ]}
                  onPress={() => setEndQuickOffsetFromStart(13)}
                  disabled={!startDate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickChipText}>2 weeks</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar (no white outline) */}
              <View style={styles.calendarCard}>
                <CalendarPicker
                  onDateChange={handleEndDateSelect}
                  selectedStartDate={tempEndDate}
                  minDate={startDate || new Date()}
                  maxDate={oneYearFromNow()}
                  weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                  selectedDayColor={COLORS.success}
                  selectedDayTextColor="#FFFFFF"
                  todayBackgroundColor={COLORS.lightGray}
                  todayTextStyle={{ color: COLORS.success, fontWeight: '600' }}
                  textStyle={{
                    color: COLORS.text.primary,
                    fontSize: 14,
                  }}
                  previousTitle="‹"
                  nextTitle="›"
                  previousTitleStyle={styles.navArrow}
                  nextTitleStyle={styles.navArrow}
                  monthTitleStyle={styles.monthTitle}
                  yearTitleStyle={styles.yearTitle}
                  dayLabelsWrapper={styles.dayLabelsWrapper}
                  restrictMonthNavigation={false}
                  scaleFactor={340}
                />
              </View>

              
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowEndCalendar(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveEndDate}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.gradient.start, COLORS.gradient.end]}
                  style={styles.modalSaveGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalSaveText}>Select</Text>
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
  container: {
    flex: 1,
  },

  /* HEADER */
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(15,23,42,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: COLORS.text.inverse,
    marginTop: -1,
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.inverse,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 19,
  },

  /* CONTENT */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* FORM CARD */
  formCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    marginBottom: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.03)',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  fieldGroup: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.text.secondary,
  },
  required: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
  optional: {
    fontSize: 13,
    color: COLORS.text.light,
    fontWeight: '400',
    textTransform: 'none',
  },
  helperText: {
    fontSize: 12.5,
    color: COLORS.text.light,
    marginBottom: 9,
  },

  textFieldWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  textField: {
    fontSize: 15,
    color: COLORS.text.primary,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  subLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.text.secondary,
  },
  dateField: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldDisabled: {
    opacity: 0.5,
  },
  dateValueText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  datePlaceholder: {
    fontSize: 14,
    color: COLORS.text.light,
  },
  disabledText: {
    color: COLORS.text.light,
  },
  dateAddBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateAddBadgeDisabled: {
    backgroundColor: '#F3F4F6',
  },
  dateAddText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  durationRow: {
    marginTop: 10,
  },
  durationPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },

  notesWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 120,
  },
  notesInput: {
    fontSize: 15,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: COLORS.text.light,
    marginTop: 6,
  },

  /* BUTTONS */
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  saveButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 1,
    shadowRadius: 48,
    elevation: 24,
  },
  modalHeaderGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    color: COLORS.text.inverse,
  },

  calendarContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 480,
  },

  // Calendar wrapper – transparent, no border (no white outline)
  calendarCard: {
    borderRadius: 18,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 12,
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
  modalSaveGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },

  /* CALENDAR EXTRA UI */
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: COLORS.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalInfoValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  modalInfoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  modalInfoBadgeText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },

  quickActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    gap: 10,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5F0FF',
  },
  quickChipDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.accent,
  },

  navArrow: {
    fontSize: 18,
    color: COLORS.primary,
    padding: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  yearTitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  dayLabelsWrapper: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 4,
    paddingBottom: 4,
    padding: 10,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotToday: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  legendDotSelected: {
    backgroundColor: COLORS.accent,
  },
  legendDotSelectedEnd: {
    backgroundColor: COLORS.success,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
});

export default AddTripScreen;
