// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React from 'react';
import { ErrorBar } from '@internal/react-components';
import { useSelector } from '../hooks/useSelector';
import { lobbySelector } from '../selectors/lobbySelector';
import { CallCompositeOptions } from '../CallComposite';
import { CallArrangement } from '../components/CallArrangement';
import { usePropsFor } from '../hooks/usePropsFor';
import { LobbyOverlayProps, LobbyTile } from '../components/LobbyTile';
import { getCallStatus } from '../selectors/baseSelectors';
import { disableCallControls, reduceCallControlsForMobile } from '../utils';
import { CallCompositeStrings } from '../Strings';
import { useLocale } from '../../localization';
import { useLocalVideoStartTrigger } from '../components/MediaGallery';
import { CallCompositeIcon } from '../../common/icons';
/* @conditional-compile-remove(PSTN-calls) */ /* @conditional-compile-remove(1-to-n-calling) */
import { useAdapter } from '../adapter/CallAdapterProvider';
/* @conditional-compile-remove(PSTN-calls) */ /* @conditional-compile-remove(1-to-n-calling) */
import { isPhoneNumberIdentifier } from '@azure/communication-common';
/* @conditional-compile-remove(PSTN-calls) */ /* @conditional-compile-remove(1-to-n-calling) */
import { RemoteParticipantState } from '@internal/calling-stateful-client';

/**
 * @private
 */
export interface LobbyPageProps {
  mobileView: boolean;
  /* @conditional-compile-remove(one-to-n-calling) */
  modalLayerHostId: string;
  options?: CallCompositeOptions;
}

/**
 * @private
 */
export const LobbyPage = (props: LobbyPageProps): JSX.Element => {
  const errorBarProps = usePropsFor(ErrorBar);
  const lobbyProps = useSelector(lobbySelector);
  const strings = useLocale().strings.call;

  const callState = useSelector(getCallStatus);
  const inLobby = callState === 'InLobby';

  useLocalVideoStartTrigger(lobbyProps.localParticipantVideoStream.isAvailable, inLobby);

  // Reduce the controls shown when mobile view is enabled.
  let callControlOptions = props.mobileView
    ? reduceCallControlsForMobile(props.options?.callControls)
    : props.options?.callControls;

  callControlOptions = disableCallControls(callControlOptions, ['screenShareButton', 'participantsButton']);

  return (
    <CallArrangement
      complianceBannerProps={{ strings }}
      errorBarProps={props.options?.errorBar !== false && { ...errorBarProps }}
      callControlProps={{
        options: callControlOptions,
        increaseFlyoutItemSize: props.mobileView
      }}
      mobileView={props.mobileView}
      /* @conditional-compile-remove(one-to-n-calling) */
      modalLayerHostId={props.modalLayerHostId}
      onRenderGalleryContent={() => <LobbyTile {...lobbyProps} overlayProps={overlayProps(strings, inLobby)} />}
      dataUiId={'lobby-page'}
    />
  );
};

const overlayProps = (strings: CallCompositeStrings, inLobby: boolean): LobbyOverlayProps => {
  const remoteParticipants = useAdapter().getState().call?.remoteParticipants;
  const outboundCallParticipant = remoteParticipants !== undefined ? Object.values(remoteParticipants)[0] : undefined;

  return inLobby
    ? overlayPropsWaitingToBeAdmitted(strings)
    : outboundCallParticipant
    ? overlayPropsOutboundCall(strings, outboundCallParticipant)
    : overlayPropsConnectingToCall(strings);
};

const overlayPropsConnectingToCall = (strings: CallCompositeStrings): LobbyOverlayProps => ({
  title: strings.lobbyScreenConnectingToCallTitle,
  moreDetails: strings.lobbyScreenConnectingToCallMoreDetails,
  overlayIcon: <CallCompositeIcon iconName="LobbyScreenConnectingToCall" />
});

const overlayPropsWaitingToBeAdmitted = (strings: CallCompositeStrings): LobbyOverlayProps => ({
  title: strings.lobbyScreenWaitingToBeAdmittedTitle,
  moreDetails: strings.lobbyScreenWaitingToBeAdmittedMoreDetails,
  overlayIcon: <CallCompositeIcon iconName="LobbyScreenWaitingToBeAdmitted" />
});

/* @conditional-compile-remove(PSTN-calls) */
const overlayPropsOutboundCall = (
  strings: CallCompositeStrings,
  participant: RemoteParticipantState
): LobbyOverlayProps => {
  const title = isPhoneNumberIdentifier(participant.identifier)
    ? participant.identifier.phoneNumber
    : strings.outboundCallingNoticeString;
  return {
    title,
    moreDetails: title !== strings.outboundCallingNoticeString ? strings.outboundCallingNoticeString : undefined
  };
};
