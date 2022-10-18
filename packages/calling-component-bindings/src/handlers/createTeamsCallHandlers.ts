// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { StartCallOptions } from '@azure/communication-calling';
/* @conditional-compile-remove(teams-call) */
import { TeamsCall, TeamsCallAgent } from '@azure/communication-calling';
/* @conditional-compile-remove(dialpad) */ /* @conditional-compile-remove(PSTN-calls) */
/* @conditional-compile-remove(PSTN-calls) */
import { AddPhoneNumberOptions } from '@azure/communication-calling';
/* @conditional-compile-remove(PSTN-calls) */
import { CommunicationIdentifier, isCommunicationUserIdentifier } from '@azure/communication-common';
import { Common } from '@internal/acs-ui-common';
import { StatefulCallClient, StatefulDeviceManager } from '@internal/calling-stateful-client';
import memoizeOne from 'memoize-one';
import { ReactElement } from 'react';
import { isTeamsCallParticipants } from '../utils/callUtils';
import { CallingHandlersCommon, createDefaultCallingHandlersCommon } from './createHandlersCommon';

/**
 * Object containing all the teams call handlers required for calling components.
 *
 * Calling related components from this package are able to pick out relevant handlers from this object.
 * See {@link useHandlers} and {@link usePropsFor}.
 *
 * @beta
 */
export type TeamsCallingHandlers = Omit<CallingHandlersCommon, 'onStartCall'> & {
  onStartCall: (
    participants: CommunicationIdentifier[],
    options?: StartCallOptions
  ) => /* @conditional-compile-remove(teams-call) */ TeamsCall | undefined;
};

/**
 * Create the default implementation of {@link CallingHandlers} for teams call.
 *
 * Useful when implementing a custom component that utilizes the providers
 * exported from this library.
 *
 * @beta
 */
export const createDefaultTeamsCallingHandlers = memoizeOne(
  (
    callClient: StatefulCallClient,
    callAgent: /* @conditional-compile-remove(teams-call) */ TeamsCallAgent | undefined,
    deviceManager: StatefulDeviceManager | undefined,
    call: /* @conditional-compile-remove(teams-call) */ TeamsCall | undefined
  ): never | /* @conditional-compile-remove(teams-call) */ TeamsCallingHandlers => {
    const calingsHandlers = createDefaultCallingHandlersCommon(callClient, callAgent, deviceManager, call);
    return {
      ...calingsHandlers,
      onStartCall: (participants, options) => {
        const threadId = options?.threadId;
        if (!isTeamsCallParticipants(participants)) {
          throw new Error('CommunicationIdentifier in Teams call is not supported!');
        }
        return callAgent ? callAgent.startCall(participants, threadId ? { threadId } : undefined) : undefined;
      },
      onAddParticipant: async (participant: CommunicationIdentifier, options?: AddPhoneNumberOptions) => {
        const threadId = options?.threadId;
        if (isCommunicationUserIdentifier(participant)) {
          throw new Error('CommunicationIdentifier in Teams call is not supported!');
        }
        call?.addParticipant(participant, threadId ? { threadId } : undefined);
      },
      onRemoveParticipant: async (userId) => {
        await call?.removeParticipant({ microsoftTeamsUserId: userId });
      }
    };
  }
);

/**
 * Create a set of default handlers for given component. Memoization is applied to the result. Multiple invocations with
 * the same arguments will return the same handler instances. DeclarativeCallAgent, DeclarativeDeviceManager, and
 * DeclarativeCall may be undefined. If undefined, their associated handlers will not be created and returned.
 *
 * @param callClient - StatefulCallClient returned from
 *   {@link @azure/communication-react#createStatefulCallClient}.
 * @param callAgent - Instance of {@link @azure/communication-calling#TeamsCallClient}.
 * @param deviceManager - Instance of {@link @azure/communication-calling#DeviceManager}.
 * @param call - Instance of {@link @azure/communication-calling#TeamsCall}.
 * @param _ - React component that you want to generate handlers for.
 *
 * @beta
 */
export const createTeamsCallingHandlersForComponent = <Props>(
  callClient: StatefulCallClient,
  callAgent: /* @conditional-compile-remove(teams-call) */ TeamsCallAgent | undefined,
  deviceManager: StatefulDeviceManager | undefined,
  call: /* @conditional-compile-remove(teams-call) */ TeamsCall | undefined,
  _Component: (props: Props) => ReactElement | null
): Common<never | /* @conditional-compile-remove(teams-call) */ TeamsCallingHandlers, Props> => {
  return createDefaultTeamsCallingHandlers(callClient, callAgent, deviceManager, call);
};
