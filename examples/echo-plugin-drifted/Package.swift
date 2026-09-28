// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorEcho",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "CapacitorEcho", targets: ["EchoPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
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
