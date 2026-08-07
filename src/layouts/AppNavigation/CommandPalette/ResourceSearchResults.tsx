import { CommandGroup, CommandItem } from '@/components/_shadcn';
import { Empty, Spin } from '@/components/Feedback';
import EntryIcon from '@/components/Icons/EntryIcon';
import { useResourceService } from '@/domains';
import type { SearchHitItem, SearchResultPage } from '@/domains/Resource';
import { SEARCH_SCOPE } from '@/domains/Resource';
import { useOpenResource } from '@/hooks/useOpenResource';
import { useResourceNavigationStore } from '@/layouts/Resource/_store/useResourceNavigationStore';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useInfiniteScroll } from 'ahooks';
import { useEffect, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

const PAGE_SIZE = 20;

interface CommandSearchResultPage extends SearchResultPage {
  query: string;
}

interface ResourceSearchResultsProps {
  keyword: string;
  onSelect: () => void;
  viewportRef: RefObject<HTMLDivElement | null>;
}

const createEmptySearchResult = (query: string): CommandSearchResultPage => ({
  query,
  list: [],
  total: 0,
  page: 1,
  size: PAGE_SIZE,
  totalPage: 0,
});

const toPlainText = (markup: string): string => {
  const element = document.createElement('span');
  element.innerHTML = markup;
  return element.textContent ?? '';
};

function ResourceResultItem({ item, onSelect }: { item: SearchHitItem; onSelect: () => void }) {
  const openResource = useOpenResource();
  const plainName = toPlainText(item.resourceName);

  const handleSelect = () => {
    onSelect();
    openResource({
      resourceId: item.resourceId,
      resourceType: item.resourceType,
      resourceName: plainName,
      driveLocation: { scope: useResourceNavigationStore.getState().location.scope },
    });
  };

  return (
    <CommandItem
      value={`resource:${item.resourceId}`}
      keywords={[plainName, toPlainText(item.highlightContent ?? '')]}
      onSelect={handleSelect}
    >
      <span className={styles.resourceIcon}>
        <EntryIcon
          entryType="resource"
          resourceType={item.resourceType}
          resourceIconType={item.resourceIconType}
          size={18}
        />
      </span>
      <span className={styles.resourceText}>
        <span
          className={styles.resourceTitle}
          dangerouslySetInnerHTML={{ __html: item.resourceName }}
        />
        {item.highlightContent ? (
          <span
            className={styles.resourceSnippet}
            dangerouslySetInnerHTML={{ __html: item.highlightContent }}
          />
        ) : null}
      </span>
    </CommandItem>
  );
}

function ResourceSearchResults({ keyword, onSelect, viewportRef }: ResourceSearchResultsProps) {
  const { t } = useTranslation(['shell', 'resource']);
  const resourceService = useResourceService();
  const query = keyword.trim();

  const { data, loading, loadingMore, noMore, mutate } = useInfiniteScroll<CommandSearchResultPage>(
    async (current) => {
      if (!query) return createEmptySearchResult(query);

      const currentList = current?.query === query ? current.list : [];
      const nextPage = Math.floor(currentList.length / PAGE_SIZE) + 1;
      const result = await resourceService.globalSearch({
        keyword: query,
        scope: SEARCH_SCOPE.ALL,
        page: nextPage,
        size: PAGE_SIZE,
      });
      return { ...result, query };
    },
    {
      target: viewportRef,
      isNoMore: (result) => !!result && result.page >= result.totalPage,
      reloadDeps: [query],
      manual: !query,
      onError: (error) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  /**
   * @wisepen-manual-effect
   * 执行时机：标准化搜索词变化时复位滚动位置与无限列表缓存。
   * 不可替代原因：滚动位置和 useInfiniteScroll 缓存属于 React 渲染之外的命令式状态。
   * cleanup：没有持续订阅或延迟任务，无需清理。
   */
  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    mutate(createEmptySearchResult(query));
  }, [query, mutate, viewportRef]);

  if (!query) return null;

  const items = data?.query === query ? data.list : [];
  const initialLoading = loading && items.length === 0;

  return (
    <CommandGroup
      value="resource-search-results"
      heading={t('commandPalette.groups.resources', { ns: 'shell' })}
    >
      {initialLoading ? (
        <CommandItem
          value="resource-search-loading"
          textValue={t('commandPalette.searching', { ns: 'shell' })}
          disabled
          className={styles.resourceState}
        >
          <Spin size="small" />
          <span>{t('commandPalette.searching', { ns: 'shell' })}</span>
        </CommandItem>
      ) : items.length > 0 ? (
        <>
          {items.map((item) => (
            <ResourceResultItem key={item.resourceId} item={item} onSelect={onSelect} />
          ))}
          {loadingMore ? (
            <CommandItem
              value="resource-search-loading-more"
              textValue={t('commandPalette.searching', { ns: 'shell' })}
              disabled
              className={styles.loadingMore}
            >
              <Spin size="small" />
            </CommandItem>
          ) : null}
          {!loadingMore && noMore ? (
            <CommandItem
              value="resource-search-complete"
              textValue={t('search.allResultsShown', { ns: 'resource' })}
              disabled
              className={styles.resultFooter}
            >
              {t('search.allResultsShown', { ns: 'resource' })}
            </CommandItem>
          ) : null}
        </>
      ) : (
        <CommandItem
          value="resource-search-empty"
          textValue={t('search.noResults', { ns: 'resource' })}
          disabled
          className={styles.emptyState}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('search.noResults', { ns: 'resource' })}
          />
        </CommandItem>
      )}
    </CommandGroup>
  );
}

export default ResourceSearchResults;
