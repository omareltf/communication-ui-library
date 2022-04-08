// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  IPersonaStyleProps,
  IPersonaStyles,
  IStyleFunctionOrObject,
  PersonaInitialsColor,
  PersonaPresence,
  PersonaSize
} from '@fluentui/react';

/**
 * Options that can be injected into the `onRender` function for customizing an
 * Avatar (`Persona`) component.
 *
 * @public
 */
export type CustomAvatarOptions = {
  /** Persona coin size in pixels  */
  coinSize?: number;
  /** Only show Coin and Initials  */
  hidePersonaDetails?: boolean;
  /** Text color of initials inside the coin  */
  initialsTextColor?: string;
  /** Optional property to set the aria label of the video tile if there is no available stream. */
  noVideoAvailableAriaLabel?: string;
  /** User status  */
  presence?: PersonaPresence;
  /** Preset Persona Size number  */
  size?: PersonaSize;
  /** Custom style for the Avatar  */
  styles?: IStyleFunctionOrObject<IPersonaStyleProps, IPersonaStyles>;
  /** Display name to be used in Persona  */
  text?: string;
};

/**
 * Custom data attributes for displaying avatar for a user.
 *
 * @public
 */
export type AvatarPersonaData = {
  /**
   * Primary text to display, usually the name of the person.
   */
  text?: string;
  /**
   * Image URL to use, should be a square aspect ratio and big enough to fit in the image area.
   */
  imageUrl?: string;
  /**
   * The user's initials to display in the image area when there is no image.
   * @defaultvalue Derived from `text`
   */
  imageInitials?: string;
  /**
   * The background color when the user's initials are displayed.
   * @defaultvalue Derived from `text`
   */
  initialsColor?: PersonaInitialsColor | string;
  /**
   * The text color when the user's initials are displayed
   * @defaultvalue `white`
   */
  initialsTextColor?: string;
};

/**
 * Callback function used to provide custom data to build an avatar for a user.
 *
 * @public
 */
export type AvatarPersonaDataCallback = (userId: string) => Promise<AvatarPersonaData>;

/**
 * A custom rendered callback that allows users to customize the rendering of a Persona Component.
 *
 * @public
 */
export type OnRenderAvatarCallback = (
  /**
   * An Communication user ID.
   */
  userId?: string,
  options?: CustomAvatarOptions,
  /**
   * A default `onRender` component that can be used to render the default avatar.
   * Pass the `options` to the `onRender` component for default rendering.
   */
  defaultOnRender?: (props: CustomAvatarOptions) => JSX.Element
) => JSX.Element;
