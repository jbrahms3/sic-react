import SwiftUI

struct ProfileView: View {
    let userId: String

    @Environment(AppStore.self) private var store
    @Environment(Nav.self) private var nav

    @State private var user: AppUser?
    @State private var posts: [Post] = []
    @State private var isLoading = true

    private let columns = [GridItem(.flexible(), spacing: 3), GridItem(.flexible(), spacing: 3), GridItem(.flexible(), spacing: 3)]

    private var isMe: Bool { userId == store.userId }
    private var totalLikes: Int { posts.reduce(0) { $0 + $1.likeCount } }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                AvatarView(imageId: user?.avatarImageId ?? (isMe ? store.avatarImageId : nil),
                           username: user?.username ?? store.username ?? "?", size: 88)
                    .padding(.top, 12)

                Text(user?.username ?? store.username ?? "you")
                    .font(.system(.title2, design: .rounded).weight(.bold))

                HStack(spacing: 36) {
                    stat(value: posts.count, label: "posts")
                    stat(value: totalLikes, label: "likes")
                }

                Button { nav.push(.days) } label: {
                    Label("Browse past days", systemImage: "calendar")
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18).padding(.vertical, 10)
                        .background(Theme.ink, in: .capsule)
                }

                if isLoading {
                    ProgressView().padding(.top, 30)
                } else if posts.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "square.grid.2x2")
                            .font(.system(size: 36)).foregroundStyle(.secondary)
                        Text(isMe ? "You haven't posted yet" : "No posts yet")
                            .font(.system(.subheadline, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)
                } else {
                    LazyVGrid(columns: columns, spacing: 3) {
                        ForEach(posts) { post in
                            Button { nav.push(.post(post.id)) } label: {
                                Color(.tertiarySystemBackground)
                                    .aspectRatio(1, contentMode: .fill)
                                    .overlay { RemoteImage(imageId: post.imageId).allowsHitTesting(false) }
                                    .overlay(alignment: .topTrailing) {
                                        Text(post.acronym)
                                            .font(.system(size: 9, weight: .heavy, design: .rounded))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 5).padding(.vertical, 2)
                                            .background(.black.opacity(0.4), in: .capsule)
                                            .padding(4)
                                    }
                                    .clipped()
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 3)
            .padding(.bottom, 24)
        }
        .background(Theme.canvas)
        .navigationTitle(isMe ? "Your profile" : "@\(user?.username ?? "")")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func stat(value: Int, label: String) -> some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(.title3, design: .rounded).weight(.bold))
            Text(label)
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    private func load() async {
        if let result = try? await APIClient.profile(userId: userId, viewerId: store.userId) {
            user = result.user
            posts = result.posts
        }
        isLoading = false
    }
}
