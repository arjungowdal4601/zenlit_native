import React from 'react';

import { render, screen } from '../utils/render';
import { ProfileBasicsForm } from '../../src/components/onboarding/ProfileBasicsForm';

const makeFormProps = (overrides: Record<string, unknown> = {}) => ({
  closeIosPicker: jest.fn(),
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
  handleIosDobChange: jest.fn(),
  handleSuggestionSelect: jest.fn(),
  handleUsernameChange: jest.fn(),
  isCheckingUsername: false,
  isFilled: true,
  isLoadingProfile: false,
  isSubmitting: false,
  isWebDateFocused: false,
  maxDobDate: new Date('2013-01-01T00:00:00.000Z'),
  maxDobInputValue: '2013-01-01',
  openDobPicker: jest.fn(),
  resolvedDobDate: new Date('1998-04-12T00:00:00.000Z'),
  saveError: '',
  setDisplayName: jest.fn(),
  setErrors: jest.fn(),
  setGender: jest.fn(),
  setIsWebDateFocused: jest.fn(),
  showIosPicker: false,
  username: 'alex',
  usernameAvailable: true,
  usernameSuggestions: [],
  webDateInputRef: { current: null },
  ...overrides,
});

describe('ProfileBasicsForm', () => {
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
