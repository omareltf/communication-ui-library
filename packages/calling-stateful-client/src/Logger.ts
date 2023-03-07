// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { createClientLogger } from '@azure/logger';

/**
 * @private
 */
export const callingStatefulLogger = createClientLogger('communication-react:calling-stateful');

/**
 * @private
 */
export enum EventNames {
  // Info
  VIEW_RENDER_SUCCEED = 'VIEW_RENDER_SUCCEED',
  START_DISPOSE_STREAM = 'START_DISPOSE_STREAM',
  START_STREAM_RENDERING = 'START_STREAM_RENDERING',
  DISPOSING_RENDERER = 'DISPOSING_RENDERER',
  CREATING_VIEW = 'CREATING_VIEW',
  // Warning
  CREATE_STREAM_INVALID_PARAMS = 'CREATE_STREAM_INVALID_PARAMS',
  DISPOSE_STREAM_INVALID_PARAMS = 'DISPOSE_STREAM_INVALID_PARAMS',
  STREAM_ALREADY_RENDERED = 'STREAM_ALREADY_RENDERED',
  STREAM_ALREADY_DISPOSED = 'STREAM_ALREADY_DISPOSED',
  STREAM_STOPPING = 'STREAM_STOPPING',
  CREATED_STREAM_STOPPING = 'CREATED_STREAM_STOPPING',
  STREAM_RENDERING = 'STREAM_RENDERING',
  // Error
  STREAM_NOT_FOUND = 'STREAM_NOT_FOUND',
  RENDER_INFO_NOT_FOUND = 'RENDER_INFO_NOT_FOUND',
  DISPOSE_INFO_NOT_FOUND = 'DISPOSE_INFO_NOT_FOUND',
  RENDERER_NOT_FOUND = 'RENDERER_NOT_FOUND',

  CREATE_STREAM_FAIL = 'CREATE_STREAM_FAIL'
}
