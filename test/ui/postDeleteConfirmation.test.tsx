import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../src/components/DropdownMenu', () => ({
  __esModule: true,
  default: ({ visible, items }: { visible: boolean; items: Array<{ label: string; onPress: () => void }> }) => {
    const ReactRuntime = require('react');
    const { Pressable, Text } = require('react-native');

    return visible
      ? ReactRuntime.createElement(
          Pressable,
          {
            accessibilityRole: 'button',
            accessibilityLabel: items[0].label,
            onPress: items[0].onPress,
          },
          ReactRuntime.createElement(Text, null, items[0].label),
        )
      : null;
  },
}));

jest.mock('../../src/components/ConfirmDialog', () => ({
  __esModule: true,
  default: ({
    visible,
    onConfirm,
  }: {
    visible: boolean;
    processing?: boolean;
    onConfirm: () => void;
  }) => {
    const ReactRuntime = require('react');
    const { Pressable, Text } = require('react-native');

    return visible
      ? ReactRuntime.createElement(
          Pressable,
          {
            accessibilityRole: 'button',
            accessibilityLabel: 'Confirm post deletion',
            onPress: onConfirm,
          },
          ReactRuntime.createElement(Text, null, 'Confirm deletion'),
        )
      : null;
  },
}));

import { Post } from '../../src/components/Post';

describe('Post delete confirmation', () => {
  it('executes deletion only once when confirmation is pressed rapidly', async () => {
    let resolveDelete: () => void = () => undefined;
    const pendingDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    const onDelete = jest.fn(() => pendingDelete);

    render(
      <Post
        post={{
          id: 'post-1',
          author: { name: 'Arjun', username: 'arjun' },
          content: 'Hello Zenlit',
        }}
        showMenu
        showSocialLinks={false}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(screen.getByLabelText('Post options'));
    fireEvent.press(screen.getByLabelText('Delete'));

    const confirm = screen.getByLabelText('Confirm post deletion');
    fireEvent.press(confirm);
    fireEvent.press(confirm);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('post-1');

    await act(async () => {
      resolveDelete();
      await pendingDelete;
    });
  });
});
