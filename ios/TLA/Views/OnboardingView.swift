import SwiftUI
import PhotosUI

struct OnboardingView: View {
    @Environment(AppStore.self) private var store

    @State private var username: String = ""
    @State private var pickedItem: PhotosPickerItem?
    @State private var avatarImage: UIImage?
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 14) {
                AcronymTiles(acronym: "TLA", tileSize: 72)
                Text("Three-Letter Acronym")
                    .font(.system(.title2, design: .rounded).weight(.bold))
                Text("Each day a new acronym drops.\nMatch it with a photo and a caption.")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(spacing: 22) {
                PhotosPicker(selection: $pickedItem, matching: .images) {
                    ZStack(alignment: .bottomTrailing) {
                        Group {
                            if let avatarImage {
                                Image(uiImage: avatarImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } else {
                                Theme.accentSoft
                                    .overlay {
                                        Image(systemName: "camera.fill")
                                            .font(.title)
                                            .foregroundStyle(Theme.accent)
                                    }
                            }
                        }
                        .frame(width: 104, height: 104)
                        .clipShape(.circle)

                        Circle()
                            .fill(Theme.accent)
                            .frame(width: 32, height: 32)
                            .overlay { Image(systemName: "plus").font(.subheadline.bold()).foregroundStyle(.white) }
                            .overlay(Circle().strokeBorder(Theme.canvas, lineWidth: 3))
                    }
                }

                TextField("Pick a username", text: $username)
                    .font(.system(.title3, design: .rounded).weight(.medium))
                    .multilineTextAlignment(.center)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(.vertical, 14)
                    .frame(maxWidth: .infinity)
                    .background(Theme.card, in: .rect(cornerRadius: 16))
            }
            .padding(.horizontal, 28)

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .padding(.top, 12)
            }

            Spacer()

            Button(action: save) {
                HStack {
                    if isSaving { ProgressView().tint(.white) }
                    Text(isSaving ? "Setting up…" : "Start posting")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 17)
                .background(canSave ? Theme.accent : Theme.accent.opacity(0.4), in: .rect(cornerRadius: 16))
                .foregroundStyle(.white)
            }
            .disabled(!canSave || isSaving)
            .padding(.horizontal, 28)
            .padding(.bottom, 16)
        }
        .background(Theme.canvas)
        .onChange(of: pickedItem) { _, newItem in
            Task { await loadAvatar(newItem) }
        }
    }

    private var canSave: Bool {
        username.trimmingCharacters(in: .whitespaces).count >= 2
    }

    private func loadAvatar(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else { return }
        avatarImage = image
    }

    private func save() {
        let name = username.trimmingCharacters(in: .whitespaces)
        guard name.count >= 2 else { return }
        isSaving = true
        errorMessage = nil
        Task {
            do {
                var avatarId: String?
                if let avatarImage, let base64 = ImageHelpers.base64JPEG(from: avatarImage, maxDimension: 400) {
                    avatarId = try await APIClient.uploadImage(base64: base64)
                }
                let user = try await APIClient.saveUser(userId: store.userId, username: name, avatarImageId: avatarId)
                store.applyProfile(user)
            } catch {
                errorMessage = "Couldn't set up your profile. Try again."
                isSaving = false
            }
        }
    }
}
