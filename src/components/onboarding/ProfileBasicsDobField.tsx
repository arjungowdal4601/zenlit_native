import type { CSSProperties, RefObject } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { styles } from '../../styles/profileBasics.styles';
import { theme } from '../../styles/theme';

const WEB_DATE_INPUT_OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  borderRadius: 16,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
};

type ProfileBasicsDobFieldProps = {
  closeIosPicker: () => void;
  dob: string;
  error: string;
  handleDobWebChange: (value: string) => void;
  handleIosDobChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  isWebDateFocused: boolean;
  maxDobDate: Date;
  maxDobInputValue: string;
  openDobPicker: () => void;
  resolvedDobDate: Date;
  setIsWebDateFocused: (value: boolean) => void;
  showIosPicker: boolean;
  webDateInputRef: RefObject<HTMLInputElement | null>;
};

export const ProfileBasicsDobField = ({
  closeIosPicker,
  dob,
  error,
  handleDobWebChange,
  handleIosDobChange,
  isWebDateFocused,
  maxDobDate,
  maxDobInputValue,
  openDobPicker,
  resolvedDobDate,
  setIsWebDateFocused,
  showIosPicker,
  webDateInputRef,
}: ProfileBasicsDobFieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>Date of Birth</Text>
    {Platform.OS === 'web' ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select date of birth"
        onPress={() => {
          const element = webDateInputRef.current;
          if (!element) return;
          const anyElement = element as unknown as { showPicker?: () => void; focus: () => void };
          try {
            if (typeof anyElement.showPicker === 'function') anyElement.showPicker();
            else element.focus();
          } catch {
            element.focus();
          }
        }}
        style={({ pressed }) => [
          styles.pickerField,
          isWebDateFocused ? styles.pickerFieldFocused : null,
          pressed ? styles.pickerFieldPressed : null,
        ]}
      >
        <View style={styles.pickerRow}>
          <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
            {dob || 'YYYY-MM-DD'}
          </Text>
          <Feather name="calendar" size={24} color={theme.prism.colors.text} style={styles.pickerIcon} />
        </View>
        <input
          ref={webDateInputRef}
          type="date"
          value={dob}
          onChange={(event) => handleDobWebChange(event.target.value)}
          max={maxDobInputValue}
          style={WEB_DATE_INPUT_OVERLAY_STYLE}
          onFocus={() => setIsWebDateFocused(true)}
          onBlur={() => setIsWebDateFocused(false)}
          aria-label="Date of Birth"
        />
      </Pressable>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select date of birth"
        onPress={openDobPicker}
        style={({ pressed }) => [
          styles.pickerField,
          pressed ? styles.pickerFieldPressed : null,
        ]}
      >
        <View style={styles.pickerRow}>
          <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
            {dob || 'YYYY-MM-DD'}
          </Text>
          <Feather name="calendar" size={24} color={theme.prism.colors.text} style={styles.pickerIcon} />
        </View>
      </Pressable>
    )}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}

    {Platform.OS === 'ios' ? (
      <Modal animationType="fade" transparent visible={showIosPicker} onRequestClose={closeIosPicker}>
        <View style={styles.iosPickerOverlay}>
          <Pressable style={styles.iosBackdrop} onPress={closeIosPicker} />
          <View style={styles.iosPickerSheet}>
            <View style={styles.iosPickerToolbar}>
              <Pressable accessibilityRole="button" onPress={closeIosPicker}>
                <Text style={styles.iosPickerAction}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              mode="date"
              display="spinner"
              value={resolvedDobDate}
              onChange={handleIosDobChange}
              maximumDate={maxDobDate}
              themeVariant="dark"
              style={styles.iosPicker}
            />
          </View>
        </View>
      </Modal>
    ) : null}
  </View>
);
