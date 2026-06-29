import Foundation

/// Server-shaped models. All decoded off the main thread, so they are nonisolated.

nonisolated struct AppUser: Codable, Identifiable, Hashable {
    let id: String
    let username: String
    let avatarImageId: String?
}

nonisolated struct Post: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let username: String
    let avatarImageId: String?
    let day: String
    let acronym: String
    let caption: String
    let imageId: String
    let createdAt: Double
    var likeCount: Int
    var commentCount: Int
    var likedByMe: Bool
}

nonisolated struct Comment: Codable, Identifiable, Hashable {
    let id: String
    let text: String
    let createdAt: Double
    let username: String
    let avatarImageId: String?
    let userId: String
}

nonisolated struct DayEntry: Codable, Identifiable, Hashable {
    var id: String { day }
    let day: String
    let acronym: String
    let postCount: Int
}

nonisolated struct TodayInfo: Codable, Hashable {
    let day: String
    let acronym: String
    let msUntilNext: Double
    let postCount: Int
}

// Response envelopes.
nonisolated struct UserResponse: Codable { let user: AppUser }
nonisolated struct PostResponse: Codable { let post: Post }
nonisolated struct FeedResponse: Codable { let posts: [Post] }
nonisolated struct CommentsResponse: Codable { let comments: [Comment] }
nonisolated struct DaysResponse: Codable { let days: [DayEntry] }
nonisolated struct ProfileResponse: Codable { let user: AppUser; let posts: [Post] }
nonisolated struct ImageUploadResponse: Codable { let imageId: String }
