import SwiftUI

/// Loads a backend image by id with a soft placeholder.
struct RemoteImage: View {
    let imageId: String?
    var contentMode: ContentMode = .fill

    var body: some View {
        if let imageId {
            AsyncImage(url: APIClient.imageURL(imageId)) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().aspectRatio(contentMode: contentMode)
                case .failure:
                    placeholder
                case .empty:
                    ZStack { placeholder; ProgressView() }
                @unknown default:
                    placeholder
                }
            }
        } else {
            placeholder
        }
    }

    private var placeholder: some View {
        Theme.card
    }
}

/// Circular avatar with initials fallback.
struct AvatarView: View {
    let imageId: String?
    let username: String
    var size: CGFloat = 36

    var body: some View {
        Circle()
            .fill(Theme.accentSoft)
            .frame(width: size, height: size)
            .overlay {
                if imageId != nil {
                    RemoteImage(imageId: imageId)
                        .frame(width: size, height: size)
                        .clipShape(.circle)
                        .allowsHitTesting(false)
                } else {
                    Text(initials)
                        .font(.system(size: size * 0.4, weight: .bold, design: .rounded))
                        .foregroundStyle(Theme.accent)
                }
            }
            .clipShape(.circle)
            .overlay(Circle().strokeBorder(Theme.hairline, lineWidth: 1))
    }

    private var initials: String {
        let trimmed = username.trimmingCharacters(in: .whitespaces)
        return String(trimmed.prefix(1)).uppercased()
    }
}

/// The three bold acronym letter tiles (navy on cream).
struct AcronymTiles: View {
    let acronym: String
    var tileSize: CGFloat = 64
    var spacing: CGFloat = 10

    var body: some View {
        HStack(spacing: spacing) {
            ForEach(Array(acronym.uppercased().enumerated()), id: \.offset) { _, letter in
                RoundedRectangle(cornerRadius: Theme.tileRadius, style: .continuous)
                    .fill(Theme.ink)
                    .frame(width: tileSize, height: tileSize)
                    .overlay {
                        Text(String(letter))
                            .font(.system(size: tileSize * 0.5, weight: .heavy, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    .shadow(color: Theme.ink.opacity(0.18), radius: 10, y: 6)
            }
        }
    }
}

/// Big editorial acronym wordmark flanked by sunny sunburst rays — the hero of
/// the home screen.
struct AcronymHero: View {
    let acronym: String

    var body: some View {
        HStack(spacing: 4) {
            SunBurst(mirrored: true)
            Text(acronym.uppercased())
                .font(.system(size: 92, weight: .black, design: .rounded))
                .foregroundStyle(Theme.ink)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .shadow(color: Theme.ink.opacity(0.08), radius: 6, y: 4)
                .layoutPriority(1)
            SunBurst(mirrored: false)
        }
        .padding(.horizontal, 20)
    }
}

/// Three short yellow rays fanning out, like a comic-book "shine".
struct SunBurst: View {
    var mirrored: Bool = false

    var body: some View {
        ZStack {
            ray(angle: -34, dx: -2, dy: -26)
            ray(angle: 0, dx: 4, dy: 0)
            ray(angle: 34, dx: -2, dy: 26)
        }
        .frame(width: 40, height: 90)
        .scaleEffect(x: mirrored ? -1 : 1, y: 1)
    }

    private func ray(angle: Double, dx: CGFloat, dy: CGFloat) -> some View {
        Capsule()
            .fill(Theme.sunshine)
            .frame(width: 26, height: 8)
            .rotationEffect(.degrees(angle))
            .offset(x: dx, y: dy)
    }
}

/// Yellow lightbulb badge used in the share card.
struct LightbulbBadge: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Theme.sunshineSoft)
                .frame(width: 56, height: 56)
            Image(systemName: "lightbulb.fill")
                .font(.system(size: 26))
                .foregroundStyle(Theme.sunshine)
        }
    }
}

/// Caption styled so the letters that match the acronym are emphasized.
struct CaptionText: View {
    let caption: String
    let acronym: String
    var font: Font = .body

    var body: some View {
        Text(attributed)
            .font(font)
    }

    private var attributed: AttributedString {
        var result = AttributedString(caption)
        result.foregroundColor = Theme.ink
        let letters = Array(acronym.uppercased())
        var letterIndex = 0
        // Emphasize the first letter of each word in order, matching acronym letters.
        let words = caption.split(separator: " ")
        var search = caption.startIndex
        for word in words {
            guard letterIndex < letters.count else { break }
            if let range = caption.range(of: String(word), range: search..<caption.endIndex) {
                if let firstChar = word.first,
                   String(firstChar).uppercased() == String(letters[letterIndex]) {
                    if let attrRange = Range(NSRange(range.lowerBound..<caption.index(after: range.lowerBound), in: caption), in: result) {
                        result[attrRange].foregroundColor = Theme.accent
                        result[attrRange].font = font.weight(.heavy)
                    }
                    letterIndex += 1
                }
                search = range.upperBound
            }
        }
        return result
    }
}

extension Double {
    /// Relative "time ago" label from a millisecond timestamp.
    var timeAgo: String {
        let date = Date(timeIntervalSince1970: self / 1000)
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}
