export async function uploadToShelby(
  file: File,
  name: string,
  walletAddress: string,
  signTransaction: (tx: any) => Promise<any>
) {
  return { blobName: name };
}
// v2
