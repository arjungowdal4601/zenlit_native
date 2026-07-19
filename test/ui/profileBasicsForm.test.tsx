import React from 'react';

import { render, screen } from '../utils/render';
import { ProfileBasicsForm } from '../../src/components/onboarding/ProfileBasicsForm';

const makeFormProps = (overrides: Record<string, unknown> = {}) => ({
  displayName: 'Alex Johnson',
  dob: '1998-04-12',
  errors: {
    displayName: '',
    username: '',
    dob: '',
    gender: '',
  },
  gender: 'Others',
  handleContinue: jest.fn(),
  handleDobWebChange: jest.fn(),
  handleSuggestionSelect: jest.fn(),
  handleUsernameChange: jest.fn(),
  isCheckingUsername: false,
  isFilled: true,
  isLoadingProfile: false,
  isSubmitting: false,
  isWebDateFocused: false,
  maxDobInputValue: '2013-01-01',
  openDobPicker: jest.fn(),
  saveError: '',
  setDisplayName: jest.fn(),
  setErrors: jest.fn(),
  setGender: jest.fn(),
  setIsWebDateFocused: jest.fn(),
  username: 'alex',
  usernameAvailable: true,
  usernameSuggestions: [],
  webDateInputRef: { current: null },
  ...overrides,
});

describe('ProfileBasicsForm', () => {
  it('keeps the setup heading concise', () => {
    render(<ProfileBasicsForm {...makeFormProps() as any} />);

    expect(screen.getByText('Set up your presence')).toBeTruthy();
    expect(
      screen.queryByText('These basics unlock Radar and help nearby people recognize the real you.'),
    ).toBeNull();
  });

  it('does not show username success while a duplicate username save error is visible', () => {
    render(
      <ProfileBasicsForm
        {...makeFormProps({
          saveError: 'That username is already taken. Please choose another.',
          usernameAvailable: true,
        }) as any}
      />,
    );

    expect(screen.queryByText('Username is available!')).toBeNull();
    expect(screen.getByText('That username is already taken. Please choose another.')).toBeTruthy();
  });
});
