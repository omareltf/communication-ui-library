// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  AddPhoneNumberOptions,
  AudioDeviceInfo,
  Call,
  LocalVideoStream,
  StartCallOptions,
  TeamsCall,
  VideoDeviceInfo
} from '@azure/communication-calling';
/* @conditional-compile-remove(dialpad) */ /* @conditional-compile-remove(PSTN-calls) */
import { DtmfTone } from '@azure/communication-calling';
/* @conditional-compile-remove(PSTN-calls) */
/* @conditional-compile-remove(PSTN-calls) */
import { toFlatCommunicationIdentifier } from '@internal/acs-ui-common';
import { CreateViewResult, StatefulCallClient, StatefulDeviceManager } from '@internal/calling-stateful-client';
import memoizeOne from 'memoize-one';
import { CreateVideoStreamViewResult, VideoStreamOptions } from '@internal/react-components';
import { disposeAllLocalPreviewViews, _isInCall, _isPreviewOn } from '../utils/callUtils';
import {
  CommunicationUserIdentifier,
  PhoneNumberIdentifier,
  UnknownIdentifier,
  CommunicationIdentifier
} from '@azure/communication-common';

/**
 * Object containing all the handlers required for calling components.
 *
 * Calling related components from this package are able to pick out relevant handlers from this object.
 * See {@link useHandlers} and {@link usePropsFor}.
 *
 * @public
 */
export type CallingHandlersCommon = {
  onStartLocalVideo: () => Promise<void>;
  onToggleCamera: (options?: VideoStreamOptions) => Promise<void>;
  onSelectMicrophone: (device: AudioDeviceInfo) => Promise<void>;
  onSelectSpeaker: (device: AudioDeviceInfo) => Promise<void>;
  onSelectCamera: (device: VideoDeviceInfo, options?: VideoStreamOptions) => Promise<void>;
  onToggleMicrophone: () => Promise<void>;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => Promise<void>;
  onToggleScreenShare: () => Promise<void>;
  onHangUp: () => Promise<void>;
  /* @conditional-compile-remove(PSTN-calls) */
  onToggleHold: () => Promise<void>;
  /* @conditional-compile-remove(PSTN-calls) */
  onCreateLocalStreamView: (options?: VideoStreamOptions) => Promise<void | CreateVideoStreamViewResult>;
  onCreateRemoteStreamView: (
    userId: string,
    options?: VideoStreamOptions
  ) => Promise<void | CreateVideoStreamViewResult>;
  onDisposeRemoteStreamView: (userId: string) => Promise<void>;
  onDisposeLocalStreamView: () => Promise<void>;
  /* @conditional-compile-remove(dialpad) */ /* @conditional-compile-remove(PSTN-calls) */
  onSendDtmfTone: (dtmfTone: DtmfTone) => Promise<void>;
  onStartCall: (
    participants: (CommunicationUserIdentifier | PhoneNumberIdentifier | UnknownIdentifier)[],
    options?: StartCallOptions
  ) => void;
  onAddParticipant: (participant: CommunicationIdentifier, options?: AddPhoneNumberOptions) => Promise<void>;
  onRemoveParticipant: (userId: string) => Promise<void>;
};
/**
 * @private
 */
export const areStreamsEqual = (prevStream: LocalVideoStream, newStream: LocalVideoStream): boolean => {
  return !!prevStream && !!newStream && prevStream.source.id === newStream.source.id;
};

/**
 * Create the default implementation of {@link CallingHandlers}.
 *
 * Useful when implementing a custom component that utilizes the providers
 * exported from this library.
 *
 * @public
 */
export const createDefaultCallingHandlersCommon = memoizeOne(
  (
    callClient: StatefulCallClient,
    deviceManager: StatefulDeviceManager | undefined,
    call: Call | TeamsCall | undefined
  ): CallingHandlersCommon => {
    const onStartLocalVideo = async (): Promise<void> => {
      // Before the call object creates a stream, dispose of any local preview streams.
      // @TODO: is there any way to parent the unparented view to the call object instead
      // of disposing and creating a new stream?
      await disposeAllLocalPreviewViews(callClient);

      const callId = call?.id;
      let videoDeviceInfo = callClient.getState().deviceManager.selectedCamera;
      if (!videoDeviceInfo) {
        const cameras = await deviceManager?.getCameras();
        videoDeviceInfo = cameras && cameras.length > 0 ? cameras[0] : undefined;
        videoDeviceInfo && deviceManager?.selectCamera(videoDeviceInfo);
      }
      if (!callId || !videoDeviceInfo) {
        return;
      }
      const stream = new LocalVideoStream(videoDeviceInfo);
      if (call && !call.localVideoStreams.find((s) => areStreamsEqual(s, stream))) {
        await call.startVideo(stream);
      }
    };

    const onStopLocalVideo = async (stream: LocalVideoStream): Promise<void> => {
      const callId = call?.id;
      if (!callId) {
        return;
      }
      if (call && call.localVideoStreams.find((s) => areStreamsEqual(s, stream))) {
        await call.stopVideo(stream);
        await callClient.disposeView(callId, undefined, {
          source: stream.source,
          mediaStreamType: stream.mediaStreamType
        });
      }
    };

    const onToggleCamera = async (options?: VideoStreamOptions): Promise<void> => {
      if (call && _isInCall(call.state)) {
        const stream = call.localVideoStreams.find((stream) => stream.mediaStreamType === 'Video');
        if (stream) {
          await onStopLocalVideo(stream);
        } else {
          await onStartLocalVideo();
        }
      } else {
        const selectedCamera = callClient.getState().deviceManager.selectedCamera;
        if (selectedCamera) {
          const previewOn = _isPreviewOn(callClient.getState().deviceManager);
          if (previewOn) {
            await onDisposeLocalStreamView();
          } else {
            await callClient.createView(
              undefined,
              undefined,
              {
                source: selectedCamera,
                mediaStreamType: 'Video'
              },
              options
            );
          }
        }
      }
    };

    const onSelectMicrophone = async (device: AudioDeviceInfo): Promise<void> => {
      if (!deviceManager) {
        return;
      }
      return deviceManager.selectMicrophone(device);
    };

    const onSelectSpeaker = async (device: AudioDeviceInfo): Promise<void> => {
      if (!deviceManager) {
        return;
      }
      return deviceManager.selectSpeaker(device);
    };

    const onSelectCamera = async (device: VideoDeviceInfo, options?: VideoStreamOptions): Promise<void> => {
      if (!deviceManager) {
        return;
      }
      if (call && _isInCall(call.state)) {
        deviceManager.selectCamera(device);
        const stream = call.localVideoStreams.find((stream) => stream.mediaStreamType === 'Video');
        return stream?.switchSource(device);
      } else {
        const previewOn = _isPreviewOn(callClient.getState().deviceManager);

        if (!previewOn) {
          deviceManager.selectCamera(device);
          return;
        }

        await onDisposeLocalStreamView();

        deviceManager.selectCamera(device);
        await callClient.createView(
          undefined,
          undefined,
          {
            source: device,
            mediaStreamType: 'Video'
          },
          options
        );
      }
    };

    const onToggleMicrophone = async (): Promise<void> => {
      if (!call || !_isInCall(call.state)) {
        throw new Error(`Please invoke onToggleMicrophone after call is started`);
      }
      return call.isMuted ? await call.unmute() : await call.mute();
    };

    const onStartScreenShare = async (): Promise<void> => await call?.startScreenSharing();

    const onStopScreenShare = async (): Promise<void> => await call?.stopScreenSharing();

    const onToggleScreenShare = async (): Promise<void> =>
      call?.isScreenSharingOn ? await onStopScreenShare() : await onStartScreenShare();

    const onHangUp = async (): Promise<void> => await call?.hangUp();

    /* @conditional-compile-remove(PSTN-calls) */
    const onToggleHold = async (): Promise<void> =>
      call?.state === 'LocalHold' ? await call?.resume() : await call?.hold();

    const onCreateLocalStreamView = async (
      options = { scalingMode: 'Crop', isMirrored: true } as VideoStreamOptions
    ): Promise<void | CreateVideoStreamViewResult> => {
      if (!call || call.localVideoStreams.length === 0) {
        return;
      }

      const callState = callClient.getState().calls[call.id];
      if (!callState) {
        return;
      }

      const localStream = callState.localVideoStreams.find((item) => item.mediaStreamType === 'Video');
      if (!localStream) {
        return;
      }

      const { view } = (await callClient.createView(call.id, undefined, localStream, options)) ?? {};
      return view ? { view } : undefined;
    };

    const onCreateRemoteStreamView = async (
      userId: string,
      options = { scalingMode: 'Crop' } as VideoStreamOptions
    ): Promise<void | CreateVideoStreamViewResult> => {
      if (!call) {
        return;
      }
      const callState = callClient.getState().calls[call.id];
      if (!callState) {
        throw new Error(`Call Not Found: ${call.id}`);
      }

      const participant = Object.values(callState.remoteParticipants).find(
        (participant) => toFlatCommunicationIdentifier(participant.identifier) === userId
      );

      if (!participant || !participant.videoStreams) {
        return;
      }

      const remoteVideoStream = Object.values(participant.videoStreams).find((i) => i.mediaStreamType === 'Video');
      const screenShareStream = Object.values(participant.videoStreams).find(
        (i) => i.mediaStreamType === 'ScreenSharing'
      );

      let createViewResult: CreateViewResult | undefined = undefined;
      if (remoteVideoStream && remoteVideoStream.isAvailable && !remoteVideoStream.view) {
        createViewResult = await callClient.createView(call.id, participant.identifier, remoteVideoStream, options);
      }

      if (screenShareStream && screenShareStream.isAvailable && !screenShareStream.view) {
        // Hardcoded `scalingMode` since it is highly unlikely that CONTOSO would ever want to use a different scaling mode for screenshare.
        // Using `Crop` would crop the contents of screenshare and `Stretch` would warp it.
        // `Fit` is the only mode that maintains the integrity of the screen being shared.
        createViewResult = await callClient.createView(call.id, participant.identifier, screenShareStream, {
          scalingMode: 'Fit'
        });
      }

      return createViewResult?.view ? { view: createViewResult?.view } : undefined;
    };

    const onDisposeRemoteStreamView = async (userId: string): Promise<void> => {
      if (!call) {
        return;
      }
      const callState = callClient.getState().calls[call.id];
      if (!callState) {
        throw new Error(`Call Not Found: ${call.id}`);
      }

      const participant = Object.values(callState.remoteParticipants).find(
        (participant) => toFlatCommunicationIdentifier(participant.identifier) === userId
      );

      if (!participant || !participant.videoStreams) {
        return;
      }

      const remoteVideoStream = Object.values(participant.videoStreams).find((i) => i.mediaStreamType === 'Video');
      const screenShareStream = Object.values(participant.videoStreams).find(
        (i) => i.mediaStreamType === 'ScreenSharing'
      );

      if (remoteVideoStream && remoteVideoStream.view) {
        callClient.disposeView(call.id, participant.identifier, remoteVideoStream);
      }

      if (screenShareStream && screenShareStream.view) {
        callClient.disposeView(call.id, participant.identifier, screenShareStream);
      }
    };

    const onDisposeLocalStreamView = async (): Promise<void> => {
      // If the user is currently in a call, dispose of the local stream view attached to that call.
      const callState = call && callClient.getState().calls[call.id];
      const localStream = callState?.localVideoStreams.find((item) => item.mediaStreamType === 'Video');
      if (call && callState && localStream) {
        callClient.disposeView(call.id, undefined, localStream);
      }

      // If the user is not in a call we currently assume any unparented view is a LocalPreview and stop all
      // since those are only used for LocalPreview currently.
      // TODO: we need to remember which LocalVideoStream was used for LocalPreview and dispose that one.
      await disposeAllLocalPreviewViews(callClient);
    };

    /* @conditional-compile-remove(dialpad) */ /* @conditional-compile-remove(PSTN-calls) */
    const onSendDtmfTone = async (dtmfTone: DtmfTone): Promise<void> => await call?.sendDtmf(dtmfTone);

    const notImplemented = () => {
      throw new Error('Not implemented, cannot call a method from an abstract object');
    };

    return {
      onHangUp,
      /* @conditional-compile-remove(PSTN-calls) */
      onToggleHold,
      onSelectCamera,
      onSelectMicrophone,
      onSelectSpeaker,
      onStartScreenShare,
      onStopScreenShare,
      onToggleCamera,
      onToggleMicrophone,
      onToggleScreenShare,
      onCreateLocalStreamView,
      onCreateRemoteStreamView,
      onStartLocalVideo,
      onDisposeRemoteStreamView,
      onDisposeLocalStreamView,
      onAddParticipant: notImplemented,
      onRemoveParticipant: notImplemented,
      onStartCall: notImplemented,
      /* @conditional-compile-remove(dialpad) */ /* @conditional-compile-remove(PSTN-calls) */ onSendDtmfTone
    };
  }
);
