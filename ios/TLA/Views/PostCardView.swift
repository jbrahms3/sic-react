import SwiftUI

struct PostCardView: View {
    let post: Post
    let onLike: () -> Void
    let onOpen: () -> Void
    let onOpenProfile: () -> Void

    @State private var heartPop = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button(action: onOpenProfile) {
                HStack(spacing: 10) {
                    AvatarView(imageId: post.avatarImageId, username: post.username)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(post.username)
                            .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            .foregroundStyle(Theme.ink)
                        Text(post.createdAt.timeAgo)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(post.acronym)
                        .font(.system(.caption, design: .rounded).weight(.heavy))
                        .foregroundStyle(Theme.ink)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Theme.sunshineSoft, in: .capsule)
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            // Photo
            Button(action: onOpen) {
                Color(.tertiarySystemBackground)
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        RemoteImage(imageId: post.imageId)
                            .allowsHitTesting(false)
                    }
                    .overlay(alignment: .bottomLeading) {
                        if heartPop {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 90))
                                .foregroundStyle(.white)
                                .shadow(radius: 12)
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                                .transition(.scale.combined(with: .opacity))
                        }
                    }
                    .clipped()
            }
            .buttonStyle(.plain)

            // Actions
            HStack(spacing: 18) {
                Button(action: like) {
                    HStack(spacing: 6) {
                        Image(systemName: post.likedByMe ? "heart.fill" : "heart")
                            .foregroundStyle(post.likedByMe ? Theme.like : Theme.ink)
                        Text("\(post.likeCount)")
                            .contentTransition(.numericText())
                            .foregroundStyle(Theme.ink)
                    }
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                }
                .buttonStyle(.plain)

                Button(action: onOpen) {
                    HStack(spacing: 6) {
                        Image(systemName: "bubble.right")
                        Text("\(post.commentCount)")
                    }
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .foregroundStyle(Theme.ink)
                }
                .buttonStyle(.plain)

                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            // Caption
            CaptionText(caption: post.caption, acronym: post.acronym, font: .system(.subheadline, design: .rounded))
                .padding(.horizontal, 14)
                .padding(.bottom, 16)
        }
        .background(Theme.card)
        .clipShape(.rect(cornerRadius: Theme.cardRadius))
        .shadow(color: Theme.ink.opacity(0.06), radius: 14, y: 6)
    }

    private func like() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        if !post.likedByMe {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) { heartPop = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                withAnimation(.easeOut(duration: 0.25)) { heartPop = false }
            }
        }
        onLike()
    }
}
