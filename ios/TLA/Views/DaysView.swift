import SwiftUI

struct DaysView: View {
    @Environment(Nav.self) private var nav

    @State private var days: [DayEntry] = []
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else if days.isEmpty {
                    Text("No past days yet.")
                        .font(.subheadline).foregroundStyle(.secondary)
                        .padding(.top, 60)
                }
                ForEach(days) { entry in
                    Button { nav.push(.day(entry.day)) } label: {
                        HStack(spacing: 14) {
                            AcronymTiles(acronym: entry.acronym, tileSize: 44, spacing: 6)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(prettyDate(entry.day))
                                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                                    .foregroundStyle(Theme.ink)
                                Text("\(entry.postCount) photo\(entry.postCount == 1 ? "" : "s")")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.footnote).foregroundStyle(.secondary)
                        }
                        .padding(14)
                        .background(Theme.canvas, in: .rect(cornerRadius: 16))
                        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.hairline, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
        .background(Theme.canvas)
        .navigationTitle("Past days")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func prettyDate(_ day: String) -> String {
        let parser = DateFormatter()
        parser.dateFormat = "yyyy-MM-dd"
        parser.timeZone = TimeZone(identifier: "UTC")
        guard let date = parser.date(from: day) else { return day }
        let out = DateFormatter()
        out.dateStyle = .medium
        return out.string(from: date)
    }

    private func load() async {
        days = (try? await APIClient.days()) ?? []
        isLoading = false
    }
}

struct DayFeedView: View {
    let day: String

    @Environment(AppStore.self) private var store
    @Environment(Nav.self) private var nav

    @State private var posts: [Post] = []
    @State private var acronym: String = ""
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 18) {
                if !acronym.isEmpty {
                    AcronymTiles(acronym: acronym, tileSize: 60)
                        .padding(.top, 8)
                }
                if isLoading {
                    ProgressView().padding(.top, 40)
                } else if posts.isEmpty {
                    Text("No photos for this day.")
                        .font(.subheadline).foregroundStyle(.secondary).padding(.top, 40)
                }
                ForEach(posts) { post in
                    PostCardView(
                        post: post,
                        onLike: { like(post) },
                        onOpen: { nav.push(.post(post.id)) },
                        onOpenProfile: { nav.push(.profile(post.userId)) }
                    )
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Theme.canvas)
        .navigationTitle("Past day")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func load() async {
        if let result = try? await APIClient.feed(day: day, sort: "new", userId: store.userId) {
            posts = result
            acronym = result.first?.acronym ?? ""
        }
        isLoading = false
    }

    private func like(_ post: Post) {
        guard let index = posts.firstIndex(of: post) else { return }
        var updated = post
        updated.likedByMe.toggle()
        updated.likeCount += updated.likedByMe ? 1 : -1
        withAnimation(.snappy) { posts[index] = updated }
        Task {
            if let server = try? await APIClient.toggleLike(postId: post.id, userId: store.userId) {
                if let i = posts.firstIndex(where: { $0.id == server.id }) { posts[i] = server }
            }
        }
    }
}
