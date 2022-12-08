// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

<<<<<<< Updated upstream
import React, { useMemo } from 'react';
import { CreateVideoStreamViewResult, OnRenderAvatarCallback, ParticipantState, VideoStreamOptions } from '../types';
=======
import { IContextualMenuProps, Layer, Stack } from '@fluentui/react';
import React, { useMemo } from 'react';
import {
  CreateVideoStreamViewResult,
  OnRenderAvatarCallback,
  ParticipantState,
  VideoGalleryRemoteParticipant,
  VideoStreamOptions
} from '../types';
import { _DrawerMenu, _DrawerMenuItemProps } from './Drawer';
>>>>>>> Stashed changes
import { StreamMedia } from './StreamMedia';
import {
  useRemoteVideoStreamLifecycleMaintainer,
  RemoteVideoStreamLifecycleMaintainerProps
} from './VideoGallery/useVideoStreamLifecycleMaintainer';
import { VideoTile } from './VideoTile';

/**
 * A memoized version of VideoTile for rendering remote participants. React.memo is used for a performance
 * boost by memoizing the same rendered component to avoid rerendering a VideoTile when its position in the
 * array changes causing a rerender in the parent component. https://reactjs.org/docs/react-api.html#reactmemo
 *
 * @internal
 */
export const _RemoteVideoTile = React.memo(
  (props: {
    userId: string;
    onCreateRemoteStreamView?: (
      userId: string,
      options?: VideoStreamOptions
    ) => Promise<void | CreateVideoStreamViewResult>;
    onDisposeRemoteStreamView?: (userId: string) => Promise<void>;
    isAvailable?: boolean;
    isReceiving?: boolean;
    isMuted?: boolean;
    isSpeaking?: boolean;
    isScreenSharingOn?: boolean; // TODO: Remove this once onDisposeRemoteStreamView no longer disposes of screen share stream
    renderElement?: HTMLElement;
    displayName?: string;
    remoteVideoViewOptions?: VideoStreamOptions;
    onRenderAvatar?: OnRenderAvatarCallback;
    showMuteIndicator?: boolean;
    showLabel?: boolean;
    personaMinSize?: number;
    participantState?: ParticipantState;
<<<<<<< Updated upstream
=======
    showRemoteVideoTileContextualMenu?: boolean;
    hostId?: string;
>>>>>>> Stashed changes
  }) => {
    const {
      isAvailable,
      isReceiving = true, // default to true to prevent any breaking change
      isMuted,
      isSpeaking,
      isScreenSharingOn,
      onCreateRemoteStreamView,
      onDisposeRemoteStreamView,
      remoteVideoViewOptions,
      renderElement,
      userId,
      displayName,
      onRenderAvatar,
      showMuteIndicator
    } = props;

    const remoteVideoStreamProps: RemoteVideoStreamLifecycleMaintainerProps = useMemo(
      () => ({
        isMirrored: remoteVideoViewOptions?.isMirrored,
        isScreenSharingOn,
        isStreamAvailable: isAvailable,
        isStreamReceiving: isReceiving,
        onCreateRemoteStreamView,
        onDisposeRemoteStreamView,
        remoteParticipantId: userId,
        renderElementExists: !!renderElement,
        scalingMode: remoteVideoViewOptions?.scalingMode
      }),
      [
        isAvailable,
        isReceiving,
        isScreenSharingOn,
        onCreateRemoteStreamView,
        onDisposeRemoteStreamView,
        remoteVideoViewOptions?.isMirrored,
        remoteVideoViewOptions?.scalingMode,
        renderElement,
        userId
      ]
    );

    // Handle creating, destroying and updating the video stream as necessary
    useRemoteVideoStreamLifecycleMaintainer(remoteVideoStreamProps);

    const showLoadingIndicator = isAvailable && isReceiving === false && props.participantState !== 'Disconnected';

    const renderVideoStreamElement = useMemo(() => {
      // Checking if renderElement is well defined or not as calling SDK has a number of video streams limitation which
      // implies that, after their threshold, all streams have no child (blank video)
      if (!renderElement || !renderElement.childElementCount) {
        // Returning `undefined` results in the placeholder with avatar being shown
        return undefined;
      }

      return (
        <StreamMedia videoStreamElement={renderElement} loadingState={showLoadingIndicator ? 'loading' : 'none'} />
      );
    }, [renderElement, showLoadingIndicator]);

    const [drawerMenuItems, setDrawerMenuItems] = React.useState<_DrawerMenuItemProps[]>([]);

    return (
<<<<<<< Updated upstream
      <VideoTile
        key={userId}
        userId={userId}
        renderElement={renderVideoStreamElement}
        displayName={displayName}
        onRenderPlaceholder={onRenderAvatar}
        isMuted={isMuted}
        isSpeaking={isSpeaking}
        showMuteIndicator={showMuteIndicator}
        personaMinSize={props.personaMinSize}
        showLabel={props.showLabel}
        /* @conditional-compile-remove(one-to-n-calling) */
        /* @conditional-compile-remove(PSTN-calls) */
        participantState={props.participantState}
      />
=======
      <>
        <VideoTile
          key={userId}
          userId={userId}
          renderElement={renderVideoStreamElement}
          displayName={remoteParticipant.displayName}
          onRenderPlaceholder={onRenderAvatar}
          isMuted={remoteParticipant.isMuted}
          isSpeaking={remoteParticipant.isSpeaking}
          showMuteIndicator={showMuteIndicator}
          personaMinSize={props.personaMinSize}
          showLabel={props.showLabel}
          /* @conditional-compile-remove(one-to-n-calling) */
          /* @conditional-compile-remove(PSTN-calls) */
          participantState={participantState}
          {...videoTileContextualMenuProps}
          onLongTouch={() => {
            console.log('long touch');
            setDrawerMenuItems([
              {
                itemKey: 'fit',
                text: 'Fit to screen',
                onItemClick: () => console.log('fit to screen')
              }
            ]);
          }}
        />
        {drawerMenuItems.length > 0 && (
          <Layer hostId={props.hostId} style={{ zIndex: 2, position: 'absolute' }}>
            <Stack
              styles={{
                root: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  // Any zIndex > 0 will work because this is the only absolutely
                  // positioned element in the container.
                  zIndex: 2
                }
              }}
            >
              <_DrawerMenu onLightDismiss={() => setDrawerMenuItems([])} items={drawerMenuItems} />
            </Stack>
          </Layer>
        )}
      </>
>>>>>>> Stashed changes
    );
  }
);
