// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { memoizeFunction, Stack, useTheme } from '@fluentui/react';
import { IContextualMenuItem } from '@fluentui/react';
import { useState } from 'react';
import {
  _isInLobbyOrConnecting,
  useCallingSelector,
  useCallingHandlers,
  holdButtonSelector
} from '@internal/calling-component-bindings';
import { ControlBar, ParticipantMenuItemsCallback, _Permissions } from '@internal/react-components';
import { HoldButton } from '@internal/react-components';
/* @conditional-compile-remove(rooms) */
import { _usePermissions } from '@internal/react-components';
import React, { useMemo } from 'react';
import { CallControlOptions, CustomCallControlButtonCallback } from '../types/CallControlOptions';
import { Camera } from './buttons/Camera';
import { generateCustomControlBarButtons } from './buttons/Custom';
import { Devices } from './buttons/Devices';
import { EndCall } from './buttons/EndCall';
import { Microphone } from './buttons/Microphone';
import { Participants } from './buttons/Participants';
import { ScreenShare } from './buttons/ScreenShare';
import { ContainerRectProps } from '../../common/ContainerRectProps';
import { People } from './buttons/People';
import { useLocale } from '../../localization';
import { MoreButton } from '../../common/MoreButton';
import { buttonFlyoutIncreasedSizeStyles } from '../styles/Buttons.styles';
import { SendDtmfDialpad, SendDtmfDialpadStrings } from '../../common/SendDtmfDialpad';
/* @conditional-compile-remove(PSTN-calls) */
import { useAdapter } from '../adapter/CallAdapterProvider';
import { isDisabled } from '../utils';
import { ControlBarButtonStrings } from '@internal/react-components';

/**
 * @private
 */
export type CallControlsProps = {
  peopleButtonChecked?: boolean;
  onPeopleButtonClicked?: () => void;
  callInvitationURL?: string;
  onFetchParticipantMenuItems?: ParticipantMenuItemsCallback;
  options?: boolean | CallControlOptions;
  /**
   * Option to increase the height of the button flyout menu items from 36px to 48px.
   * Recommended for mobile devices.
   */
  increaseFlyoutItemSize?: boolean;
  isMobile?: boolean;
};

// Enforce a background color on control bar to ensure it matches the composite background color.
const controlBarStyles = memoizeFunction((background: string) => ({ root: { background: background } }));

/**
 * @private
 */
export const CallControls = (props: CallControlsProps & ContainerRectProps): JSX.Element => {
  const options = useMemo(() => (typeof props.options === 'boolean' ? {} : props.options), [props.options]);

  const theme = useTheme();
  const locale = useLocale();
  // FIXME (?): Why is this using callWithChat strings?
  const peopleButtonStrings = useMemo(
    () => ({
      label: locale.strings.callWithChat.peopleButtonLabel,
      tooltipOffContent: locale.strings.callWithChat.peopleButtonTooltipOpen,
      tooltipOnContent: locale.strings.callWithChat.peopleButtonTooltipClose
    }),
    [locale]
  );
  const dialpadStrings = useDialpadStringsTrampoline();

  const [showDialpad, setShowDialpad] = useState(false);
  // FIXME: useMemo
  const onDismissDialpad = (): void => {
    setShowDialpad(false);
  };

  const customButtons = useMemo(
    () => generateCustomControlBarButtons(onFetchCustomButtonPropsTrampoline(options), options?.displayType),
    [options]
  );

  const rolePermissions = usePermissionsTrampoline();

  const screenShareButtonIsEnabled = rolePermissions.screenShare && isEnabled(options?.screenShareButton);
  const microphoneButtonIsEnabled = rolePermissions.microphoneButton && isEnabled(options?.microphoneButton);
  const cameraButtonIsEnabled = rolePermissions.cameraButton && isEnabled(options?.cameraButton);
  const moreButtonIsEnabled = isEnabled(moreButtonOptionsTrampoline(options));
  const devicesButtonIsEnabled = isEnabled(options?.devicesButton);
  const participantButtonIsEnabled = isParticipantButtonEnabledTrampoline(options);
  const peopleButtonIsEnabled = isPeopleButtonEnabledTrampoline(options, props.isMobile);
  const sendDtmfDialpadIsEnabled = isSendDtmpfDiapladEnabledTrampoline();

  // when props.options is false then we want to hide the whole control bar.
  if (props.options === false) {
    return <></>;
  }

  return (
    <Stack horizontalAlign="center">
      {sendDtmfDialpadIsEnabled && (
        <SendDtmfDialpad
          isMobile={!!props.isMobile}
          strings={dialpadStrings}
          showDialpad={showDialpad}
          onDismissDialpad={onDismissDialpad}
        />
      )}
      <Stack.Item>
        {/*
            Note: We use the layout="horizontal" instead of dockedBottom because of how we position the
            control bar. The control bar exists in a Stack below the MediaGallery. The MediaGallery is
            set to grow and fill the remaining space not taken up by the ControlBar. If we were to use
            dockedBottom it has position absolute and would therefore float on top of the media gallery,
            occluding some of its content.
         */}
        <ControlBar layout="horizontal" styles={controlBarStyles(theme.semanticColors.bodyBackground)}>
          {microphoneButtonIsEnabled && (
            <Microphone displayType={options?.displayType} disabled={isDisabled(options?.microphoneButton)} />
          )}
          {cameraButtonIsEnabled && (
            <Camera displayType={options?.displayType} disabled={isDisabled(options?.cameraButton)} />
          )}
          {screenShareButtonIsEnabled && (
            <ScreenShare
              option={options?.screenShareButton}
              displayType={options?.displayType}
              disabled={isDisabled(options?.screenShareButton)}
            />
          )}
          {participantButtonIsEnabled && (
            <Participants
              option={options?.participantsButton}
              callInvitationURL={props.callInvitationURL}
              onFetchParticipantMenuItems={props.onFetchParticipantMenuItems}
              displayType={options?.displayType}
              increaseFlyoutItemSize={props.increaseFlyoutItemSize}
              isMobile={props.isMobile}
              disabled={isDisabled(options?.participantsButton)}
            />
          )}
          {peopleButtonIsEnabled && (
            <People
              checked={props.peopleButtonChecked}
              showLabel={options?.displayType !== 'compact'}
              onClick={props.onPeopleButtonClicked}
              data-ui-id="call-composite-people-button"
              strings={peopleButtonStrings}
              disabled={isDisabled(options?.participantsButton)}
            />
          )}
          {devicesButtonIsEnabled && (
            <Devices
              displayType={options?.displayType}
              increaseFlyoutItemSize={props.increaseFlyoutItemSize}
              disabled={isDisabled(options?.devicesButton)}
            />
          )}
          {moreButtonIsEnabled && (
            <CallControlsMoreButton
              options={options}
              onPeopleButtonClicked={props.onPeopleButtonClicked}
              isMobile={props.isMobile}
              setShowDialpad={setShowDialpad}
            />
          )}
          {customButtons['primary']}
          {isEnabled(options?.endCallButton) && <EndCall displayType={options?.displayType} />}
        </ControlBar>
      </Stack.Item>
    </Stack>
  );
};

const onFetchCustomButtonPropsTrampoline = (
  options?: CallControlOptions
): CustomCallControlButtonCallback[] | undefined => {
  /* @conditional-compile-remove(control-bar-button-injection) */
  return options?.onFetchCustomButtonProps;
  return undefined;
};

const isParticipantButtonEnabledTrampoline = (options?: CallControlOptions): boolean => {
  /* @conditional-compile-remove(one-to-n-calling) */ /* @conditional-compile-remove(PSTN-calls) */
  return false;
  return isEnabled(options?.participantsButton);
};

const isPeopleButtonEnabledTrampoline = (options?: CallControlOptions, isMobile?: boolean): boolean => {
  /* @conditional-compile-remove(one-to-n-calling) */ /* @conditional-compile-remove(PSTN-calls) */
  return isEnabled(options?.participantsButton) && !isMobile;
  return false;
};

const isSendDtmpfDiapladEnabledTrampoline = (): boolean => {
  /* @conditional-compile-remove(PSTN-calls) */
  return true;
  return false;
};

const useDialpadStringsTrampoline = (): SendDtmfDialpadStrings => {
  const locale = useLocale();
  return useMemo(() => {
    /* @conditional-compile-remove(PSTN-calls) */
    return {
      dialpadModalAriaLabel: locale.strings.call.dialpadModalAriaLabel,
      dialpadCloseModalButtonAriaLabel: locale.strings.call.dialpadCloseModalButtonAriaLabel,
      placeholderText: locale.strings.call.dtmfDialpadPlaceHolderText
    };
    return { dialpadModalAriaLabel: '', dialpadCloseModalButtonAriaLabel: '', placeholderText: '' };
  }, [locale]);
};

const CallControlsMoreButton = (props: {
  options?: CallControlOptions;
  onPeopleButtonClicked?: () => void;
  isMobile?: boolean;
  setShowDialpad: (value: boolean) => void;
}): JSX.Element => {
  const { options, onPeopleButtonClicked, isMobile, setShowDialpad } = props;
  const locale = useLocale();
  // Unfortunately can't use `usePropsFor`for conditionally exported components.
  // TODO: Use `usePropsFor` once `MoreButton` is stabilized.
  const holdButtonProps = {
    ...useCallingSelector(holdButtonSelector),
    ...useCallingHandlers(HoldButton)
  };
  const alternateCallerId = useAlternateCallerIdTrampoline();
  const moreButtonStrings = useMoreButtonStringsTrampoline();
  const holdButtonStrings = useHoldButtonStringsTrampoline();
  const dialpadKeyStrings = useDialpadKeyStringsTrampoline();

  // FIXME: Memoize!
  const moreButtonContextualMenuItems = (): IContextualMenuItem[] => {
    const items: IContextualMenuItem[] = [];

    if (isMobile && onPeopleButtonClicked && isEnabled(options?.participantsButton)) {
      items.push({
        key: 'peopleButtonKey',
        text: locale.component.strings.participantsButton.label,
        onClick: () => {
          if (onPeopleButtonClicked) {
            onPeopleButtonClicked();
          }
        },
        iconProps: { iconName: 'ControlButtonParticipantsContextualMenuItem', styles: { root: { lineHeight: 0 } } },
        itemProps: {
          styles: buttonFlyoutIncreasedSizeStyles
        },
        disabled: isDisabled(options?.participantsButton),
        ['data-ui-id']: 'call-composite-more-menu-people-button'
      });
    }

    items.push({
      key: 'holdButtonKey',
      text: holdButtonStrings.text,
      onClick: () => {
        holdButtonProps.onToggleHold();
      },
      iconProps: { iconName: 'HoldCallContextualMenuItem', styles: { root: { lineHeight: 0 } } },
      itemProps: {
        styles: buttonFlyoutIncreasedSizeStyles
      },
      disabled: isDisabled(holdButtonOptionsTrampoline(options)),
      ['data-ui-id']: 'hold-button'
    });

    if (alternateCallerId) {
      items.push({
        key: 'showDialpadKey',
        text: dialpadKeyStrings.text,
        onClick: () => {
          setShowDialpad(true);
        },
        iconProps: { iconName: 'PeoplePaneOpenDialpad', styles: { root: { lineHeight: 0 } } },
        itemProps: {
          styles: buttonFlyoutIncreasedSizeStyles
        }
      });
    }
    return items;
  };

  if (!isEnabled(moreButtonOptionsTrampoline(options))) {
    return <></>;
  }
  return (
    <MoreButton
      strings={moreButtonStrings}
      menuIconProps={{ hidden: true }}
      menuProps={{ items: moreButtonContextualMenuItems() }}
      showLabel={!props.isMobile}
    />
  );
};

const isEnabled = (option: unknown): boolean => option !== false;

const useMoreButtonStringsTrampoline = (): ControlBarButtonStrings => {
  const locale = useLocale();
  return useMemo(() => {
    // @conditional-compile-remove(PSTN-calls)
    // @conditional-compile-remove(one-to-n-calling)
    return {
      label: locale.strings.call.moreButtonCallingLabel,
      tooltipOffContent: locale.strings.callWithChat.moreDrawerButtonTooltip
    };
    return { label: '', tooltipOffContent: '' };
  }, [locale]);
};

const useDialpadKeyStringsTrampoline = (): { text: string } => {
  const locale = useLocale();
  return useMemo(() => {
    // @conditional-compile-remove(PSTN-calls)
    return { text: locale.strings.call.openDtmfDialpadLabel };
    return { text: '' };
  }, [locale]);
};

const useHoldButtonStringsTrampoline = (): { text: string } => {
  const locale = useLocale();
  return useMemo(() => {
    // @conditional-compile-remove(PSTN-calls)
    // @conditional-compile-remove(one-to-n-calling)
    return { text: locale.component.strings.holdButton.tooltipOffContent };
    return { text: '' };
  }, [locale]);
};

const useAlternateCallerIdTrampoline = (): string | undefined => {
  // FIXME: This should use a selector so that any update to `alternateCallerId` triggers a UI update.
  /* @conditional-compile-remove(PSTN-calls) */
  return useAdapter().getState().alternateCallerId;
  return undefined;
};

const holdButtonOptionsTrampoline = (options?: CallControlOptions): boolean | { disabled: boolean } | undefined => {
  /* @conditional-compile-remove(PSTN-calls) */ /* @conditional-compile-remove(one-to-n-calling) */
  return options?.holdButton;
  return undefined;
};

const moreButtonOptionsTrampoline = (options?: CallControlOptions): boolean | undefined => {
  /* @conditional-compile-remove(PSTN-calls) */ /* @conditional-compile-remove(one-to-n-calling) */
  return options?.moreButton;
  // More button is never enabled in stable build.
  return false;
};

const usePermissionsTrampoline = (): _Permissions => {
  /* @conditional-compile-remove(rooms) */
  return _usePermissions();
  // On stable build, all users have all permissions
  return {
    cameraButton: true,
    microphoneButton: true,
    screenShare: true,
    removeParticipantButton: true
  };
};
