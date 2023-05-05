// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationUserIdentifier } from '@azure/communication-common';
/* @conditional-compile-remove(rooms) */
import { Role } from '@azure/communication-react';
/* @conditional-compile-remove(teams-identity-support) */
import { fromFlatCommunicationIdentifier } from '@azure/communication-react';
/* @conditional-compile-remove(teams-identity-support) */
import { MicrosoftTeamsUserIdentifier } from '@azure/communication-common';
import { setLogLevel } from '@azure/logger';
import { initializeIcons, PrimaryButton, Spinner, Stack, createTheme, registerIcons } from '@fluentui/react';
import { CallAdapterLocator } from '@azure/communication-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AdapterArgs,
  buildTime,
  callingSDKVersion,
  communicationReactSDKVersion,
  createGroupId,
  fetchTokenResponse,
  getStartSessionFromURL,
  getGroupIdFromUrl,
  getOutboundParticipants,
  getTeamsLinkFromUrl,
  isLandscape,
  isOnIphoneAndNotSafari,
  navigateToHomePage,
  WEB_APP_TITLE
} from './utils/AppUtils';
/* @conditional-compile-remove(rooms) */
import { createRoom, getRoomIdFromUrl, addUserToRoom } from './utils/AppUtils';
import { useIsMobile } from './utils/useIsMobile';
import { useSecondaryInstanceCheck } from './utils/useSecondaryInstanceCheck';
import { CallError } from './views/CallError';
import { CallScreen } from './views/CallScreen';
import { HomeScreen } from './views/HomeScreen';
import { PageOpenInAnotherTab } from './views/PageOpenInAnotherTab';
import { UnsupportedBrowserPage } from './views/UnsupportedBrowserPage';
import { ClickToCallPage } from './views/ClickToCall';
import { SameOriginCallScreen } from './views/SameOriginCallScreen';
import { CallAdd20Regular, Dismiss20Regular } from '@fluentui/react-icons';

setLogLevel('warning');

console.log(
  `ACS sample calling app. Last Updated ${buildTime} Using @azure/communication-calling:${callingSDKVersion} and @azure/communication-react:${communicationReactSDKVersion}`
);

initializeIcons();
registerIcons({ icons: { dismiss: <Dismiss20Regular />, callAdd: <CallAdd20Regular /> } });

type AppPages = 'home' | 'call' | 'click-to-call' | 'same-origin-call';

const App = (): JSX.Element => {
  const [page, setPage] = useState<AppPages>('click-to-call');

  // User credentials to join a call with - these are retrieved from the server
  const [token, setToken] = useState<string>();
  const [userId, setUserId] = useState<
    CommunicationUserIdentifier | /* @conditional-compile-remove(teams-identity-support) */ MicrosoftTeamsUserIdentifier
  >();
  const [userCredentialFetchError, setUserCredentialFetchError] = useState<boolean>(false);

  // Call details to join a call - these are collected from the user on the home screen
  const [callLocator, setCallLocator] = useState<CallAdapterLocator>(createGroupId());
  const [displayName, setDisplayName] = useState<string>('');
  /* @conditional-compile-remove(rooms) */
  const [role, setRole] = useState<Role>();

  const [adapterArgs, setAdapterArgs] = useState<AdapterArgs | undefined>();

  /* @conditional-compile-remove(teams-identity-support) */
  const [isTeamsCall, setIsTeamsCall] = useState<boolean>(false);

  /* @conditional-compile-remove(PSTN-calls) */
  const [alternateCallerId, setAlternateCallerId] = useState<string | undefined>();

  const startSession = useMemo(() => {
    return getStartSessionFromURL();
  }, []);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      // console.log(event.data);
      if ((event.data as AdapterArgs).userId && (event.data as AdapterArgs).displayName !== '') {
        console.log(event.data);
        setAdapterArgs(event.data as AdapterArgs);
      }
    });
  }, []);

  useEffect(() => {
    if (startSession) {
      console.log('asking for args');
      if (window.opener) {
        window.opener.postMessage('args please', window.opener.origin);
      }
    }
  }, [startSession]);

  useEffect(() => {
    if (adapterArgs) {
      console.log('starting session');
      setPage('same-origin-call');
    }
  }, [adapterArgs]);

  // Get Azure Communications Service token from the server
  useEffect(() => {
    (async () => {
      try {
        const { token, user } = await fetchTokenResponse();
        setToken(token);
        setUserId(user);
      } catch (e) {
        console.error(e);
        setUserCredentialFetchError(true);
      }
    })();
  }, []);

  const isMobileSession = useIsMobile();
  const isLandscapeSession = isLandscape();
  const isAppAlreadyRunningInAnotherTab = useSecondaryInstanceCheck();

  useEffect(() => {
    if (isMobileSession && isLandscapeSession) {
      console.log('ACS Calling sample: Mobile landscape view is experimental behavior');
    }
  }, [isMobileSession, isLandscapeSession]);

  if (isMobileSession && isAppAlreadyRunningInAnotherTab) {
    return <PageOpenInAnotherTab />;
  }

  const supportedBrowser = !isOnIphoneAndNotSafari();
  if (!supportedBrowser) {
    return <UnsupportedBrowserPage />;
  }

  switch (page) {
    case 'home': {
      document.title = `home - ${WEB_APP_TITLE}`;
      // Show a simplified join home screen if joining an existing call
      const joiningExistingCall: boolean =
        !!getGroupIdFromUrl() ||
        !!getTeamsLinkFromUrl() ||
        /* @conditional-compile-remove(rooms) */ !!getRoomIdFromUrl();
      return (
        <Stack>
          <HomeScreen
            joiningExistingCall={joiningExistingCall}
            startCallHandler={async (callDetails) => {
              setDisplayName(callDetails.displayName);
              /* @conditional-compile-remove(PSTN-calls) */
              setAlternateCallerId(callDetails.alternateCallerId);
              let callLocator: CallAdapterLocator | undefined =
                callDetails.callLocator || getTeamsLinkFromUrl() || getGroupIdFromUrl();

              /* @conditional-compile-remove(rooms) */
              callLocator = callLocator || getRoomIdFromUrl();

              /* @conditional-compile-remove(PSTN-calls) */
              callLocator = callLocator || getOutboundParticipants(callDetails.outboundParticipants);

              /* @conditional-compile-remove(teams-adhoc-call) */
              callLocator = callLocator || getOutboundParticipants(callDetails.outboundTeamsUsers);

              callLocator = callLocator || createGroupId();

              /* @conditional-compile-remove(rooms) */
              // There is an API call involved with creating a room so lets only create one if we know we have to
              if (callDetails.option === 'StartRooms') {
                let roomId = '';
                try {
                  roomId = await createRoom();
                } catch (e) {
                  console.log(e);
                }

                callLocator = { roomId: roomId };
              }

              /* @conditional-compile-remove(rooms) */
              if ('roomId' in callLocator) {
                if (userId && 'communicationUserId' in userId) {
                  setRole(callDetails.role as Role);
                  await addUserToRoom(userId.communicationUserId, callLocator.roomId, callDetails.role as Role);
                } else {
                  throw 'Invalid userId!';
                }
              }
              setCallLocator(callLocator);

              // Update window URL to have a joinable link
              if (!joiningExistingCall) {
                window.history.pushState({}, document.title, window.location.origin + getJoinParams(callLocator));
              }
              /* @conditional-compile-remove(teams-identity-support) */
              setIsTeamsCall(!!callDetails.teamsToken);
              /* @conditional-compile-remove(teams-identity-support) */
              callDetails.teamsToken && setToken(callDetails.teamsToken);
              /* @conditional-compile-remove(teams-identity-support) */
              callDetails.teamsId &&
                setUserId(fromFlatCommunicationIdentifier(callDetails.teamsId) as MicrosoftTeamsUserIdentifier);
              setPage('call');
            }}
          />
          <PrimaryButton
            onClick={() => {
              setPage('click-to-call');
            }}
          >
            Go to click to call
          </PrimaryButton>
        </Stack>
      );
    }

    case 'call': {
      if (userCredentialFetchError) {
        document.title = `error - ${WEB_APP_TITLE}`;
        return (
          <CallError
            title="Error getting user credentials from server"
            reason="Ensure the sample server is running."
            rejoinHandler={() => setPage('call')}
            homeHandler={navigateToHomePage}
          />
        );
      }

      if (
        !token ||
        !userId ||
        (!displayName && /* @conditional-compile-remove(teams-identity-support) */ !isTeamsCall) ||
        !callLocator
      ) {
        document.title = `credentials - ${WEB_APP_TITLE}`;
        return <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
      }
      return (
        <React.StrictMode>
          <CallScreen
            token={token}
            userId={userId}
            displayName={displayName}
            callLocator={callLocator}
            /* @conditional-compile-remove(PSTN-calls) */
            alternateCallerId={alternateCallerId}
            /* @conditional-compile-remove(rooms) */
            roleHint={role}
            /* @conditional-compile-remove(teams-identity-support) */
            isTeamsIdentityCall={isTeamsCall}
          />
        </React.StrictMode>
      );
    }
    case 'click-to-call': {
      if (!token || !userId) {
        document.title = `credentials - ${WEB_APP_TITLE}`;
        return <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
      }
      return <ClickToCallPage token={token} userId={userId} displayName={displayName} callLocator={callLocator} />;
    }
    case 'same-origin-call': {
      if (!adapterArgs) {
        document.title = `credentials - ${WEB_APP_TITLE}`;
        return <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
      }
      return (
        <SameOriginCallScreen
          adapterArgs={{
            userId: adapterArgs.userId as CommunicationUserIdentifier,
            displayName: adapterArgs.displayName ?? '',
            token: adapterArgs.token,
            locator: adapterArgs.locator,
            alternateCallerId: adapterArgs.alternateCallerId
          }}
        />
      );
    }
    default:
      document.title = `error - ${WEB_APP_TITLE}`;
      return <>Invalid page</>;
  }
};

const getJoinParams = (locator: CallAdapterLocator): string => {
  if ('meetingLink' in locator) {
    return '?teamsLink=' + encodeURIComponent(locator.meetingLink);
  }
  /* @conditional-compile-remove(rooms) */
  if ('roomId' in locator) {
    return '?roomId=' + encodeURIComponent(locator.roomId);
  }
  /* @conditional-compile-remove(PSTN-calls) */
  if ('participantIds' in locator) {
    return '';
  }
  return '?groupId=' + encodeURIComponent(locator.groupId);
};

export default App;

export const kcupTheme = createTheme({
  palette: {
    themePrimary: '#3b2b2f',
    themeLighterAlt: '#070506',
    themeLighter: '#0d0a0b',
    themeLight: '#140f10',
    themeTertiary: '#1a1315',
    themeSecondary: '#f6d8d2',
    themeDarkAlt: '#271d1f',
    themeDark: '#2e2124',
    themeDarker: '#34262a',
    neutralLighterAlt: '#eeebe7',
    neutralLighter: '#efece8',
    neutralLight: '#f0edea',
    neutralQuaternaryAlt: '#f0eeeb',
    neutralQuaternary: '#f1efeb',
    neutralTertiaryAlt: '#f3f2ef',
    neutralTertiary: '#140f10',
    neutralSecondary: '#f3d1bd',
    neutralSecondaryAlt: '#1a1315',
    neutralPrimaryAlt: '#21181a',
    neutralPrimary: '#3b2b2f',
    neutralDark: '#2e2124',
    black: '#34262a',
    white: '#ece9e4'
  }
});
