import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Opens the system photo library and returns the chosen image, or null if the
 * user cancelled. Requests permission on demand.
 */
export async function pickImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/**
 * Downscale + JPEG-compress to keep uploads small (the backend stores image
 * rows under a ~2 MB limit). Returns the base64 payload.
 *
 * Ported from the original SwiftUI `ImageHelpers.base64JPEG`.
 */
export async function base64JPEG(
  image: PickedImage,
  maxDimension = 1080,
  quality = 0.7,
): Promise<string | null> {
  const longest = Math.max(image.width, image.height);
  const actions: ImageManipulator.Action[] = [];
  if (longest > maxDimension) {
    const scale = maxDimension / longest;
    actions.push({
      resize: {
        width: Math.round(image.width * scale),
        height: Math.round(image.height * scale),
      },
    });
  }

  const output = await ImageManipulator.manipulateAsync(image.uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return output.base64 ?? null;
}
