import React, { useEffect, useRef } from 'react';
import { useAppToast } from './ui/app-toast';

export type SuccessPopupProps = {
  visible: boolean;
  message?: string;
  duration?: number;
  onDismiss?: () => void;
};

const SuccessPopup: React.FC<SuccessPopupProps> = ({
  visible,
  message = 'Post created successfully',
  duration = 4000,
  onDismiss,
}) => {
  const { showToast } = useAppToast();
  const emittedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      emittedRef.current = false;
      return;
    }

    if (emittedRef.current) return;
    emittedRef.current = true;

    showToast({ message, tone: 'success', duration });
    onDismiss?.();
  }, [duration, message, onDismiss, showToast, visible]);

  return null;
};

export default SuccessPopup;
