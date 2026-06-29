import SwiftUI
import Combine

struct TodayView: View {
    @Environment(AppStore.self) private var store

    @State private var today: TodayInfo?
    @State private var topPosts: [Post] = []
    @State private var showCreate = false
    @State private var nav = Nav()

    var acronym: String { today?.acronym ?? "•••" }

    var body: some View {
        NavigationStack(path: $nav.path) {
            ScrollView {
                VStack(spacing: 0) {
                    header

                    AcronymHero(acronym: acronym)
                        .padding(.top, 8)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: acronym)

                    dateRow
                        .padding(.top, 14)

                    shareCard
                        .padding(.horizontal, 20)
                        .padding(.top, 30)

                    interpretations
                        .padding(.top, 36)

                    Spacer(minLength: 24)
                }
            }
            .scrollIndicators(.hidden)
            .background(Theme.canvas.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Route.self) { RouteDestination(route: $0) }
            .environment(nav)
            .task { await load() }
            .refreshable { await load() }
            .sheet(isPresented: $showCreate, onDismiss: { Task { await load() } }) {
                CreatePostView(today: today)
            }
        }
    }

    // MARK: - Sections

    private var header: some View {
        Text("Today's Acronym")
            .font(.system(.title3, design: .rounded).weight(.semibold))
            .foregroundStyle(Theme.inkSoft)
            .padding(.top, 12)
    }

    private var dateRow: some View {
        HStack(spacing: 8) {
            Text(prettyDate)
                .font(.system(.title3, design: .rounded).weight(.medium))
            Image(systemName: "calendar")
                .font(.body)
        }
        .foregroundStyle(Theme.inkSoft)
    }

    private var shareCard: some View {
        VStack(spacing: 22) {
            HStack(alignment: .top, spacing: 18) {
                LightbulbBadge()
                Text("Three letters.\nInfinite meanings.\nShare yours.")
                    .font(.system(.title3, design: .rounded).weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }

            VStack(spacing: 14) {
                Button { showCreate = true } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "plus")
                            .font(.system(.headline, design: .rounded).weight(.bold))
                        Text("Share Your \(acronym)")
                            .font(.system(.headline, design: .rounded).weight(.bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 17)
                    .background(Theme.ink, in: .capsule)
                    .foregroundStyle(.white)
                }

                Button {
                    if let today { nav.push(.day(today.day)) }
                } label: {
                    Text("View Examples")
                        .font(.system(.headline, design: .rounded).weight(.semibold))
                        .foregroundStyle(Theme.ink)
                }
            }
        }
        .padding(24)
        .background(Theme.card, in: .rect(cornerRadius: Theme.cardRadius, style: .continuous))
        .shadow(color: Theme.ink.opacity(0.06), radius: 18, y: 10)
    }

    private var interpretations: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .firstTextBaseline) {
                Text("Top Interpretations")
                    .font(.system(.title3, design: .rounded).weight(.bold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                if let today {
                    Button { nav.push(.day(today.day)) } label: {
                        Text("See all")
                            .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            .foregroundStyle(Theme.link)
                    }
                }
            }
            .padding(.horizontal, 20)

            if topPosts.isEmpty {
                emptyInterpretations
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(topPosts) { post in
                            InterpretationCard(
                                post: post,
                                onOpen: { nav.push(.post(post.id)) }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .scrollClipDisabled()
            }
        }
    }

    private var emptyInterpretations: some View {
        VStack(spacing: 10) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 34))
                .foregroundStyle(Theme.sunshine)
            Text("No interpretations yet today")
                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                .foregroundStyle(Theme.ink)
            Text("Be the first to share what \(acronym) means to you.")
                .font(.footnote)
                .foregroundStyle(Theme.inkSoft)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .padding(.horizontal, 28)
        .padding(.horizontal, 20)
    }

    // MARK: - Helpers

    private var prettyDate: String {
        let parser = DateFormatter()
        parser.dateFormat = "yyyy-MM-dd"
        parser.timeZone = TimeZone(identifier: "UTC")
        let date = today.flatMap { parser.date(from: $0.day) } ?? Date()
        let out = DateFormatter()
        out.dateFormat = "MMMM d, yyyy"
        return out.string(from: date)
    }

    private func load() async {
        guard let info = try? await APIClient.today() else { return }
        today = info
        if let result = try? await APIClient.feed(day: info.day, sort: "top", userId: store.userId) {
            topPosts = Array(result.prefix(10))
        }
    }
}

/// A single horizontally-scrolling interpretation card on the home screen.
private struct InterpretationCard: View {
    let post: Post
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 0) {
                Color(.tertiarySystemBackground)
                    .frame(width: 230, height: 180)
                    .overlay { RemoteImage(imageId: post.imageId).allowsHitTesting(false) }
                    .clipShape(.rect(cornerRadius: 18, style: .continuous))
                    .padding(8)

                VStack(alignment: .leading, spacing: 10) {
                    Text(post.caption)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(Theme.ink)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    HStack {
                        Text("by @\(post.username)")
                            .font(.system(.caption, design: .rounded).weight(.medium))
                            .foregroundStyle(Theme.inkSoft)
                            .lineLimit(1)
                        Spacer()
                        HStack(spacing: 5) {
                            Image(systemName: "heart.fill")
                                .foregroundStyle(Theme.like)
                            Text("\(post.likeCount)")
                                .foregroundStyle(Theme.ink)
                        }
                        .font(.system(.caption, design: .rounded).weight(.bold))
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 16)
                .padding(.top, 4)
            }
            .frame(width: 246)
            .background(Theme.card, in: .rect(cornerRadius: 24, style: .continuous))
            .shadow(color: Theme.ink.opacity(0.06), radius: 14, y: 8)
        }
        .buttonStyle(.plain)
    }
}
