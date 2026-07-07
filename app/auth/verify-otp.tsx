import { Redirect } from 'expo-router';

import VerifyOtpForm from '../../src/components/auth/VerifyOtpForm';
import { useVerifyOtp } from '../../src/hooks/useVerifyOtp';
import { ROUTES } from '../../src/utils/onboardingState';

export default function VerifyOTPScreen() {
  const otp = useVerifyOtp();
  return otp.email ? <VerifyOtpForm {...otp} email={otp.email} /> : <Redirect href={ROUTES.auth} />;
}
