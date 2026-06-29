import SwiftUI

/// Shared navigation routes pushed onto a NavigationStack.
enum Route: Hashable {
    case post(String)
    case profile(String)
    case days
    case day(String)
}

/// Per-tab navigation coordinator so deeply nested views can push routes.
@Observable
final class Nav {
    var path: [Route] = []
    func push(_ route: Route) { path.append(route) }
}

/// Resolves a Route to its destination view. Used by every tab stack.
struct RouteDestination: View {
    let route: Route

    var body: some View {
        switch route {
        case .post(let id): PostDetailView(postId: id)
        case .profile(let userId): ProfileView(userId: userId)
        case .days: DaysView()
        case .day(let day): DayFeedView(day: day)
        }
    }
}
