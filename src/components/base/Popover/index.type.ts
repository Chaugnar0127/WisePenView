import type { Popover as HeroPopover } from '@heroui/react';
import type { ComponentProps } from 'react';

export type PopoverRootProps = ComponentProps<typeof HeroPopover> & {
  contentDelay?: number;
  deferContent?: boolean;
};
