import SwiftUI

struct ContentView: View {
    @State private var store = AppStore()

    var body: some View {
        Group {
            if store.isOnboarded {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
        .environment(store)
        .tint(Theme.accent)
        .animation(.easeInOut, value: store.isOnboarded)
    }
}

enum AppTab: Hashable {
    case home, explore, days, profile
}

struct MainTabView: View {
    @Environment(AppStore.self) private var store

    @State private var tab: AppTab = .home
    @State private var showCreate = false
    @State private var today: TodayInfo?

    var body: some View {
        ZStack(alignment: .bottom) {
            Theme.canvas.ignoresSafeArea()

            Group {
                switch tab {
                case .home: TodayView()
                case .explore: FeedView()
                case .days: DaysTab()
                case .profile: ProfileTab()
                }
            }
            .padding(.bottom, 64)

            CustomTabBar(selected: $tab, onCreate: { showCreate = true })
        }
        .ignoresSafeArea(.keyboard)
        .task {
            today = try? await APIClient.today()
        }
        .sheet(isPresented: $showCreate, onDismiss: { Task { today = try? await APIClient.today() } }) {
            CreatePostView(today: today)
        }
    }
}

/// Floating bottom tab bar with a raised center "create" button.
struct CustomTabBar: View {
    @Binding var selected: AppTab
    let onCreate: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            tabButton(.home, icon: "house.fill", label: "Home")
            tabButton(.explore, icon: "magnifyingglass", label: "Explore")
            createButton
            tabButton(.days, icon: "calendar", label: "Days")
            tabButton(.profile, icon: "person", label: "Profile")
        }
        .padding(.horizontal, 12)
        .padding(.top, 12)
        .padding(.bottom, 4)
        .background(
            Theme.canvas
                .shadow(color: Theme.ink.opacity(0.06), radius: 12, y: -6)
                .ignoresSafeArea(edges: .bottom)
        )
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.hairline).frame(height: 1)
        }
    }

    private func tabButton(_ value: AppTab, icon: String, label: String) -> some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            selected = value
        } label: {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 21, weight: selected == value ? .bold : .regular))
                Text(label)
                    .font(.system(size: 11, design: .rounded).weight(selected == value ? .bold : .medium))
            }
            .foregroundStyle(selected == value ? Theme.ink : Theme.inkSoft)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    private var createButton: some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
            onCreate()
        } label: {
            ZStack {
                Circle()
                    .fill(Theme.ink)
                    .frame(width: 58, height: 58)
                    .shadow(color: Theme.ink.opacity(0.35), radius: 10, y: 5)
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
            }
            .offset(y: -16)
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }
}

/// Days history as a standalone tab with its own navigation stack.
struct DaysTab: View {
    @State private var nav = Nav()

    var body: some View {
        NavigationStack(path: $nav.path) {
            DaysView()
                .navigationDestination(for: Route.self) { RouteDestination(route: $0) }
        }
        .environment(nav)
    }
}

/// Profile as a standalone tab with its own navigation stack.
struct ProfileTab: View {
    @Environment(AppStore.self) private var store
    @State private var nav = Nav()

    var body: some View {
        NavigationStack(path: $nav.path) {
            ProfileView(userId: store.userId)
                .navigationDestination(for: Route.self) { RouteDestination(route: $0) }
        }
        .environment(nav)
    }
}

#Preview {
    ContentView()
}
