import SwiftUI

struct PostDetailView: View {
    let postId: String

    @Environment(AppStore.self) private var store

    @State private var post: Post?
    @State private var comments: [Comment] = []
    @State private var newComment: String = ""
    @State private var isSending = false
    @FocusState private var commentFocused: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let post {
                    Color(.tertiarySystemBackground)
                        .aspectRatio(1, contentMode: .fit)
                        .overlay { RemoteImage(imageId: post.imageId).allowsHitTesting(false) }
                        .clipped()

                    HStack(spacing: 14) {
                        Button { like(post) } label: {
                            HStack(spacing: 6) {
                                Image(systemName: post.likedByMe ? "heart.fill" : "heart")
                                    .foregroundStyle(post.likedByMe ? Theme.like : Theme.ink)
                                Text("\(post.likeCount)").contentTransition(.numericText())
                            }
                            .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            .foregroundStyle(Theme.ink)
                        }
                        .buttonStyle(.plain)

                        HStack(spacing: 6) {
                            Image(systemName: "bubble.right")
                            Text("\(comments.count)")
                        }
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(.secondary)

                        Spacer()
                        Text(post.acronym)
                            .font(.system(.caption, design: .rounded).weight(.heavy))
                            .foregroundStyle(Theme.ink)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(Theme.sunshineSoft, in: .capsule)
                    }
                    .padding(16)

                    HStack(alignment: .top, spacing: 8) {
                        AvatarView(imageId: post.avatarImageId, username: post.username, size: 28)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(post.username)
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            CaptionText(caption: post.caption, acronym: post.acronym,
                                        font: .system(.subheadline, design: .rounded))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)

                    Divider().padding(.horizontal, 16)

                    commentsSection
                } else {
                    ProgressView().frame(maxWidth: .infinity).padding(.top, 80)
                }
            }
        }
        .background(Theme.canvas)
        .navigationTitle("Post")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) { composer }
        .task { await load() }
    }

    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            if comments.isEmpty {
                Text("No comments yet — start the conversation.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.top, 16)
            }
            ForEach(comments) { comment in
                HStack(alignment: .top, spacing: 8) {
                    AvatarView(imageId: comment.avatarImageId, username: comment.username, size: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(comment.username)
                                .font(.system(.footnote, design: .rounded).weight(.semibold))
                            Text(comment.createdAt.timeAgo)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Text(comment.text)
                            .font(.system(.subheadline, design: .rounded))
                    }
                    Spacer()
                }
            }
        }
        .padding(16)
    }

    private var composer: some View {
        HStack(spacing: 10) {
            TextField("Add a comment…", text: $newComment, axis: .vertical)
                .font(.system(.subheadline, design: .rounded))
                .focused($commentFocused)
                .lineLimit(1...3)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(Theme.card, in: .capsule)
            Button { send() } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title)
                    .foregroundStyle(canSend ? Theme.accent : Theme.accent.opacity(0.4))
            }
            .disabled(!canSend || isSending)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.regularMaterial)
    }

    private var canSend: Bool {
        newComment.trimmingCharacters(in: .whitespacesAndNewlines).count >= 1
    }

    private func load() async {
        async let p = try? await APIClient.post(id: postId, userId: store.userId)
        async let c = try? await APIClient.comments(postId: postId)
        post = await p
        comments = await c ?? []
    }

    private func like(_ post: Post) {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        var updated = post
        updated.likedByMe.toggle()
        updated.likeCount += updated.likedByMe ? 1 : -1
        withAnimation(.snappy) { self.post = updated }
        Task {
            if let server = try? await APIClient.toggleLike(postId: post.id, userId: store.userId) {
                self.post = server
            }
        }
    }

    private func send() {
        let text = newComment.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        isSending = true
        newComment = ""
        commentFocused = false
        Task {
            if let updated = try? await APIClient.addComment(postId: postId, userId: store.userId, text: text) {
                withAnimation { comments = updated }
                if var p = post { p.commentCount = updated.count; post = p }
            }
            isSending = false
        }
    }
}
