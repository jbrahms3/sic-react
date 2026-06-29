import SwiftUI

/// Central design tokens for TLA — a warm, editorial aesthetic: a soft cream
/// canvas, deep ink-navy as the primary, and a sunny yellow as the highlight.
enum Theme {
    /// Warm cream page background.
    static let canvas = Color(red: 0.965, green: 0.953, blue: 0.918)
    /// Deep navy used for type and primary surfaces/buttons.
    static let ink = Color(red: 0.106, green: 0.165, blue: 0.290)
    /// Muted navy for secondary text.
    static let inkSoft = Color(red: 0.106, green: 0.165, blue: 0.290).opacity(0.55)
    /// Primary tint (navy) for buttons and active states.
    static let accent = Color(red: 0.106, green: 0.165, blue: 0.290)
    static let accentSoft = Color(red: 0.106, green: 0.165, blue: 0.290).opacity(0.08)
    /// Sunny yellow highlight (the sunburst rays, lightbulb glow).
    static let sunshine = Color(red: 0.969, green: 0.769, blue: 0.337)
    static let sunshineSoft = Color(red: 0.969, green: 0.769, blue: 0.337).opacity(0.30)
    /// Crisp white card surface that floats on the cream canvas.
    static let card = Color.white
    /// Link blue used for "See all" / inline actions.
    static let link = Color(red: 0.176, green: 0.435, blue: 0.831)
    /// Heart red.
    static let like = Color(red: 0.918, green: 0.235, blue: 0.275)
    static let hairline = Color(red: 0.106, green: 0.165, blue: 0.290).opacity(0.07)

    static let cardRadius: CGFloat = 26
    static let tileRadius: CGFloat = 16
}
