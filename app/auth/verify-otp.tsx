import VerifyOtpForm from '../../src/components/auth/VerifyOtpForm';
import { useVerifyOtp } from '../../src/hooks/useVerifyOtp';

export default function VerifyOTPScreen() {
  const otp = useVerifyOtp();
  return otp.email ? <VerifyOtpForm {...otp} email={otp.email} /> : null;
}
