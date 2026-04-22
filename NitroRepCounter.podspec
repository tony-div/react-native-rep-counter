require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroRepCounter"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.license      = package["license"]

  s.platforms    = { :ios => min_ios_version_supported, :visionos => 1.0 }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}"
  ]

  load 'nitrogen/generated/ios/NitroRepCounter+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
