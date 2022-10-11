// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CallAgent, TeamsCallAgent } from '@azure/communication-calling';
import React, { createContext, useContext } from 'react';
import { isTeamsCallAgent } from '../handlers/createHandlers';

/**
 * @private
 */
export type CallAgentContextType = {
  callAgent: CallAgent | TeamsCallAgent | undefined;
};

/**
 * @private
 */
export const CallAgentContext = createContext<CallAgentContextType | undefined>(undefined);

/**
 * Arguments to initialize a {@link CallAgentProvider}.
 *
 * @public
 */
export interface CallAgentProviderProps {
  children: React.ReactNode;
  callAgent?: CallAgent | TeamsCallAgent;
}

const CallAgentProviderBase = (props: CallAgentProviderProps): JSX.Element => {
  const { callAgent } = props;

  const initialState: CallAgentContextType = {
    callAgent
  };

  return <CallAgentContext.Provider value={initialState}>{props.children}</CallAgentContext.Provider>;
};

/**
 * A {@link React.Context} that stores a {@link @azure/communication-calling#CallAgent}.
 *
 * Calling components from this package must be wrapped with a {@link CallAgentProvider}.
 *
 * @public
 */
export const CallAgentProvider = (props: CallAgentProviderProps): JSX.Element => <CallAgentProviderBase {...props} />;

/**
 * Hook to obtain {@link @azure/communication-calling#CallAgent} from the provider.
 *
 * Useful when implementing a custom component that utilizes the providers
 * exported from this library.
 *
 * @public
 */
export const useCallAgent = (): CallAgent | undefined => {
  const callAgent = useContext(CallAgentContext)?.callAgent;
  if (callAgent && isTeamsCallAgent(callAgent)) {
    throw new Error('TeamsCallAgent object was provided, try useTeamsCall() instead');
  }
  return callAgent;
};

/**
 * Hook to obtain {@link @azure/communication-calling#CallAgent} from the provider.
 *
 * Useful when implementing a custom component that utilizes the providers
 * exported from this library.
 *
 * @beta
 */
export const useTeamsCallAgent = (): TeamsCallAgent | undefined => {
  const callAgent = useContext(CallAgentContext)?.callAgent;
  if (callAgent && !isTeamsCallAgent(callAgent)) {
    throw new Error('Regular CallAgent object was provided, try useTeamsCall() instead');
  }
  return callAgent;
};
