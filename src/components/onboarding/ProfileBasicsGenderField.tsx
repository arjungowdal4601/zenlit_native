import type { Dispatch, SetStateAction } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GENDERS, type GenderOption } from '../../hooks/useProfileBasicsOnboarding';
import { styles } from '../../styles/profileBasics.styles';
import type { ProfileBasicsFormErrors } from '../../utils/profileBasicsForm';

type ProfileBasicsGenderFieldProps = {
  error: string;
  gender: GenderOption | '';
  setErrors: Dispatch<SetStateAction<ProfileBasicsFormErrors>>;
  setGender: (value: GenderOption) => void;
};

export const ProfileBasicsGenderField = ({
  error,
  gender,
  setErrors,
  setGender,
}: ProfileBasicsGenderFieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>Gender</Text>
    <View style={styles.genderRow}>
      {GENDERS.map((option) => {
        const isSelected = option === gender;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            onPress={() => {
              setGender(option);
              if (error) setErrors((next) => ({ ...next, gender: '' }));
            }}
            style={[styles.genderPill, isSelected ? styles.genderPillActive : null]}
          >
            <Text style={[styles.genderLabel, isSelected ? styles.genderLabelActive : null]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);
