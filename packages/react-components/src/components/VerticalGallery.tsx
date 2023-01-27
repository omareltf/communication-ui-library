// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DefaultButton, Icon, IStyle, Stack, mergeStyles } from '@fluentui/react';
import React, { useMemo, useState } from 'react';
import { useTheme } from '../theming';
import { BaseCustomStyles } from '../types';
import { rootStyle, childrenContainerStyle, leftRightButtonStyles } from './styles/HorizontalGallery.styles';
import { useIdentifiers } from '../identifiers';

/**
 * {@link VerticalGallery} default children per page
 */
const DEFAULT_CHILDREN_PER_PAGE = 5;

/**
 * {@link VerticalGallery} Component Styles.
 * @public
 */
export interface VerticalGalleryStyles extends BaseCustomStyles {
  /** Styles for each child of {@link VerticalGallery} */
  children?: IStyle;
  /** Styles for navigation button to go to previous page */
  previousButton?: IStyle;
  /** Styles for navigation button to go to next page */
  nextButton?: IStyle;
}

/**
 * {@link VerticalGallery} Component Props.
 */
export interface VerticalGalleryProps {
  children: React.ReactNode;
  /**
   * Styles for VerticalGallery
   */
  styles?: VerticalGalleryStyles;
  /**
   * Children shown per page
   * @defaultValue 5
   */
  childrenPerPage?: number;
  containerHeight?: number;
}

/**
 * Renders a Vertical gallery that parents children Vertically. Handles pagination based on the childrenPerPage prop.
 * @param props - VerticalGalleryProps {@link @azure/communication-react#VerticalGalleryProps}
 * @returns
 */
export const VerticalGallery = (props: VerticalGalleryProps): JSX.Element => {
  const { children, childrenPerPage = DEFAULT_CHILDREN_PER_PAGE, styles } = props;

  const ids = useIdentifiers();

  const [page, setPage] = useState(0);

  const numberOfChildren = React.Children.count(children);
  const lastPage = Math.ceil(numberOfChildren / childrenPerPage) - 1;

  const paginatedChildren: React.ReactNode[][] = useMemo(() => {
    return bucketize(React.Children.toArray(children), childrenPerPage);
  }, [children, childrenPerPage]);

  // If children per page is 0 or less return empty element
  if (childrenPerPage <= 0) {
    return <></>;
  }

  const firstIndexOfCurrentPage = page * childrenPerPage;
  const clippedPage = firstIndexOfCurrentPage < numberOfChildren - 1 ? page : lastPage;
  const childrenOnCurrentPage = paginatedChildren[clippedPage];

  const showButtons = numberOfChildren > childrenPerPage;
  const disablePreviousButton = page === 0;
  const disableNextButton = page === lastPage;

  return (
    <Stack className={mergeStyles(rootStyle, props.styles?.root)}>
      <Stack className={mergeStyles(childrenContainerStyle, { '> *': props.styles?.children })}>
        {childrenOnCurrentPage}
      </Stack>
      {showButtons && (
        <Stack horizontal>
          <VerticalGalleryNavigationButton
            key="previous-nav-button"
            icon={<Icon iconName="VerticalGalleryLeftButton" />}
            styles={styles?.previousButton}
            onClick={() => setPage(Math.max(0, Math.min(lastPage, page - 1)))}
            disabled={disablePreviousButton}
            identifier={ids.horizontalGalleryLeftNavButton}
          />
          <VerticalGalleryNavigationButton
            key="next-nav-button"
            icon={<Icon iconName="VerticalGalleryRightButton" />}
            styles={styles?.nextButton}
            onClick={() => setPage(Math.min(lastPage, page + 1))}
            disabled={disableNextButton}
            identifier={ids.horizontalGalleryRightNavButton}
          />
        </Stack>
      )}
    </Stack>
  );
};

const VerticalGalleryNavigationButton = (props: {
  icon: JSX.Element;
  styles: IStyle;
  onClick?: () => void;
  disabled?: boolean;
  identifier?: string;
}): JSX.Element => {
  const theme = useTheme();
  return (
    <DefaultButton
      className={mergeStyles(leftRightButtonStyles(theme), props.styles)}
      onClick={props.onClick}
      disabled={props.disabled}
      data-ui-id={props.identifier}
    >
      {props.icon}
    </DefaultButton>
  );
};

function bucketize<T>(arr: T[], bucketSize: number): T[][] {
  const bucketArray: T[][] = [];

  if (bucketSize <= 0) {
    return bucketArray;
  }

  for (let i = 0; i < arr.length; i += bucketSize) {
    bucketArray.push(arr.slice(i, i + bucketSize));
  }

  return bucketArray;
}
