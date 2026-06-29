import SwiftUI
import PhotosUI

struct CreatePostView: View {
    let today: TodayInfo?

    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var pickedItem: PhotosPickerItem?
    @State private var image: UIImage?
    @State private var caption: String = ""
    @State private var isPosting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    if let acronym = today?.acronym {
                        VStack(spacing: 8) {
                            Text("Match the letters")
                                .font(.system(.caption, design: .rounded).weight(.bold))
                                .tracking(1.5)
                                .foregroundStyle(.secondary)
                            AcronymTiles(acronym: acronym, tileSize: 54, spacing: 8)
                        }
                        .padding(.top, 8)
                    }

                    PhotosPicker(selection: $pickedItem, matching: .images) {
                        Color(.tertiarySystemBackground)
                            .aspectRatio(1, contentMode: .fit)
                            .overlay {
                                if let image {
                                    Image(uiImage: image)
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .allowsHitTesting(false)
                                } else {
                                    VStack(spacing: 10) {
                                        Image(systemName: "photo.badge.plus")
                                            .font(.system(size: 42))
                                        Text("Choose a photo")
                                            .font(.system(.subheadline, design: .rounded).weight(.semibold))
                                    }
                                    .foregroundStyle(Theme.ink)
                                }
                            }
                            .clipShape(.rect(cornerRadius: Theme.cardRadius))
                            .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).strokeBorder(Theme.hairline, lineWidth: 1))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your caption")
                            .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            .foregroundStyle(.secondary)
                        TextField(captionHint, text: $caption, axis: .vertical)
                            .font(.system(.body, design: .rounded))
                            .lineLimit(2...4)
                            .padding(14)
                            .background(Theme.card, in: .rect(cornerRadius: 14))
                    }

                    if let errorMessage {
                        Text(errorMessage).font(.footnote).foregroundStyle(.red)
                    }
                }
                .padding(20)
            }
            .background(Theme.canvas)
            .navigationTitle("New post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Post") { post() }
                        .font(.headline)
                        .disabled(!canPost || isPosting)
                }
            }
            .overlay {
                if isPosting {
                    ZStack {
                        Color.black.opacity(0.1).ignoresSafeArea()
                        ProgressView("Posting…").padding(20).background(.regularMaterial, in: .rect(cornerRadius: 14))
                    }
                }
            }
            .onChange(of: pickedItem) { _, item in Task { await loadImage(item) } }
        }
    }

    private var captionHint: String {
        guard let acronym = today?.acronym else { return "Write your phrase…" }
        return "A phrase for \(acronym)…"
    }

    private var canPost: Bool {
        image != nil && caption.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2
    }

    private func loadImage(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self),
              let uiImage = UIImage(data: data) else { return }
        image = uiImage
    }

    private func post() {
        guard let image, let day = today?.day else { return }
        isPosting = true
        errorMessage = nil
        Task {
            do {
                guard let base64 = ImageHelpers.base64JPEG(from: image) else {
                    throw BackendError(status: 0, body: "encode")
                }
                let imageId = try await APIClient.uploadImage(base64: base64)
                _ = try await APIClient.createPost(
                    userId: store.userId,
                    caption: caption.trimmingCharacters(in: .whitespacesAndNewlines),
                    imageId: imageId,
                    day: day
                )
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)
                dismiss()
            } catch {
                errorMessage = "Couldn't post. Please try again."
                isPosting = false
            }
        }
    }
}
