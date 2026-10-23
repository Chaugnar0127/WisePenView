import fs from 'node:fs';

const [basePackagePath, headPackagePath] = process.argv.slice(2);

if (!basePackagePath || !headPackagePath) {
  console.error('用法：node scripts/check-release-pr.mjs <基线 package.json> <当前 package.json>');
  process.exit(1);
}

const basePackage = JSON.parse(fs.readFileSync(basePackagePath, 'utf8'));
const headPackage = JSON.parse(fs.readFileSync(headPackagePath, 'utf8'));
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const baseVersion = versionPattern.exec(basePackage.version);
const headVersion = versionPattern.exec(headPackage.version);

if (!baseVersion || !headVersion) {
  console.error('package.json version 必须是稳定的 x.y.z 格式');
  process.exit(1);
}

const expectedVersion = `${baseVersion[1]}.${baseVersion[2]}.${Number(baseVersion[3]) + 1}`;

if (headPackage.version !== expectedVersion) {
  console.error(`版本 PR 必须将补丁版本从 ${basePackage.version} 递增到 ${expectedVersion}`);
  process.exit(1);
}

delete basePackage.version;
delete headPackage.version;

if (JSON.stringify(basePackage) !== JSON.stringify(headPackage)) {
  console.error('版本 PR 只能修改 package.json 的 version 字段');
  process.exit(1);
}

console.log(`版本校验通过：${baseVersion[0]} -> ${headVersion[0]}`);
