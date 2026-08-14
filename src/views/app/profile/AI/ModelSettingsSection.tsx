import { AppButton, AppIconButton } from '@/components/Button';
import { FormField, Input, Select } from '@/components/Input';
import { AppAlertDialog, AppFormDialog } from '@/components/Overlay';
import { useChatService } from '@/domains';
import type { ChatModelFamily, ChatProvider, ChatUserModel } from '@/domains/Chat';
import { useApi } from '@/hooks/useApi';
import { ListBox, Switch } from '@heroui/react';
import { Link, Pencil, Plus, Trash2, Unlink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

const MODEL_FAMILIES: ChatModelFamily[] = ['GENERIC', 'GPT', 'QWEN', 'CLAUDE', 'GEMINI'];

interface ModelFormState {
  displayName: string;
  modelFamily: ChatModelFamily;
  supportThinking: boolean;
  supportVision: boolean;
  contextWindowTokens: string;
  maxOutputTokens: string;
}

interface BindingTarget {
  model: ChatUserModel;
  providerId: string;
  providerName: string;
}

function createDefaultModelForm(): ModelFormState {
  return {
    displayName: '',
    modelFamily: 'GENERIC',
    supportThinking: false,
    supportVision: false,
    contextWindowTokens: '',
    maxOutputTokens: '',
  };
}

function parseOptionalPositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidOptionalPositiveInteger(value: string): boolean {
  return !value.trim() || parseOptionalPositiveInteger(value) != null;
}

function ModelSettingsSection() {
  const { t } = useTranslation('profile');
  const chatService = useChatService();
  const [models, setModels] = useState<ChatUserModel[]>([]);
  const [providers, setProviders] = useState<ChatProvider[]>([]);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ChatUserModel | null>(null);
  const [deleteModel, setDeleteModel] = useState<ChatUserModel | null>(null);
  const [unbindTarget, setUnbindTarget] = useState<BindingTarget | null>(null);
  const [modelForm, setModelForm] = useState<ModelFormState>(createDefaultModelForm);
  const [bindingForm, setBindingForm] = useState({
    providerId: '',
    providerModelName: '',
  });

  const { loading, runAsync: reload } = useApi(
    async () => {
      const [nextModels, nextProviders] = await Promise.all([
        chatService.getUserModels(),
        chatService.getUserProviders(),
      ]);
      return { models: nextModels, providers: nextProviders };
    },
    {
      onSuccess: (data) => {
        setModels(data.models);
        setProviders(data.providers);
      },
    }
  );
  const { loading: savingModel, runAsync: saveModel } = useApi(
    (form: ModelFormState) =>
      editingModel
        ? chatService.updateUserModel({
            modelId: editingModel.id,
            displayName: form.displayName,
            modelFamily: form.modelFamily,
            supportThinking: form.supportThinking,
            supportVision: form.supportVision,
            contextWindowTokens: parseOptionalPositiveInteger(form.contextWindowTokens),
            maxOutputTokens: parseOptionalPositiveInteger(form.maxOutputTokens),
          })
        : chatService.createUserModel({
            displayName: form.displayName,
            modelFamily: form.modelFamily,
            supportThinking: form.supportThinking,
            supportVision: form.supportVision,
            contextWindowTokens: parseOptionalPositiveInteger(form.contextWindowTokens),
            maxOutputTokens: parseOptionalPositiveInteger(form.maxOutputTokens),
          }),
    {
      manual: true,
      onSuccess: () => {
        setModelDialogOpen(false);
        void reload();
      },
    }
  );
  const { loading: savingBinding, runAsync: saveBinding } = useApi(
    (form: { model: ChatUserModel; providerId: string; providerModelName: string }) =>
      chatService.bindModelProvider({
        modelId: form.model.id,
        providerId: form.providerId,
        providerModelName: form.providerModelName,
      }),
    {
      manual: true,
      onSuccess: () => {
        setBindingDialogOpen(false);
        void reload();
      },
    }
  );
  const { loading: deletingModel, runAsync: removeModel } = useApi(
    (modelId: string) => chatService.deleteUserModel(modelId),
    {
      manual: true,
      onSuccess: () => {
        setDeleteModel(null);
        void reload();
      },
    }
  );
  const { loading: unbinding, runAsync: unbind } = useApi(
    (target: BindingTarget) => chatService.unbindModelProvider(target.model.id, target.providerId),
    {
      manual: true,
      onSuccess: () => {
        setUnbindTarget(null);
        void reload();
      },
    }
  );

  const openCreate = () => {
    setEditingModel(null);
    setModelForm(createDefaultModelForm());
    setModelDialogOpen(true);
  };

  const openEdit = (model: ChatUserModel) => {
    setEditingModel(model);
    setModelForm({
      displayName: model.displayName,
      modelFamily: model.modelFamily,
      supportThinking: model.supportThinking,
      supportVision: model.supportVision,
      contextWindowTokens: model.contextWindowTokens?.toString() ?? '',
      maxOutputTokens: model.maxOutputTokens?.toString() ?? '',
    });
    setModelDialogOpen(true);
  };

  const openBinding = (model: ChatUserModel) => {
    setBindingForm({
      providerId: providers[0]?.id ?? '',
      providerModelName: '',
    });
    setEditingModel(model);
    setBindingDialogOpen(true);
  };

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{t('ai.models.title')}</h2>
            <p>{t('ai.models.description')}</p>
          </div>
          <AppButton size="sm" variant="primary" onPress={openCreate}>
            <Plus size={16} aria-hidden="true" />
            {t('ai.models.add')}
          </AppButton>
        </div>
        {loading ? <div className={styles.empty}>{t('ai.loading')}</div> : null}
        {!loading && models.length === 0 ? (
          <div className={styles.empty}>{t('ai.models.empty')}</div>
        ) : null}
        <div className={styles.rows}>
          {models.map((model) => (
            <div className={styles.modelRow} key={model.id}>
              <div className={styles.rowCopy}>
                <strong>{model.displayName}</strong>
                <span>{t(`ai.modelFamily.${model.modelFamily}`)}</span>
                <div className={styles.mappingList}>
                  {model.mappings.length > 0 ? (
                    model.mappings.map((mapping) => (
                      <span className={styles.mapping} key={mapping.providerId}>
                        {mapping.providerName ?? mapping.providerId}: {mapping.providerModelName}
                        <AppIconButton
                          icon={<Unlink size={13} aria-hidden="true" />}
                          size="sm"
                          className={styles.unlinkButton}
                          label={t('ai.models.unbindAria', {
                            name: mapping.providerName ?? mapping.providerId,
                          })}
                          onClick={() =>
                            setUnbindTarget({
                              model,
                              providerId: mapping.providerId,
                              providerName: mapping.providerName ?? mapping.providerId,
                            })
                          }
                        />
                      </span>
                    ))
                  ) : (
                    <span>{t('ai.models.unbound')}</span>
                  )}
                </div>
              </div>
              <div className={styles.rowActions}>
                <AppButton size="sm" variant="ghost" onPress={() => openBinding(model)}>
                  <Link size={15} aria-hidden="true" />
                  {t('ai.models.bind')}
                </AppButton>
                <AppButton size="sm" variant="ghost" onPress={() => openEdit(model)}>
                  <Pencil size={15} aria-hidden="true" />
                  {t('ai.actions.edit')}
                </AppButton>
                <AppButton size="sm" variant="ghost" onPress={() => setDeleteModel(model)}>
                  <Trash2 size={15} aria-hidden="true" />
                  {t('ai.actions.delete')}
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AppFormDialog
        isOpen={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        title={editingModel ? t('ai.models.editTitle') : t('ai.models.addTitle')}
        description={t('ai.models.formDescription')}
        confirmText={t('ai.actions.save')}
        isSubmitting={savingModel}
        isSubmitDisabled={
          !modelForm.displayName.trim() ||
          !isValidOptionalPositiveInteger(modelForm.contextWindowTokens) ||
          !isValidOptionalPositiveInteger(modelForm.maxOutputTokens)
        }
        onSubmit={() => void saveModel({ ...modelForm, displayName: modelForm.displayName.trim() })}
      >
        <div className={styles.formFields}>
          <FormField
            label={t('ai.models.name')}
            value={modelForm.displayName}
            onChange={(displayName) => setModelForm((current) => ({ ...current, displayName }))}
            isRequired
          >
            <Input placeholder={t('ai.models.namePlaceholder')} autoFocus />
          </FormField>
          <Select
            label={t('ai.models.family')}
            value={modelForm.modelFamily}
            onChange={(value) => {
              if (typeof value === 'string') {
                setModelForm((current) => ({
                  ...current,
                  modelFamily: value as ChatModelFamily,
                }));
              }
            }}
            isRequired
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {MODEL_FAMILIES.map((family) => (
                  <ListBox.Item key={family} id={family} textValue={t(`ai.modelFamily.${family}`)}>
                    {t(`ai.modelFamily.${family}`)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <div className={styles.switchGrid}>
            <Switch
              size="md"
              isSelected={modelForm.supportThinking}
              aria-label={t('ai.models.supportThinking')}
              onChange={(supportThinking) =>
                setModelForm((current) => ({ ...current, supportThinking }))
              }
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span>{t('ai.models.supportThinking')}</span>
              </Switch.Content>
            </Switch>
            <Switch
              size="md"
              isSelected={modelForm.supportVision}
              aria-label={t('ai.models.supportVision')}
              onChange={(supportVision) =>
                setModelForm((current) => ({ ...current, supportVision }))
              }
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <span>{t('ai.models.supportVision')}</span>
              </Switch.Content>
            </Switch>
          </div>
          <FormField
            label={t('ai.models.contextWindowTokens')}
            description={t('ai.models.contextWindowTokensHint')}
            value={modelForm.contextWindowTokens}
            onChange={(contextWindowTokens) =>
              setModelForm((current) => ({ ...current, contextWindowTokens }))
            }
            isInvalid={!isValidOptionalPositiveInteger(modelForm.contextWindowTokens)}
          >
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder={t('ai.models.contextWindowTokensPlaceholder')}
            />
          </FormField>
          <FormField
            label={t('ai.models.maxOutputTokens')}
            description={t('ai.models.maxOutputTokensHint')}
            value={modelForm.maxOutputTokens}
            onChange={(maxOutputTokens) =>
              setModelForm((current) => ({ ...current, maxOutputTokens }))
            }
            isInvalid={!isValidOptionalPositiveInteger(modelForm.maxOutputTokens)}
          >
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder={t('ai.models.maxOutputTokensPlaceholder')}
            />
          </FormField>
          <p className={styles.capabilityNote}>{t('ai.models.streamingUnsupported')}</p>
        </div>
      </AppFormDialog>

      <AppFormDialog
        isOpen={bindingDialogOpen}
        onOpenChange={setBindingDialogOpen}
        title={t('ai.models.bindTitle')}
        description={t('ai.models.bindDescription')}
        confirmText={t('ai.models.bind')}
        isSubmitting={savingBinding}
        isSubmitDisabled={!bindingForm.providerId || !bindingForm.providerModelName.trim()}
        onSubmit={() => {
          if (editingModel) {
            void saveBinding({
              model: editingModel,
              providerId: bindingForm.providerId,
              providerModelName: bindingForm.providerModelName.trim(),
            });
          }
        }}
      >
        <div className={styles.formFields}>
          <Select
            label={t('ai.models.provider')}
            value={bindingForm.providerId}
            onChange={(value) => {
              if (typeof value === 'string')
                setBindingForm((current) => ({ ...current, providerId: value }));
            }}
            isRequired
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {providers.map((provider) => (
                  <ListBox.Item key={provider.id} id={provider.id} textValue={provider.name}>
                    {provider.name} ({provider.type})
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <FormField
            label={t('ai.models.providerModelName')}
            value={bindingForm.providerModelName}
            onChange={(providerModelName) =>
              setBindingForm((current) => ({ ...current, providerModelName }))
            }
            isRequired
          >
            <Input placeholder={t('ai.models.providerModelNamePlaceholder')} autoFocus />
          </FormField>
        </div>
      </AppFormDialog>

      <AppAlertDialog
        isOpen={deleteModel != null}
        onOpenChange={(open) => !open && setDeleteModel(null)}
        type="danger"
        title={t('ai.models.deleteTitle')}
        description={t('ai.models.deleteDescription', { name: deleteModel?.displayName })}
        confirmText={t('ai.actions.delete')}
        isConfirmLoading={deletingModel}
        onConfirm={() => {
          if (deleteModel) void removeModel(deleteModel.id);
        }}
      />
      <AppAlertDialog
        isOpen={unbindTarget != null}
        onOpenChange={(open) => !open && setUnbindTarget(null)}
        type="danger"
        title={t('ai.models.unbindTitle')}
        description={t('ai.models.unbindDescription', { name: unbindTarget?.providerName })}
        confirmText={t('ai.models.unbind')}
        isConfirmLoading={unbinding}
        onConfirm={() => {
          if (unbindTarget) void unbind(unbindTarget);
        }}
      />
    </>
  );
}

export default ModelSettingsSection;
