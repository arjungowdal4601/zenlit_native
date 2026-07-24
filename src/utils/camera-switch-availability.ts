type NavigatorWithMobileHint = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

const MOBILE_USER_AGENT = /Android|iPad|iPhone|iPod|Mobile/i;
const IPAD_DESKTOP_USER_AGENT = /Macintosh/i;

export const isMobileWebCameraDevice = (
  runtimeNavigator: NavigatorWithMobileHint | null,
): boolean => {
  if (!runtimeNavigator) {
    return false;
  }

  const mobileHint = runtimeNavigator.userAgentData?.mobile;
  if (typeof mobileHint === 'boolean') {
    return mobileHint;
  }

  if (MOBILE_USER_AGENT.test(runtimeNavigator.userAgent)) {
    return true;
  }

  // iPadOS can request desktop sites and identify itself as a Macintosh.
  return (
    IPAD_DESKTOP_USER_AGENT.test(runtimeNavigator.userAgent) &&
    runtimeNavigator.maxTouchPoints > 1
  );
};

export async function getCameraSwitchAvailability(
  runtimeOs = process.env.EXPO_OS,
  runtimeNavigator: NavigatorWithMobileHint | null =
    typeof navigator === 'undefined' ? null : (navigator as NavigatorWithMobileHint),
): Promise<boolean> {
  if (runtimeOs !== 'web') {
    return false;
  }

  if (!isMobileWebCameraDevice(runtimeNavigator)) {
    return false;
  }

  const mediaDevices = runtimeNavigator?.mediaDevices;
  const enumerateDevices = mediaDevices?.enumerateDevices;
  if (typeof enumerateDevices !== 'function') {
    return false;
  }

  try {
    const devices = await enumerateDevices.call(mediaDevices);
    return devices.filter((device) => device.kind === 'videoinput').length > 1;
  } catch {
    return false;
  }
}
