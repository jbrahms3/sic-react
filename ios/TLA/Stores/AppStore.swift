import SwiftUI

/// Holds the local identity (userId is generated once and persisted) plus the
/// signed-in profile. Injected into the view tree via `.environment`.
@Observable
final class AppStore {
    private let userIdKey = "tla.userId"
    private let usernameKey = "tla.username"
    private let avatarKey = "tla.avatarImageId"

    let userId: String
    private(set) var username: String?
    private(set) var avatarImageId: String?

    var isOnboarded: Bool { (username?.isEmpty == false) }

    init() {
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: userIdKey) {
            userId = existing
        } else {
            let generated = UUID().uuidString
            defaults.set(generated, forKey: userIdKey)
            userId = generated
        }
        username = defaults.string(forKey: usernameKey)
        avatarImageId = defaults.string(forKey: avatarKey)
    }

    /// Persists the profile after a successful server save.
    func applyProfile(_ user: AppUser) {
        username = user.username
        avatarImageId = user.avatarImageId
        let defaults = UserDefaults.standard
        defaults.set(user.username, forKey: usernameKey)
        defaults.set(user.avatarImageId, forKey: avatarKey)
    }
}
