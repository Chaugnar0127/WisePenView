import type { Modal as HeroModal } from '@heroui/react';
import type { ComponentProps } from 'react';

export type ModalRootProps = ComponentProps<typeof HeroModal> & {
  contentDelay?: number;
  deferContent?: boolean;
};

export type ModalBackdropProps = ComponentProps<typeof HeroModal.Backdrop> & {
  contentDelay?: number;
  deferContent?: boolean;
};

/** ModalRoot 下发给 Backdrop 的受控状态，避免调用方重复传入 isOpen / onOpenChange。 */
export interface ModalRootControlContextValue {
  contentDelay: number;
  defaultOpen?: boolean;
  deferContent: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}
