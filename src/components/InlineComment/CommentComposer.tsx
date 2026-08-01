import AppIconButton from '@/components/Button/AppIconButton';
import { Input } from '@/components/Input';
import { useImageService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { createUuid } from '@/utils/random/createUuid';
import { Button } from '@heroui/react';
import { useRequest, useUnmount } from 'ahooks';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import EmojiPicker from '@/components/EmojiPicker';
import type { InlineCommentProps, InlineCommentSubmitPayload } from './index.type';
import styles from './style.module.less';

const IMAGE_ONLY_CONTENT = '\u200B';

interface PendingImage {
  id: string;
  file: File;
}

interface CommentComposerProps {
  placeholder: string;
  imageUpload: InlineCommentProps['imageUpload'];
  onCancel?: () => void;
  onSubmit(payload: InlineCommentSubmitPayload): Promise<void>;
}

function PendingImagePreview({ image, onRemove }: { image: PendingImage; onRemove(): void }) {
  const { t } = useTranslation('common');
  const [previewUrl] = useState(() => URL.createObjectURL(image.file));
  useUnmount(() => URL.revokeObjectURL(previewUrl));

  return (
    <span className={styles.pendingImage}>
      <img src={previewUrl} alt={image.file.name} />
      <AppIconButton
        icon={<X size={12} aria-hidden />}
        label={t('inlineComment.removeImage', { name: image.file.name })}
        size="sm"
        className={styles.removeImageButton}
        onPress={onRemove}
      />
    </span>
  );
}

function CommentComposer({ placeholder, imageUpload, onCancel, onSubmit }: CommentComposerProps) {
  const { t } = useTranslation('common');
  const imageService = useImageService();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(createUuid);
  const [submitError, setSubmitError] = useState<string>();
  const canSubmit = Boolean(content.trim()) || pendingImages.length > 0;

  const appendImages = (files: File[]) => {
    if (imageUpload === false) return;
    const images = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ id: createUuid(), file }));
    if (images.length === 0) return;
    setPendingImages((currentImages) => [...currentImages, ...images]);
    setSubmitError(undefined);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    appendImages(files);
  };

  const { loading: submitting, runAsync: submitComment } = useRequest(
    async () => {
      if (!canSubmit) return;
      const imageUrls =
        imageUpload === false
          ? []
          : await Promise.all(
              pendingImages.map(async ({ file }) => {
                const result = await imageService.uploadImage({
                  file,
                  scene: imageUpload?.scene ?? 'PUBLIC_IMAGE_FOR_USER',
                  bizTag: imageUpload?.bizTag ?? 'inline-comment',
                });
                return result.publicUrl;
              })
            );
      await onSubmit({
        content: content.trim() || IMAGE_ONLY_CONTENT,
        imageUrls,
        idempotencyKey,
      });
      setContent('');
      setPendingImages([]);
      setIdempotencyKey(createUuid());
      setSubmitError(undefined);
    },
    {
      manual: true,
      onError: (error) => setSubmitError(parseErrorMessage(error)),
    }
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submitComment();
  };

  const showActions = Boolean(content.trim()) || pendingImages.length > 0;

  return (
    <div className={styles.composer}>
      <div className={styles.composerInputWrap}>
        <Input
          value={content}
          autoFocus
          disabled={submitting}
          className={styles.composerInput}
          aria-label={placeholder}
          placeholder={placeholder}
          onChange={(event) => setContent(event.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.composerInlineActions}>
          <EmojiPicker
            label={t('inlineComment.insertEmoji')}
            disabled={submitting}
            onSelect={(emojiId) => setContent((currentContent) => `${currentContent}${emojiId}`)}
          />
          {imageUpload !== false ? (
            <AppIconButton
              icon={<ImagePlus size={15} aria-hidden />}
              label={t('inlineComment.addImage')}
              size="sm"
              isDisabled={submitting}
              className={styles.imageButton}
              tooltip={{ content: t('inlineComment.addImage') }}
              onPress={() => imageInputRef.current?.click()}
            />
          ) : null}
        </div>
      </div>
      {imageUpload !== false ? (
        <input
          ref={imageInputRef}
          className={styles.imageInput}
          type="file"
          accept="image/*"
          multiple
          disabled={submitting}
          onChange={(event) => {
            appendImages(Array.from(event.target.files ?? []));
            event.currentTarget.value = '';
          }}
        />
      ) : null}

      {pendingImages.length > 0 ? (
        <div className={styles.pendingImages}>
          {pendingImages.map((image) => (
            <PendingImagePreview
              key={image.id}
              image={image}
              onRemove={() =>
                setPendingImages((currentImages) =>
                  currentImages.filter((currentImage) => currentImage.id !== image.id)
                )
              }
            />
          ))}
        </div>
      ) : null}

      {showActions ? (
        <div className={styles.composerActions}>
          {onCancel ? (
            <Button variant="ghost" size="sm" isDisabled={submitting} onPress={onCancel}>
              {t('actions.cancel')}
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            isDisabled={!canSubmit || submitting}
            aria-busy={submitting || undefined}
            onPress={() => void submitComment()}
          >
            {t('inlineComment.send')}
          </Button>
        </div>
      ) : null}

      {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
    </div>
  );
}

export default CommentComposer;
