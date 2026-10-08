import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Alert, Platform } from "react-native";
import { supabase } from "../../lib/supabase";

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const CHAT_ATTACHMENTS_BUCKET = "chat-attachments";

export type MessageType = "text" | "image" | "file" | "audio";

export interface PickedAttachment {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  type: "image" | "file";
  width?: number;
  height?: number;
}

export interface UploadedAttachmentResult {
  url: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * Format bytes to readable human string (e.g. 1.2 MB, 340 KB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "File";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Prompt user to select an image from the device gallery.
 */
export async function pickChatImage(): Promise<PickedAttachment | null> {
  try {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      return new Promise<PickedAttachment | null>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
            Alert.alert(
              "File Too Large",
              `Selected image (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`
            );
            resolve(null);
            return;
          }
          resolve({
            uri: URL.createObjectURL(file),
            name: file.name,
            mimeType: file.type || "image/jpeg",
            size: file.size,
            type: "image",
          });
        };
        input.click();
      });
    }

    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "TutorMate requires access to your photo gallery to share images in chat."
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const rawName = asset.fileName || `image_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || "image/jpeg";
    const size = asset.fileSize || 0;

    if (size > MAX_ATTACHMENT_SIZE_BYTES) {
      Alert.alert(
        "File Too Large",
        `Selected image (${formatFileSize(size)}) exceeds the maximum allowed size of 10 MB.`
      );
      return null;
    }

    return {
      uri: asset.uri,
      name: rawName,
      mimeType,
      size,
      type: "image",
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    console.warn("Failed to pick image:", error);
    Alert.alert("Error", "Could not open photo library.");
    return null;
  }
}

/**
 * Prompt user to select a document/file (PDF, DOCX, TXT, etc.).
 */
export async function pickChatDocument(): Promise<PickedAttachment | null> {
  try {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      return new Promise<PickedAttachment | null>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,image/*";
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
            Alert.alert(
              "File Too Large",
              `Selected file (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`
            );
            resolve(null);
            return;
          }
          const isImg = file.type?.startsWith("image/");
          resolve({
            uri: URL.createObjectURL(file),
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            type: isImg ? "image" : "file",
          });
        };
        input.click();
      });
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
        "image/*",
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const size = asset.size || 0;

    if (size > MAX_ATTACHMENT_SIZE_BYTES) {
      Alert.alert(
        "File Too Large",
        `Selected file (${formatFileSize(size)}) exceeds the maximum allowed size of 10 MB.`
      );
      return null;
    }

    const name = asset.name || `file_${Date.now()}`;
    const mimeType = asset.mimeType || "application/octet-stream";
    const isImg = mimeType.startsWith("image/");

    return {
      uri: asset.uri,
      name,
      mimeType,
      size,
      type: isImg ? "image" : "file",
    };
  } catch (error) {
    console.warn("Failed to pick document:", error);
    Alert.alert("Error", "Could not pick document.");
    return null;
  }
}

/**
 * Upload picked attachment to Supabase Storage.
 * Path structure: chat-attachments/{conversationId}/{senderId}/{timestamp}_{cleanFileName}
 */
export async function uploadChatAttachment(
  attachment: PickedAttachment,
  conversationId: string,
  senderId: string
): Promise<UploadedAttachmentResult | null> {
  if (!attachment || !conversationId || !senderId) return null;

  try {
    const cleanFileName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${conversationId}/${senderId}/${Date.now()}_${cleanFileName}`;

    // Read file as Blob / ArrayBuffer for cross-platform compatibility
    const response = await fetch(attachment.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(filePath, blob, {
        contentType: attachment.mimeType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage] Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size || blob.size || 0,
    };
  } catch (error: any) {
    console.error("Failed to upload attachment:", error);
    Alert.alert("Upload Failed", error.message || "Could not upload file attachment. Please try again.");
    return null;
  }
}

/**
 * Upload recorded voice message (m4a, webm, etc.) to Supabase Storage.
 * Path structure: chat-attachments/{conversationId}/{senderId}/{timestamp}_voice.{ext}
 */
export async function uploadVoiceMessage(
  audioUri: string,
  conversationId: string,
  senderId: string,
  durationSec?: number
): Promise<UploadedAttachmentResult | null> {
  if (!audioUri || !conversationId || !senderId) return null;

  try {
    const ext = Platform.OS === "web" ? "webm" : "m4a";
    const mimeType = Platform.OS === "web" ? "audio/webm" : "audio/m4a";
    const fileName = `voice_${Date.now()}.${ext}`;
    const filePath = `${conversationId}/${senderId}/${fileName}`;

    const response = await fetch(audioUri);
    const blob = await response.blob();

    if (blob.size > MAX_ATTACHMENT_SIZE_BYTES) {
      Alert.alert(
        "File Too Large",
        `Voice recording (${formatFileSize(blob.size)}) exceeds the maximum allowed size of 10 MB.`
      );
      return null;
    }

    const { error: uploadError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage] Voice upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      name: fileName,
      mimeType: mimeType,
      size: blob.size || 0,
    };
  } catch (error: any) {
    console.error("Failed to upload voice message:", error);
    Alert.alert("Upload Failed", error.message || "Could not upload voice note. Please try again.");
    return null;
  }
}

/**
 * Cleanup an uploaded storage item if the database message insert fails.
 */
export async function deleteFailedUpload(filePath: string): Promise<void> {
  if (!filePath) return;
  try {
    await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove([filePath]);
  } catch (err) {
    console.warn("Failed to delete orphaned upload:", err);
  }
}

/**
 * Opens or downloads a file attachment in the browser / system viewer.
 */
export async function openAttachmentUrl(url?: string, fileName?: string): Promise<void> {
  if (!url) {
    Alert.alert("Cannot Open", "Attachment URL is not available.");
    return;
  }

  try {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  } catch (err) {
    console.warn("Error opening attachment:", err);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Error", `Could not open ${fileName || "file"}.`);
    }
  }
}
