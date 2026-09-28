#!/usr/bin/env node
// Cross-checks a Capacitor plugin's npm, CocoaPods, SPM and Gradle manifests.
// Usage: node check_plugin.mjs <plugin-root>
// Exit code 0 = PASS, 1 = problems found, 2 = could not read the plugin.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Capacitor 8 requirements (capacitorjs.com/docs/updating/plugins/8-0)
const REQUIRED = { capMajor: 8, ios: "15.0", minSdk: 24, compileSdk: 36 };

const root = process.argv[2] ?? ".";
const problems = [];
const add = (file, msg) => problems.push(`${file}: ${msg}`);

function read(rel) {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

// ---- package.json ---------------------------------------------------------
const pkgRaw = read("package.json");
if (!pkgRaw) {
  console.error(`No package.json in ${root}. Pass the plugin root folder.`);
  process.exit(2);
}
const pkg = JSON.parse(pkgRaw);
const files = pkg.files ?? [];
const inFiles = (rel) =>
  files.some((f) => rel === f || rel.startsWith(f.replace(/\/?\*.*$/, "").replace(/\/$/, "") + "/"));

const peer = pkg.peerDependencies?.["@capacitor/core"];
const peerMajor = peer ? Number((peer.match(/\d+/) ?? [])[0]) : null;
if (peerMajor !== REQUIRED.capMajor) {
  add("package.json", `peerDependencies["@capacitor/core"] is "${peer}", expected ">=${REQUIRED.capMajor}.0.0"`);
}
if (!files.length) add("package.json", `"files" is empty; the npm tarball will ship nothing native`);

// ---- podspec --------------------------------------------------------------
const podspecName = readdirSync(root).find((f) => f.endsWith(".podspec"));
if (!podspecName) {
  add("(root)", "no *.podspec found; CocoaPods consumers cannot install this plugin");
} else {
  const pod = read(podspecName);
  if (!inFiles(podspecName)) add("package.json", `"files" does not include ${podspecName} (pod install will fail with "No podspec found")`);

  const name = pod.match(/s\.name\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if (name && `${name}.podspec` !== podspecName) add(podspecName, `s.name is "${name}" but file is ${podspecName}`);

  const ver = pod.match(/s\.version\s*=\s*(.+)/)?.[1]?.trim();
  if (ver && /^['"]/.test(ver)) {
    const hard = ver.replace(/['"]/g, "");
    if (hard !== pkg.version) add(podspecName, `s.version hard-coded to ${hard}, package.json is ${pkg.version}`);
    else add(podspecName, `s.version is hard-coded; use package['version'] to prevent future drift`);
  }

  const iosTarget = pod.match(/deployment_target\s*=\s*['"]([\d.]+)['"]/)?.[1];
  if (iosTarget !== REQUIRED.ios) add(podspecName, `ios.deployment_target is ${iosTarget}, expected ${REQUIRED.ios}`);
  if (!/s\.dependency\s+['"]Capacitor['"]/.test(pod)) add(podspecName, `missing s.dependency 'Capacitor'`);

  const src = pod.match(/source_files\s*=\s*['"]([^'"*]+)/)?.[1]?.replace(/\/$/, "");
  if (src && !existsSync(join(root, src))) add(podspecName, `source_files points at ${src}/, which does not exist`);
  if (src && !inFiles(src + "/x")) add("package.json", `"files" does not include ${src}/ (native sources missing from tarball)`);
}

// ---- Package.swift ---------------------------------------------------------
const spm = read("Package.swift");
if (!spm) {
  add("(root)", "no Package.swift; SPM consumers (default for new Capacitor 8 apps) cannot install this plugin");
} else {
  if (!inFiles("Package.swift")) add("package.json", `"files" does not include Package.swift`);
  const plat = spm.match(/\.iOS\(\.v(\d+)\)/)?.[1];
  if (`${plat}.0` !== REQUIRED.ios) add("Package.swift", `platforms is .iOS(.v${plat}), expected .iOS(.v${REQUIRED.ios.split(".")[0]})`);
  const capFrom = spm.match(/capacitor-swift-pm[^)]*from:\s*"(\d+)/)?.[1];
  if (Number(capFrom) !== REQUIRED.capMajor) add("Package.swift", `capacitor-swift-pm from: "${capFrom}.x", expected "${REQUIRED.capMajor}.0.0"`);
  for (const [, p] of spm.matchAll(/path:\s*"([^"]+)"/g)) {
    if (!existsSync(join(root, p))) add("Package.swift", `target path "${p}" does not exist`);
  }
}

// ---- Android --------------------------------------------------------------
const gradle = read("android/build.gradle");
if (!gradle) {
  add("(root)", "no android/build.gradle");
} else {
  if (!inFiles("android/build.gradle")) add("package.json", `"files" does not include android/`);
  const fallback = (key) => Number(gradle.match(new RegExp(`${key}[^\\n]*:\\s*(\\d+)`))?.[1]);
  const min = fallback("minSdkVersion");
  const compile = fallback("compileSdk");
  if (min !== REQUIRED.minSdk) add("android/build.gradle", `minSdkVersion fallback is ${min}, expected ${REQUIRED.minSdk}`);
  if (compile !== REQUIRED.compileSdk) add("android/build.gradle", `compileSdk fallback is ${compile}, expected ${REQUIRED.compileSdk}`);
  if (/kotlinOptions\s*\{/.test(gradle)) add("android/build.gradle", `kotlinOptions {} is deprecated; use kotlin { compilerOptions {} }`);
}

// ---- Result ---------------------------------------------------------------
if (problems.length === 0) {
  console.log(`PASS ${pkg.name}@${pkg.version} (npm, CocoaPods, SPM and Gradle agree)`);
  process.exit(0);
}
console.log(`FAIL ${problems.length} problem(s) in ${pkg.name}@${pkg.version}:`);
for (const p of problems) console.log(`  - ${p}`);
process.exit(1);
