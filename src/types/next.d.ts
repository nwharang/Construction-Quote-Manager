// @ts-ignore
/* eslint-disable  @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
  requireAuth?: boolean;
};
