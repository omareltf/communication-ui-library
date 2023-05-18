// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { IStyle, Persona, Spinner, SpinnerSize, Stack, Text, mergeStyles } from '@fluentui/react';
import { ErrorBar, OnRenderAvatarCallback, VideoGallery } from '@internal/react-components';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../localization';
import { CallCompositeOptions } from '../CallComposite';
import { CallArrangement } from '../components/CallArrangement';
import { usePropsFor } from '../hooks/usePropsFor';
import { useSelector } from '../hooks/useSelector';
import { getCallId, getTransferCall } from '../selectors/baseSelectors';
import { reduceCallControlsForMobile } from '../utils';

/**
 * @private
 */
export interface LobbyPageProps {
  mobileView: boolean;
  /* @conditional-compile-remove(one-to-n-calling) */
  modalLayerHostId: string;
  options?: CallCompositeOptions;
  onRenderAvatar?: OnRenderAvatarCallback;
}

export const TransferPage = (props: LobbyPageProps): JSX.Element => {
  const errorBarProps = usePropsFor(ErrorBar);
  const strings = useLocale().strings.call;
  const videoGalleryProps = usePropsFor(VideoGallery);
  const callId = useSelector(getCallId);
  const transferTargetCall = useSelector(getTransferCall);

  // Reduce the controls shown when mobile view is enabled.
  let callControlOptions = props.mobileView
    ? reduceCallControlsForMobile(props.options?.callControls)
    : props.options?.callControls;

  const transferor = videoGalleryProps.remoteParticipants[0];

  const state: 'transferring' | 'connecting' = useMemo(() => {
    if (transferTargetCall !== undefined) {
      if (callId !== transferTargetCall.id) {
        if (['Ringing', 'Connected'].includes(transferTargetCall.state)) {
          return 'connecting';
        } else {
          return 'transferring';
        }
      } else {
        return 'connecting';
      }
    }
    return 'transferring';
  }, [callId, transferTargetCall?.id, transferTargetCall?.state]);

  const transferParticipant = state === 'transferring' ? transferor : transferTargetCall?.remoteParticipants[0];

  return (
    <CallArrangement
      complianceBannerProps={{ strings }}
      // Ignore errors from before current call. This avoids old errors from showing up when a user re-joins a call.
      errorBarProps={props.options?.errorBar !== false && { ...errorBarProps, ignorePremountErrors: true }}
      callControlProps={{
        options: callControlOptions,
        increaseFlyoutItemSize: props.mobileView
      }}
      mobileView={props.mobileView}
      /* @conditional-compile-remove(one-to-n-calling) */
      modalLayerHostId={props.modalLayerHostId}
      onRenderGalleryContent={() => (
        <TransferTile
          displayName={transferParticipant?.displayName}
          initialsName={transferParticipant?.displayName}
          statusString={state === 'connecting' ? 'Connecting...' : 'Transferring...'}
          onRenderPlaceholder={props.onRenderAvatar}
        />
      )}
      dataUiId={'lobby-page'}
    />
  );
};

export interface TransferTileProps {
  /** React Child components. Child Components will show as overlay component in the VideoTile. */
  children?: React.ReactNode;
  /** user id for the VideoTile placeholder. */
  userId?: string;
  /** Custom render Component function for no video is available. Render a Persona Icon if undefined. */
  onRenderPlaceholder?: OnRenderAvatarCallback;
  /**
   * Show label on the VideoTile
   * @defaultValue true
   */
  showLabel?: boolean;
  /**
   * Whether to display a mute icon beside the user's display name.
   * @defaultValue true
   */
  showMuteIndicator?: boolean;
  /**
   * Whether the video is muted or not.
   */
  isMuted?: boolean;
  /* @conditional-compile-remove(pinned-participants) */
  /**
   * If true, the video tile will show the pin icon.
   */
  isPinned?: boolean;
  /**
   * Display Name of the Participant to be shown in the label.
   * @remarks `displayName` is used to generate avatar initials if `initialsName` is not provided.
   */
  displayName?: string;
  /**
   * Name of the participant used to generate initials. For example, a name `John Doe` will display `JD` as initials.
   * @remarks `displayName` is used if this property is not specified.
   */
  initialsName?: string;
  /**
   * Minimum size of the persona avatar in px.
   * The persona avatar is the default placeholder shown when no video stream is available.
   * For more information see https://developer.microsoft.com/en-us/fluentui#/controls/web/persona
   * @defaultValue 32px
   */
  personaMinSize?: number;
  /**
   * Maximum size of the personal avatar in px.
   * The persona avatar is the default placeholder shown when no video stream is available.
   * For more information see https://developer.microsoft.com/en-us/fluentui#/controls/web/persona
   * @defaultValue 100px
   */
  personaMaxSize?: number;
  /** Optional property to set the aria label of the video tile if there is no available stream. */
  noVideoAvailableAriaLabel?: string;
  statusString?: string;
}

const defaultPersonaStyles = { root: { margin: 'auto' } };

const TransferTile = (props: TransferTileProps): JSX.Element => {
  const { displayName, initialsName, userId, onRenderPlaceholder, noVideoAvailableAriaLabel, statusString } = props;

  const [personaSize, setPersonaSize] = useState<number>();
  const tileRef = useRef<HTMLDivElement>(null);

  const observer = useRef(
    new ResizeObserver((entries): void => {
      const { width, height } = entries[0].contentRect;
      const personaSize = Math.min(width, height) / 2;
      setPersonaSize(Math.max(Math.min(personaSize, 100), 32));
    })
  );

  useLayoutEffect(() => {
    if (tileRef.current) {
      observer.current.observe(tileRef.current);
    }
    const currentObserver = observer.current;
    return () => currentObserver.disconnect();
  }, [observer, tileRef]);

  const placeholderOptions = useMemo(
    () => ({
      userId,
      text: initialsName ?? displayName,
      noVideoAvailableAriaLabel,
      coinSize: personaSize,
      styles: defaultPersonaStyles,
      hidePersonaDetails: true
    }),
    [userId, initialsName, displayName, noVideoAvailableAriaLabel, personaSize, defaultPersonaStyles]
  );

  return (
    <div ref={tileRef} className={mergeStyles({ width: '100%', height: '100%' })} data-is-focusable={true}>
      <Stack className={mergeStyles(videoContainerStyles)}>
        <Stack
          className={mergeStyles({
            width: '100%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(0, -50%)',
            display: 'flex',
            justifyContent: 'center'
          })}
          tokens={{ childrenGap: '1rem' }}
        >
          <Stack horizontalAlign="center" tokens={{ childrenGap: '0.5rem' }}>
            {onRenderPlaceholder
              ? onRenderPlaceholder(userId ?? '', placeholderOptions, () =>
                  personaSize ? <Persona {...placeholderOptions} className={mergeStyles({ opacity: 0.4 })} /> : <></>
                )
              : personaSize && <Persona {...placeholderOptions} className={mergeStyles({ opacity: 0.4 })} />}
            <Text className={mergeStyles({ textAlign: 'center', fontSize: '1.5rem', fontWeight: 400 })}>
              {displayName ?? 'Unknown'}
            </Text>
          </Stack>
          <Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: '0.5rem' }}>
            <Spinner size={SpinnerSize.large} styles={{ circle: { borderWidth: '0.125rem' } }} />
            <Text className={mergeStyles({ textAlign: 'center', fontSize: '1rem' })}>{statusString}</Text>
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
};

/**
 * @private
 */
export const videoContainerStyles: IStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  minWidth: '100%',
  minHeight: '100%',
  objectPosition: 'center',
  objectFit: 'cover',
  zIndex: 0
};
