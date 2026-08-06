import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const repoRoot = process.cwd();
const runtimeIconDirectory = resolve(repoRoot, 'electron/assets/app-icons');
const buildDirectory = resolve(repoRoot, 'build');
const iconsetDirectory = resolve(buildDirectory, 'icon.iconset');
const icnsPath = resolve(buildDirectory, 'icon.icns');
const publicFaviconPath = resolve(repoRoot, 'public/favicon.svg');
const runtimeIconSize = 1024;
const desktopIconInset = 8;
const desktopIconRadius = 18;

const colorSchemeIconSources = {
  default: 'src/assets/logos/logo-icon-default.svg',
  floral: 'src/assets/logos/logo-icon-floral.svg',
  aqua: 'src/assets/logos/logo-icon-aqua.svg',
  sunset: 'src/assets/logos/logo-icon-sunset.svg',
  emerald: 'src/assets/logos/logo-icon-emerald.svg',
  lavender: 'src/assets/logos/logo-icon-lavender.svg',
};

const macIconsetSizes = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
];

function ensureTool(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
  } catch {
    throw new Error(`缺少 ${command}，请先安装后再生成桌面图标。`);
  }
}

function createMacIconSvg(sourcePath) {
  const sourceSvg = readFileSync(sourcePath, 'utf8');
  const background = [
    `<rect x="${desktopIconInset + 0.5}" y="${desktopIconInset + 0.5}"`,
    ` width="${100 - desktopIconInset * 2 - 1}" height="${100 - desktopIconInset * 2 - 1}"`,
    ` rx="${desktopIconRadius}"`,
    ' fill="#FFFFFF" stroke="#E6E8EB" stroke-width="1" />',
  ].join('');

  return sourceSvg.replace(/<svg([^>]*)>/u, `<svg$1>\n  ${background}`);
}

function renderSvg(svgPath, outputPath, size) {
  execFileSync('rsvg-convert', [
    '--width',
    String(size),
    '--height',
    String(size),
    '--output',
    outputPath,
    svgPath,
  ]);
}

async function main() {
  ensureTool('rsvg-convert');
  ensureTool('iconutil');

  await rm(runtimeIconDirectory, { recursive: true, force: true });
  await rm(iconsetDirectory, { recursive: true, force: true });
  mkdirSync(runtimeIconDirectory, { recursive: true });
  mkdirSync(iconsetDirectory, { recursive: true });
  mkdirSync(dirname(publicFaviconPath), { recursive: true });

  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'wisepen-icons-'));

  try {
    for (const [scheme, relativeSourcePath] of Object.entries(colorSchemeIconSources)) {
      const sourcePath = resolve(repoRoot, relativeSourcePath);
      if (!existsSync(sourcePath)) {
        throw new Error(`找不到图标源文件：${relativeSourcePath}`);
      }

      const composedSvgPath = join(temporaryDirectory, `${scheme}.svg`);
      writeFileSync(composedSvgPath, createMacIconSvg(sourcePath));
      renderSvg(composedSvgPath, join(runtimeIconDirectory, `${scheme}.png`), runtimeIconSize);

      if (scheme === 'default') {
        writeFileSync(publicFaviconPath, readFileSync(sourcePath, 'utf8'));

        for (const [filename, size] of macIconsetSizes) {
          renderSvg(composedSvgPath, join(iconsetDirectory, filename), size);
        }
      }
    }

    execFileSync('iconutil', ['--convert', 'icns', '--output', icnsPath, iconsetDirectory]);
    process.stdout.write('桌面图标已生成。\n');
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

await main();
