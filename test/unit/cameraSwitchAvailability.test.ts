import {
  getCameraSwitchAvailability,
  isMobileWebCameraDevice,
} from '../../src/utils/camera-switch-availability';

type TestNavigator = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

const videoInput = (deviceId: string) =>
  ({
    deviceId,
    groupId: 'camera-group',
    kind: 'videoinput',
    label: `Camera ${deviceId}`,
    toJSON: () => ({}),
  }) as MediaDeviceInfo;

const audioInput = {
  deviceId: 'microphone',
  groupId: 'audio-group',
  kind: 'audioinput',
  label: 'Microphone',
  toJSON: () => ({}),
} as MediaDeviceInfo;

const makeNavigator = ({
  userAgent,
  maxTouchPoints = 0,
  mobileHint,
  enumerateDevices,
}: {
  userAgent: string;
  maxTouchPoints?: number;
  mobileHint?: boolean;
  enumerateDevices: jest.Mock<Promise<MediaDeviceInfo[]>, []>;
}) =>
  ({
    userAgent,
    maxTouchPoints,
    ...(mobileHint === undefined ? {} : { userAgentData: { mobile: mobileHint } }),
    mediaDevices: { enumerateDevices },
  }) as unknown as TestNavigator;

describe('camera switch availability', () => {
  it('treats a MacBook-like web browser as desktop and does not enumerate its cameras', async () => {
    const enumerateDevices = jest
      .fn<Promise<MediaDeviceInfo[]>, []>()
      .mockResolvedValue([videoInput('facetime'), videoInput('continuity')]);
    const runtimeNavigator = makeNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      maxTouchPoints: 0,
      enumerateDevices,
    });

    await expect(
      getCameraSwitchAvailability('web', runtimeNavigator),
    ).resolves.toBe(false);
    expect(enumerateDevices).not.toHaveBeenCalled();
  });

  it('shows switching for mobile web only when two video inputs are available', async () => {
    const enumerateDevices = jest
      .fn<Promise<MediaDeviceInfo[]>, []>()
      .mockResolvedValue([
        videoInput('front'),
        audioInput,
        videoInput('rear'),
      ]);
    const runtimeNavigator = makeNavigator({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1',
      maxTouchPoints: 5,
      enumerateDevices,
    });

    expect(isMobileWebCameraDevice(runtimeNavigator)).toBe(true);
    await expect(
      getCameraSwitchAvailability('web', runtimeNavigator),
    ).resolves.toBe(true);
    expect(enumerateDevices).toHaveBeenCalledTimes(1);
  });

  it('hides switching for mobile web when only one video input exists', async () => {
    const enumerateDevices = jest
      .fn<Promise<MediaDeviceInfo[]>, []>()
      .mockResolvedValue([videoInput('front'), audioInput]);
    const runtimeNavigator = makeNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Mobile Safari/537.36',
      maxTouchPoints: 5,
      enumerateDevices,
    });

    await expect(
      getCameraSwitchAvailability('web', runtimeNavigator),
    ).resolves.toBe(false);
    expect(enumerateDevices).toHaveBeenCalledTimes(1);
  });

  it('supports iPadOS desktop user agents and explicit browser mobile hints', () => {
    const enumerateDevices = jest
      .fn<Promise<MediaDeviceInfo[]>, []>()
      .mockResolvedValue([]);
    const ipadNavigator = makeNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/604.1',
      maxTouchPoints: 5,
      enumerateDevices,
    });
    const mobileHintNavigator = makeNavigator({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140 Safari/537.36',
      mobileHint: true,
      enumerateDevices,
    });

    expect(isMobileWebCameraDevice(ipadNavigator)).toBe(true);
    expect(isMobileWebCameraDevice(mobileHintNavigator)).toBe(true);
  });

  it('defaults to hidden when device enumeration is unavailable or fails', async () => {
    const enumerateDevices = jest
      .fn<Promise<MediaDeviceInfo[]>, []>()
      .mockRejectedValue(new Error('device labels unavailable'));
    const failingNavigator = makeNavigator({
      userAgent: 'Mozilla/5.0 (iPhone) Mobile Safari/604.1',
      maxTouchPoints: 5,
      enumerateDevices,
    });
    const unavailableNavigator = {
      userAgent: 'Mozilla/5.0 (iPhone) Mobile Safari/604.1',
      maxTouchPoints: 5,
    } as TestNavigator;

    await expect(
      getCameraSwitchAvailability('web', failingNavigator),
    ).resolves.toBe(false);
    await expect(
      getCameraSwitchAvailability('web', unavailableNavigator),
    ).resolves.toBe(false);
  });

  it.each(['ios', 'android', undefined])(
    'defaults to hidden outside the web runtime (%s)',
    async (runtimeOs) => {
      const enumerateDevices = jest
        .fn<Promise<MediaDeviceInfo[]>, []>()
        .mockResolvedValue([]);
      const runtimeNavigator = makeNavigator({
        userAgent: 'native',
        enumerateDevices,
      });

      await expect(
        getCameraSwitchAvailability(runtimeOs, runtimeNavigator),
      ).resolves.toBe(false);
      expect(enumerateDevices).not.toHaveBeenCalled();
    },
  );
});
