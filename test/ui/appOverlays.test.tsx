import React from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ConfirmDialog from '../../src/components/ConfirmDialog';
import SuccessPopup from '../../src/components/SuccessPopup';
import { AppBottomSheet } from '../../src/components/ui/app-bottom-sheet';
import {
  AppToastProvider,
  useAppToast,
} from '../../src/components/ui/app-toast';

const ToastHarness = ({ tone = 'success' }: { tone?: 'success' | 'error' }) => {
  const { showToast } = useAppToast();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => showToast({ message: `${tone} message`, tone })}
    >
      <Text>Show {tone}</Text>
    </Pressable>
  );
};

describe('shared app overlays', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders an accessible destructive confirmation and invokes its actions', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        visible
        title="Delete post?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText('Delete post?. This cannot be undone.')).toBeTruthy();
    fireEvent.press(screen.getByText('Delete'));
    fireEvent.press(screen.getByText('Cancel'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('locks confirmation actions while processing', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        visible
        processing
        message="Logging you out…"
        confirmLabel="Log out"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('uses the bottom-sheet close contract without hiding its content from assistive tech', () => {
    const onClose = jest.fn();

    render(
      <AppBottomSheet visible onRequestClose={onClose} title="Choose a source">
        <View>
          <Text>Choose from gallery</Text>
        </View>
      </AppBottomSheet>,
    );

    expect(screen.getByLabelText('Choose a source')).toBeTruthy();
    expect(screen.getByText('Choose from gallery')).toBeTruthy();
    fireEvent.press(screen.UNSAFE_getByProps({ testID: 'app-bottom-sheet-backdrop' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses success toasts after four seconds and keeps error toasts persistent', async () => {
    const { rerender } = render(
      <AppToastProvider>
        <ToastHarness />
      </AppToastProvider>,
    );

    await act(async () => undefined);
    fireEvent.press(screen.getByText('Show success'));
    expect(screen.getByText('success message')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(4200);
    });
    expect(screen.queryByText('success message')).toBeNull();

    rerender(
      <AppToastProvider>
        <ToastHarness tone="error" />
      </AppToastProvider>,
    );
    fireEvent.press(screen.getByText('Show error'));

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('error message')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Dismiss notification'));
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByText('error message')).toBeNull();
  });

  it('converts the legacy success popup into a toast without delaying dismissal', async () => {
    const onDismiss = jest.fn();

    render(
      <AppToastProvider>
        <SuccessPopup visible message="Saved" onDismiss={onDismiss} />
      </AppToastProvider>,
    );

    await act(async () => undefined);

    expect(screen.getByText('Saved')).toBeTruthy();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
