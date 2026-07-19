import { render, screen } from '../utils/render';

import IndexScreen from '../../app/index';

describe('root launch fallback', () => {
  it('shows one non-interactive, accessible loading state without the wordmark', () => {
    render(<IndexScreen />);

    expect(screen.getByText('Getting things ready…')).toBeTruthy();
    expect(screen.getByText('We’ll take you to your page as soon as everything is ready.')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Getting things ready… We’ll take you to your page as soon as everything is ready.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Zenlit')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
