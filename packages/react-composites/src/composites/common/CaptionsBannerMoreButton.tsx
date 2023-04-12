// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React from 'react';
import { ControlBarButtonProps } from '@internal/react-components';
/* @conditional-compile-remove(close-captions) */
import { IContextualMenuItem } from '@fluentui/react';
/* @conditional-compile-remove(close-captions) */
import { _StartCaptionsButton } from '@internal/react-components';
/* @conditional-compile-remove(close-captions) */
import { useMemo } from 'react';
/* @conditional-compile-remove(close-captions) */
import { useAdaptedSelector } from '../CallComposite/hooks/useAdaptedSelector';
/* @conditional-compile-remove(close-captions) */
import { useHandlers } from '../CallComposite/hooks/useHandlers';
/* @conditional-compile-remove(close-captions) */
import { buttonFlyoutIncreasedSizeStyles } from '../CallComposite/styles/Buttons.styles';
/* @conditional-compile-remove(close-captions) */
import { useLocale } from '../localization';
/* @conditional-compile-remove(close-captions) */
import { MoreButton } from './MoreButton';
/* @conditional-compile-remove(close-captions) */
import { _startCaptionsButtonSelector } from '@internal/calling-component-bindings';

/** @private */
export interface CaptionsBannerMoreButtonProps extends ControlBarButtonProps {
  onCaptionsSettingsClick?: () => void;
}

/**
 *
 * @private
 */
export const CaptionsBannerMoreButton = (props: CaptionsBannerMoreButtonProps): JSX.Element => {
  /* @conditional-compile-remove(close-captions) */
  const localeStrings = useLocale();
  /* @conditional-compile-remove(close-captions) */
  const startCaptionsButtonProps = useAdaptedSelector(_startCaptionsButtonSelector);
  /* @conditional-compile-remove(close-captions) */
  const startCaptionsButtonHandlers = useHandlers(_StartCaptionsButton);
  /* @conditional-compile-remove(close-captions) */
  const moreButtonStrings = useMemo(
    () => ({
      label: localeStrings.strings.call.captionsBannerMoreButtonCallingLabel,
      tooltipOffContent: localeStrings.strings.call.captionsBannerMoreButtonTooltip
    }),
    [localeStrings]
  );
  /* @conditional-compile-remove(close-captions) */
  const moreButtonContextualMenuItems: IContextualMenuItem[] = [];
  /* @conditional-compile-remove(close-captions) */
  moreButtonContextualMenuItems.push({
    key: 'ToggleCaptionsKey',
    text: startCaptionsButtonProps.checked
      ? localeStrings.strings.call.startCaptionsButtonTooltipOnContent
      : localeStrings.strings.call.startCaptionsButtonTooltipOffContent,
    onClick: () => {
      startCaptionsButtonProps.checked
        ? startCaptionsButtonHandlers.onStopCaptions()
        : startCaptionsButtonProps.currentSpokenLanguage
        ? startCaptionsButtonHandlers.onStartCaptions({
            spokenLanguage: startCaptionsButtonProps.currentSpokenLanguage
          })
        : props.onCaptionsSettingsClick && props.onCaptionsSettingsClick();
    },
    iconProps: {
      iconName: startCaptionsButtonProps.checked ? 'CaptionsOffIcon' : 'CaptionsIcon',
      styles: { root: { lineHeight: 0 } }
    },
    itemProps: {
      styles: buttonFlyoutIncreasedSizeStyles
    }
  });
  /* @conditional-compile-remove(close-captions) */
  if (props.onCaptionsSettingsClick) {
    moreButtonContextualMenuItems.push({
      key: 'openCaptionsSettingKey',
      text: localeStrings.strings.call.captionsSettingLabel,
      onClick: props.onCaptionsSettingsClick,
      iconProps: {
        iconName: 'CaptionsSettingIcon',
        styles: { root: { lineHeight: 0 } }
      },
      itemProps: {
        styles: buttonFlyoutIncreasedSizeStyles
      },
      disabled: !startCaptionsButtonProps.checked
    });
  }
  /* @conditional-compile-remove(close-captions) */
  return (
    <MoreButton
      {...props}
      data-ui-id="captions-banner-more-button"
      strings={moreButtonStrings}
      menuIconProps={{ hidden: true }}
      menuProps={{ items: moreButtonContextualMenuItems }}
    />
  );
  return <></>;
};
