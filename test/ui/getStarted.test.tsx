import { fireEvent, render, screen } from '../utils/render';

const mockReplace = jest.fn();
const mockPersistHasSeenGetStarted = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../../src/utils/getStartedPreference', () => ({
  persistHasSeenGetStarted: () => mockPersistHasSeenGetStarted(),
}));

import GetStartedScreen from '../../app/index';

describe('Get Started screen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPersistHasSeenGetStarted.mockClear();
  });

  it('shows the minimal Zenlit entry copy and CTA', () => {
    render(<GetStartedScreen />);

    expect(screen.getByText('Zenlit')).toBeTruthy();
    expect(screen.getByText('Connect with people around you.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy();
  });

  it('persists the entry state and routes to auth when CTA is pressed', () => {
    render(<GetStartedScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Get Started' }));

    expect(mockPersistHasSeenGetStarted).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });
});
