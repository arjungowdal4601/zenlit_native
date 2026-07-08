import {
  canSubmitProfileBasics,
  getProfileBasicsFormErrors,
} from '../../src/utils/profileBasicsForm';

describe('profile basics form validation', () => {
  it('returns a visible DOB error when date of birth is missing', () => {
    const errors = getProfileBasicsFormErrors({
      displayName: 'Alex Johnson',
      username: 'alexqa',
      dob: '',
      gender: 'Others',
    });

    expect(errors).toEqual({
      displayName: '',
      username: '',
      dob: 'Date of birth is required',
      gender: '',
    });
  });

  it('does not allow submit until username is confirmed available', () => {
    expect(
      canSubmitProfileBasics({
        displayName: 'Alex Johnson',
        username: 'alexqa',
        dob: '1998-04-12',
        gender: 'Others',
        usernameAvailable: null,
        isCheckingUsername: false,
      }),
    ).toBe(false);
  });
});
