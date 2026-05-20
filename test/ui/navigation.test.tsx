import React from 'react';
import { fireEvent, render, screen } from '../utils/render';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  usePathname: () => '/radar',
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../src/contexts/MessagingContext', () => ({
  useMessaging: () => ({ totalUnread: 0 }),
}));

import Navigation from '../../src/components/Navigation';

describe('bottom navigation', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders the five main app tabs with user-facing labels', () => {
    render(<Navigation activePath="/radar" />);

    expect(screen.getByLabelText('Radar')).toBeTruthy();
    expect(screen.getByLabelText('Feed')).toBeTruthy();
    expect(screen.getByLabelText('Create')).toBeTruthy();
    expect(screen.getByLabelText('Chat')).toBeTruthy();
    expect(screen.getByLabelText('Profile')).toBeTruthy();
  });

  it('routes with replace when another tab is pressed', () => {
    render(<Navigation activePath="/radar" />);

    fireEvent.press(screen.getByLabelText('Feed'));

    expect(mockReplace).toHaveBeenCalledWith('/feed');
  });
});
