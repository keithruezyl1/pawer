require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'PawerWidget'
  s.version        = package['version']
  s.summary        = 'PAWER widget bridge (App Group + WidgetKit reload)'
  s.description    = 'Stores the precomputed widget state in an App Group for the WidgetKit extension.'
  s.author         = ''
  s.homepage       = 'https://github.com/keithruezyl1/pawer'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WidgetKit'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }

  # Only the bridge module compiles into the app; the extension under PawerWidget/ is unshipped.
  s.source_files = "PawerWidgetModule.swift"
end
