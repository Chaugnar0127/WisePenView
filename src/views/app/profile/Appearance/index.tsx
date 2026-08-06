import {
  Heading,
  Paragraph,
  Separator,
  Switch,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';

import { changeAppLanguage } from '@/i18n';
import type { SupportedLanguage } from '@/i18n/resources';
import {
  COLOR_SCHEME_OPTIONS,
  THEME_MODE_OPTIONS,
  THEME_RADIUS_OPTIONS,
  useAccentNeutralized,
  useAppTheme,
  useColorScheme,
  useThemeShape,
  type ColorScheme,
  type ColorSchemeOption,
  type ThemeMode,
  type ThemeRadius,
  type ThemeRadiusOption,
} from '@/theme';

import layout from '../style.module.less';
import styles from './style.module.less';

type ThemeModeSectionProps = {
  value: string;
  onChange: (mode: ThemeMode) => void;
};

function ThemeModeSection({ value, onChange }: ThemeModeSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <section className={styles.section}>
      <Heading level={3} className={layout.sectionTitle}>
        {t('appearance.mode')}
      </Heading>
      <Tabs
        className={styles.modeTabs}
        selectedKey={value}
        onSelectionChange={(next) => onChange(String(next) as ThemeMode)}
      >
        <Tabs.ListContainer className={styles.modeTabsListContainer}>
          <Tabs.List className={styles.modeTabsList} aria-label={t('appearance.mode')}>
            {THEME_MODE_OPTIONS.map((option) => (
              <Tabs.Tab key={option.id} id={option.id} className={styles.modeTab}>
                {t(option.labelKey)}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </section>
  );
}

type ColorSchemeSectionProps = {
  value: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
};

function ColorSchemeSection({ value, onChange }: ColorSchemeSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <section className={styles.section}>
      <Heading level={3} className={layout.sectionTitle}>
        {t('appearance.colorScheme')}
      </Heading>
      <div className={styles.schemeGrid}>
        <ToggleButtonGroup
          aria-label={t('appearance.colorScheme')}
          selectionMode="single"
          selectedKeys={new Set([value])}
          onSelectionChange={(keys) => {
            const [key] = [...keys];
            if (key != null) onChange(String(key) as ColorScheme);
          }}
          className={styles.schemeGroup}
          orientation="horizontal"
          isDetached
        >
          {COLOR_SCHEME_OPTIONS.map((option) => (
            <SchemeOption key={option.id} option={option} />
          ))}
        </ToggleButtonGroup>
      </div>
    </section>
  );
}

type ThemeShapeSectionProps = {
  radius: ThemeRadius;
  onRadiusChange: (radius: ThemeRadius) => void;
};

function ThemeShapeSection({ radius, onRadiusChange }: ThemeShapeSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <section className={styles.section}>
      <Heading level={3} className={layout.sectionTitle}>
        {t('appearance.radius')}
      </Heading>
      <div className={styles.shapeControls}>
        <ShapeOptionGroup
          label="Radius"
          value={radius}
          options={THEME_RADIUS_OPTIONS}
          onChange={onRadiusChange}
        />
      </div>
    </section>
  );
}

function ReadingModeSection() {
  const { t } = useTranslation('profile');
  const { isAccentNeutralized, setAccentNeutralized } = useAccentNeutralized();

  return (
    <section className={styles.section}>
      <div className={styles.switchRow}>
        <div className={styles.switchCopy}>
          <Heading level={3} className={layout.sectionTitle}>
            {t('appearance.readingMode.title')}
          </Heading>
          <Paragraph size="sm" color="muted" className={styles.switchDescription}>
            {t('appearance.readingMode.description')}
          </Paragraph>
        </div>
        <Switch
          size="md"
          aria-label={t('appearance.readingMode.title')}
          isSelected={isAccentNeutralized}
          onChange={setAccentNeutralized}
        >
          <Switch.Content className={styles.switchContent}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </div>
    </section>
  );
}

type ShapeOptionGroupProps = {
  label: string;
  value: ThemeRadius;
  options: ThemeRadiusOption[];
  onChange: (radius: ThemeRadius) => void;
};

function ShapeOptionGroup({ label, value, options, onChange }: ShapeOptionGroupProps) {
  return (
    <div className={styles.shapeGroupBlock}>
      <ToggleButtonGroup
        aria-label={label}
        selectionMode="single"
        selectedKeys={new Set([value])}
        onSelectionChange={(keys) => {
          const [key] = [...keys];
          if (key != null) onChange(String(key) as ThemeRadius);
        }}
        className={styles.shapeGroup}
        orientation="horizontal"
        isDetached
      >
        {options.map((option) => {
          const pxLabel = option.description;
          return (
            <ToggleButton
              key={option.id}
              id={option.id}
              data-radius={option.id}
              className={styles.shapeOption}
              aria-label={`${label} ${option.label} ${pxLabel}`}
            >
              <span className={styles.shapeCorner} aria-hidden />
              <span className={styles.shapeMeta}>
                <span className={styles.shapeLabel}>{option.label}</span>
                <span className={styles.shapeValue}>{pxLabel}</span>
              </span>
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </div>
  );
}

type SchemeOptionProps = {
  option: ColorSchemeOption;
};

function SchemeOption({ option }: SchemeOptionProps) {
  const { t } = useTranslation('profile');

  return (
    <ToggleButton id={option.id} data-scheme-preview={option.id} className={styles.schemeOption}>
      <span className={styles.schemePreview}>
        <span className={styles.schemeSwatch} />
        <span className={styles.schemeSwatch} />
        <span className={styles.schemeSwatch} />
      </span>
      <span className={styles.schemeLabel}>{t(option.labelKey)}</span>
      <span className={styles.schemeDescription}>{t(option.descriptionKey)}</span>
    </ToggleButton>
  );
}

function AppearanceHeader() {
  const { t } = useTranslation('profile');

  return (
    <header className={layout.pageHeader}>
      <Heading level={1} className={layout.pageTitle}>
        {t('appearance.title')}
      </Heading>
      <Paragraph size="sm" color="muted" className={layout.pageSubtitle}>
        {t('appearance.subtitle')}
      </Paragraph>
    </header>
  );
}

function LanguageSection() {
  const { i18n, t } = useTranslation(['profile', 'common']);
  const selectedLanguage: SupportedLanguage = i18n.resolvedLanguage === 'en-US' ? 'en-US' : 'zh-CN';

  return (
    <section className={styles.section}>
      <Heading level={3} className={layout.sectionTitle}>
        {t('appearance.language')}
      </Heading>
      <Tabs
        className={styles.modeTabs}
        selectedKey={selectedLanguage}
        onSelectionChange={(next) => void changeAppLanguage(String(next) as SupportedLanguage)}
      >
        <Tabs.ListContainer className={styles.modeTabsListContainer}>
          <Tabs.List className={styles.modeTabsList} aria-label={t('appearance.languageAria')}>
            <Tabs.Tab id="zh-CN" className={styles.modeTab}>
              {t('language.zhCN', { ns: 'common' })}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="en-US" className={styles.modeTab}>
              {t('language.enUS', { ns: 'common' })}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </section>
  );
}

function Appearance() {
  const { theme, setTheme } = useAppTheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { radius, setRadius } = useThemeShape();

  return (
    <div className={layout.pageContainer}>
      <AppearanceHeader />
      <div className={styles.body}>
        <LanguageSection />
        <Separator className={styles.divider} />
        <ThemeModeSection value={theme} onChange={setTheme} />
        <Separator className={styles.divider} />
        <ColorSchemeSection value={colorScheme} onChange={setColorScheme} />
        <Separator className={styles.divider} />
        <ReadingModeSection />
        <Separator className={styles.divider} />
        <ThemeShapeSection radius={radius} onRadiusChange={setRadius} />
      </div>
    </div>
  );
}

export default Appearance;
