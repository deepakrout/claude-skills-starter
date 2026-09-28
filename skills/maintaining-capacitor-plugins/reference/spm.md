# Swift Package Manager reference

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorEcho",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "CapacitorEcho", targets: ["EchoPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "EchoPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/EchoPlugin"
        )
    ]
)
```

## Rules

- `platforms` must match the podspec deployment target.
- `path:` must point at a folder that exists and is listed (directly or by parent) in `package.json` `files`.
- `Package.swift` itself must be in `files`, or SPM consumers get nothing.
- The capacitor-swift-pm `from:` major must match the `@capacitor/core` major.
