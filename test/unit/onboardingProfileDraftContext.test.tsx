import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { fireEvent, render, screen } from '../utils/render';

import {
  OnboardingProfileDraftProvider,
  useOnboardingProfileDraft,
} from '../../src/contexts/OnboardingProfileDraftContext';
import type { CompressedImage } from '../../src/utils/imageCompression';

const fakeImage: CompressedImage = {
  uri: 'draft-avatar://image',
  width: 100,
  height: 100,
  size: 100,
  mimeType: 'image/jpeg',
  metadata: {
    originalSize: 100,
    compressedSize: 100,
    compressionRatio: 1,
    iterations: 0,
    quality: 1,
    resized: false,
    targetBytes: 100,
  },
};

const DraftEditor = () => {
  const {
    bio,
    setBio,
    instagram,
    setInstagram,
    profileImage,
    setProfileImage,
    clearDraft,
  } = useOnboardingProfileDraft();

  return (
    <>
      <TextInput accessibilityLabel="Bio draft" value={bio} onChangeText={setBio} />
      <TextInput
        accessibilityLabel="Instagram draft"
        value={instagram}
        onChangeText={setInstagram}
      />
      <Text>{profileImage?.uri ?? 'no draft image'}</Text>
      <Pressable accessibilityRole="button" onPress={() => setProfileImage(fakeImage)}>
        <Text>Select draft image</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={clearDraft}>
        <Text>Clear draft</Text>
      </Pressable>
    </>
  );
};

const Harness = () => {
  const [showEditor, setShowEditor] = useState(true);

  return (
    <OnboardingProfileDraftProvider>
      <Pressable accessibilityRole="button" onPress={() => setShowEditor((value) => !value)}>
        <Text>Toggle route</Text>
      </Pressable>
      {showEditor ? <DraftEditor /> : <Text>Profile basics route</Text>}
    </OnboardingProfileDraftProvider>
  );
};

describe('OnboardingProfileDraftProvider', () => {
  it('keeps optional profile draft while onboarding child routes unmount', () => {
    render(<Harness />);

    fireEvent.changeText(screen.getByLabelText('Bio draft'), 'hello radar');
    fireEvent.changeText(screen.getByLabelText('Instagram draft'), 'alex');
    fireEvent.press(screen.getByRole('button', { name: 'Select draft image' }));

    fireEvent.press(screen.getByRole('button', { name: 'Toggle route' }));
    expect(screen.getByText('Profile basics route')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Toggle route' }));
    expect(screen.getByLabelText('Bio draft').props.value).toBe('hello radar');
    expect(screen.getByLabelText('Instagram draft').props.value).toBe('alex');
    expect(screen.getByText('draft-avatar://image')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Clear draft' }));
    expect(screen.getByLabelText('Bio draft').props.value).toBe('');
    expect(screen.getByLabelText('Instagram draft').props.value).toBe('');
    expect(screen.getByText('no draft image')).toBeTruthy();
  });
});
