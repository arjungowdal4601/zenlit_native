"use client";

import type { CSSProperties } from 'react';
import { SOCIAL_PLATFORMS, type SocialPlatformId } from '@/constants/socialPlatforms';
import { mergeClassNames } from '@/utils/classNames';

interface SocialLinkButtonProps {
  platform: SocialPlatformId;
  href?: string;
  onClick?: () => void;
  buttonClassName?: string;
  containerClassName?: string;
  iconClassName?: string;
  containerStyle?: CSSProperties;
  ariaLabel?: string;
}

const SocialLinkButton = ({
  platform,
  href,
  onClick,
  buttonClassName,
  containerClassName,
  iconClassName,
  containerStyle,
  ariaLabel,
}: SocialLinkButtonProps) => {
  const meta = SOCIAL_PLATFORMS[platform];
  const combinedButtonClass = mergeClassNames('inline-flex p-0 transition-transform duration-200', buttonClassName);
  const iconClass = mergeClassNames(meta.iconClassName ?? '', iconClassName ?? '');

  const content = (
    <div
      className={mergeClassNames(meta.wrapperClassName, containerClassName)}
      style={{ ...meta.style, ...containerStyle }}
    >
      {meta.renderIcon(iconClass)}
    </div>
  );

  if (href) {
    const isExternal = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        onClick={onClick}
        className={combinedButtonClass}
        aria-label={ariaLabel ?? meta.label}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={combinedButtonClass}
      aria-label={ariaLabel ?? meta.label}
    >
      {content}
    </button>
  );
};

export default SocialLinkButton;
