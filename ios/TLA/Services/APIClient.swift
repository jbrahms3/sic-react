import Foundation

nonisolated struct BackendError: LocalizedError {
    let status: Int
    let body: String
    var errorDescription: String? { "Request failed (\(status))" }
}

/// Thin async client for the TLA Cloudflare backend.
nonisolated enum APIClient {
    static var baseURL: URL {
        URL(string: Config.EXPO_PUBLIC_RORK_FUNCTIONS_URL)!
    }

    static func imageURL(_ imageId: String) -> URL {
        baseURL.appendingPathComponent("images").appendingPathComponent(imageId)
    }

    private static func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        query: [URLQueryItem] = [],
        body: Data? = nil,
        userId: String? = nil,
        decode: T.Type
    ) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        var req = URLRequest(url: components.url!)
        req.httpMethod = method
        if let userId { req.setValue(userId, forHTTPHeaderField: "X-User-Id") }
        if let body {
            req.httpBody = body
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        let http = response as! HTTPURLResponse
        guard (200..<300).contains(http.statusCode) else {
            throw BackendError(status: http.statusCode, body: String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private static func encode(_ value: [String: Any]) -> Data {
        (try? JSONSerialization.data(withJSONObject: value)) ?? Data()
    }

    // MARK: - Endpoints

    static func today() async throws -> TodayInfo {
        try await request("today", decode: TodayInfo.self)
    }

    static func days() async throws -> [DayEntry] {
        try await request("days", decode: DaysResponse.self).days
    }

    static func feed(day: String, sort: String, userId: String) async throws -> [Post] {
        try await request(
            "feed",
            query: [.init(name: "day", value: day), .init(name: "sort", value: sort)],
            userId: userId,
            decode: FeedResponse.self
        ).posts
    }

    static func uploadImage(base64: String) async throws -> String {
        try await request(
            "images",
            method: "POST",
            body: encode(["data": base64, "contentType": "image/jpeg"]),
            decode: ImageUploadResponse.self
        ).imageId
    }

    static func saveUser(userId: String, username: String, avatarImageId: String?) async throws -> AppUser {
        var payload: [String: Any] = ["username": username]
        if let avatarImageId { payload["avatarImageId"] = avatarImageId }
        return try await request(
            "users",
            method: "POST",
            body: encode(payload),
            userId: userId,
            decode: UserResponse.self
        ).user
    }

    static func createPost(userId: String, caption: String, imageId: String, day: String) async throws -> Post {
        try await request(
            "posts",
            method: "POST",
            body: encode(["caption": caption, "imageId": imageId, "day": day]),
            userId: userId,
            decode: PostResponse.self
        ).post
    }

    static func post(id: String, userId: String) async throws -> Post {
        try await request("posts/\(id)", userId: userId, decode: PostResponse.self).post
    }

    static func toggleLike(postId: String, userId: String) async throws -> Post {
        try await request("posts/\(postId)/like", method: "POST", userId: userId, decode: PostResponse.self).post
    }

    static func comments(postId: String) async throws -> [Comment] {
        try await request("posts/\(postId)/comments", decode: CommentsResponse.self).comments
    }

    static func addComment(postId: String, userId: String, text: String) async throws -> [Comment] {
        try await request(
            "posts/\(postId)/comments",
            method: "POST",
            body: encode(["text": text]),
            userId: userId,
            decode: CommentsResponse.self
        ).comments
    }

    static func profile(userId: String, viewerId: String) async throws -> ProfileResponse {
        try await request("profile/\(userId)", userId: viewerId, decode: ProfileResponse.self)
    }
}
