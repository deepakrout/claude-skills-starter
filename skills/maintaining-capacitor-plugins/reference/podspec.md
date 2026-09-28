# Podspec reference for Capacitor plugins

## Canonical podspec

```ruby
require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CapacitorEcho'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
end
```

## Field notes

| Field                  | Rule |
|------------------------|------|
| `s.name`               | Must match the pod name apps resolve. The podspec file name should be `<s.name>.podspec`. |
| `s.version`            | Read from `package.json`. A hard-coded value is the #1 cause of drift. |
| `s.source_files`       | Glob must match the real folder. The Capacitor 8 template uses `ios/Sources/`. |
| `s.ios.deployment_target` | Must equal the `Package.swift` platform (`15.0` ↔ `.v15`). |
| `s.dependency 'Capacitor'` | Required. Without it the plugin compiles against nothing. |

## Common pod install errors

| Error | Cause | Fix |
|-------|-------|-----|
| `No podspec found for 'CapacitorEcho'` | Podspec missing from the npm tarball | Add it to `package.json` `files` |
| `required a higher minimum deployment target` | App target lower than plugin | Raise app to 15.0 or lower plugin target |
| `Unable to find a specification for 'Capacitor'` | Stale CocoaPods repo | `pod repo update` |
