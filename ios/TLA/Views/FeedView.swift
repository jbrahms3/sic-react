import SwiftUI

struct FeedView: View {
    @Environment(AppStore.self) private var store

    @State private var nav = Nav()
    @State private var posts: [Post] = []
    @State private var sort: String = "new"
    @State private var isLoading = false
    @State private var showCreate = false
    @State private var today: TodayInfo?

    var body: some View {
        NavigationStack(path: $nav.path) {
            ScrollView {
                LazyVStack(spacing: 18) {
                    header

                    if posts.isEmpty && !isLoading {
                        emptyState
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
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Theme.canvas)
            .navigationTitle("Explore")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreate = true } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Theme.accent)
                    }
                }
            }
            .navigationDestination(for: Route.self) { RouteDestination(route: $0) }
            .environment(nav)
            .refreshable { await load() }
            .task { await load() }
            .sheet(isPresented: $showCreate, onDismiss: { Task { await load() } }) {
                CreatePostView(today: today)
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            if let today {
                Text("Today's acronym")
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundStyle(.secondary)
                Text(today.acronym)
                    .font(.system(.subheadline, design: .rounded).weight(.heavy))
                    .foregroundStyle(Theme.ink)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Theme.sunshineSoft, in: .capsule)
            }
            Spacer()
            Picker("Sort", selection: $sort) {
                Text("New").tag("new")
                Text("Top").tag("top")
            }
            .pickerStyle(.segmented)
            .frame(width: 130)
            .onChange(of: sort) { _, _ in Task { await load() } }
        }
        .padding(.bottom, 4)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "photo.stack")
                .font(.system(size: 44))
                .foregroundStyle(Theme.sunshine)
            Text("No photos yet today")
                .font(.system(.headline, design: .rounded))
            Text("Be the first to match today's acronym.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button("Add your photo") { showCreate = true }
                .font(.system(.subheadline, design: .rounded).weight(.bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 20).padding(.vertical, 10)
                .background(Theme.accent, in: .capsule)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }

    private func load() async {
        guard let info = try? await APIClient.today() else { return }
        today = info
        isLoading = true
        if let result = try? await APIClient.feed(day: info.day, sort: sort, userId: store.userId) {
            posts = result
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
