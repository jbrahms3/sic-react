import UIKit

/// Image preparation helpers: downscale + JPEG-compress to keep uploads small
/// (the backend stores image rows under a 2 MB limit).
enum ImageHelpers {
    static func base64JPEG(from image: UIImage, maxDimension: CGFloat = 1080, quality: CGFloat = 0.7) -> String? {
        let resized = downscale(image, maxDimension: maxDimension)
        guard let data = resized.jpegData(compressionQuality: quality) else { return nil }
        return data.base64EncodedString()
    }

    private static func downscale(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let longest = max(size.width, size.height)
        guard longest > maxDimension else { return image }
        let scale = maxDimension / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}
