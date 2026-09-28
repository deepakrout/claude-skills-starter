# Android Gradle reference

```groovy
ext {
    junitVersion = project.hasProperty('junitVersion') ? rootProject.ext.junitVersion : '4.13.2'
}

android {
    namespace = "com.example.echo"
    compileSdk = project.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 36
    defaultConfig {
        minSdkVersion project.hasProperty('minSdkVersion') ? rootProject.ext.minSdkVersion : 24
        targetSdkVersion project.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 36
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}
```

## Notes

- The ternaries let the host app override values; the literal fallback is what the checker reads.
- Kotlin plugins: replace the deprecated `kotlinOptions { jvmTarget = ... }` with
  `kotlin { compilerOptions { jvmTarget = JvmTarget.JVM_21 } }`.
- The `android/` folder must be in `package.json` `files` (exclude `android/build/`).
