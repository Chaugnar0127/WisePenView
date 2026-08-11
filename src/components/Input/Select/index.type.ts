import type {
  SelectIndicatorProps as HeroSelectIndicatorProps,
  SelectPopoverProps as HeroSelectPopoverProps,
  SelectProps as HeroSelectProps,
  SelectTriggerProps as HeroSelectTriggerProps,
  SelectValueProps as HeroSelectValueProps,
} from '@heroui/react';
import type { ReactNode } from 'react';

export interface SelectProps<
  T extends object = object,
  M extends 'single' | 'multiple' = 'single',
> extends HeroSelectProps<T, M> {
  label?: ReactNode;
  labelClassName?: string;
}
export type SelectTriggerProps = HeroSelectTriggerProps;
export type SelectValueProps = HeroSelectValueProps;
export type SelectIndicatorProps = HeroSelectIndicatorProps;
export type SelectPopoverProps = HeroSelectPopoverProps;
