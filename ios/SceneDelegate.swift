import UIKit

// Adopts the UIScene lifecycle (required for apps built with the iOS 27 SDK).
// AppDelegate (RCTAppDelegate) still boots React Native in
// didFinishLaunchingWithOptions and builds the root view controller; this scene
// delegate moves that root view controller into a window attached to the scene.
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    // Take the root view controller RCTAppDelegate created and detach it
    // from the old, scene-less window.
    let previousWindow: UIWindow? = appDelegate.window
    let rootViewController = previousWindow?.rootViewController
    previousWindow?.rootViewController = nil
    previousWindow?.isHidden = true

    // Attach it to a window that belongs to this scene.
    let newWindow = UIWindow(windowScene: windowScene)
    newWindow.rootViewController = rootViewController
    newWindow.makeKeyAndVisible()

    window = newWindow
    appDelegate.window = newWindow
  }
}
