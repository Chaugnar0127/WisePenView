import type { Alert } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

export interface AppBannerClassNames {
  content?: string;
  action?: string;
}

export interface AppBannerProps extends Omit<ComponentProps<typeof Alert>, 'children'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode | false;
  children?: ReactNode;
  classNames?: AppBannerClassNames;
}
