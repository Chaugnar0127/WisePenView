import AppIconButton from '@/components/Button/AppIconButton';
import { SIDEBAR_TOGGLE_BUTTON_PROPS } from '@/layouts/_common/a11y/sidebarToggle';
import { ArrowLeft, ArrowRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './AppNavigationControls.module.less';

interface AppNavigationControlsProps {
  sidebarCollapsed: boolean;
  showHistory?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onToggleSidebar: () => void;
}

function AppNavigationControls({
  sidebarCollapsed,
  showHistory = true,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onToggleSidebar,
}: AppNavigationControlsProps) {
  const { t } = useTranslation('shell');
  const sidebarLabel = sidebarCollapsed
    ? t('navigation.expandSidebar')
    : t('navigation.collapseSidebar');

  return (
    <div className={styles.root}>
      <AppIconButton
        icon={
          sidebarCollapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" />
          )
        }
        label={sidebarLabel}
        onPress={onToggleSidebar}
        {...SIDEBAR_TOGGLE_BUTTON_PROPS}
      />
      {showHistory ? (
        <>
          <AppIconButton
            icon={<ArrowLeft size={18} aria-hidden="true" />}
            label={t('navigation.back')}
            isDisabled={!canGoBack}
            disabledVariant="ghost"
            onPress={onGoBack}
          />
          <AppIconButton
            icon={<ArrowRight size={18} aria-hidden="true" />}
            label={t('navigation.forward')}
            isDisabled={!canGoForward}
            disabledVariant="ghost"
            onPress={onGoForward}
          />
        </>
      ) : null}
    </div>
  );
}

export default AppNavigationControls;
