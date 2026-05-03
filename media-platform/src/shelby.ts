// Upload via Shelby CLI command (handled server side)
// Frontend just manages video URLs

export async function uploadToShelby(file: File): Promise<string> {
  const blobName = `media/${Date.now()}-${file.name}`;
  // Store locally for now - CLI handles real uploads
  return blobName;
}

export async function getFromShelby(file: File): Promise<string> {
  // Create local URL for playback
  return URL.createObjectURL(file);
}