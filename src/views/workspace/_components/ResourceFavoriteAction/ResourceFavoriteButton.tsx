import AppIconButton from '@/components/Button/AppIconButton';
import { Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResourceFavoriteButtonProps {
  isFavorited: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

function ResourceFavoriteButton({ isFavorited, isDisabled, onPress }: ResourceFavoriteButtonProps) {
  const { t } = useTranslation('resource');
  const label = isFavorited ? t('favorite.action.favorited') : t('favorite.action.favorite');
  return (
    <AppIconButton
      icon={<Bookmark size={16} aria-hidden="true" fill={isFavorited ? 'currentColor' : 'none'} />}
      label={label}
      size="sm"
      isActive={isFavorited}
      isDisabled={isDisabled}
      tooltip={{
        content: isFavorited
          ? t('favorite.action.manageCollections')
          : t('favorite.action.addToCollection'),
      }}
      onPress={onPress}
    />
  );
}

export default ResourceFavoriteButton;
