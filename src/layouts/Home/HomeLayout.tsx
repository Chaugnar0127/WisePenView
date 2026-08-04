import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import LandingNavbar from '@/layouts/Home/_components/LandingNavbar';
import clsx from 'clsx';
import { Outlet } from 'react-router-dom';
import styles from './HomeLayout.module.less';

function HomeLayout() {
  const desktopWindow = useDesktopWindowState();
  const titleBarInsetStart =
    desktopWindow.hasTitleBarInset && desktopWindow.titleBarInsetSide === 'start';
  const titleBarInsetEnd =
    desktopWindow.hasTitleBarInset && desktopWindow.titleBarInsetSide === 'end';

  return (
    <div className={styles.root}>
      <div
        className={clsx(
          styles.navShell,
          desktopWindow.isDesktop && styles.desktopNavShell,
          titleBarInsetStart && styles.titleBarInsetStart,
          titleBarInsetEnd && styles.titleBarInsetEnd
        )}
      >
        <LandingNavbar activeKey="1" />
      </div>

      <div className={styles.outlet}>
        <Outlet />
      </div>

      <footer className={styles.footer}>
        <div className={styles.waveWrap} aria-hidden>
          <svg
            className={styles.waveSvg}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            preserveAspectRatio="none"
            x="0px"
            y="0px"
            viewBox="0 0 2560 100"
            xmlSpace="preserve"
          >
            <polygon points="2560 0 2560 100 0 100" />
          </svg>
        </div>

        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandText}>WisePen</div>
          </div>

          <div className={styles.divider} role="separator" aria-hidden />

          <div className={styles.copyright}>
            <div>Copyright © 2026. Fudan University & Oriole Software All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomeLayout;
