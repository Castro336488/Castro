export async function uploadToShelby(
  file: File,
  name: string,
  walletAddress: string,
  signTransaction: (tx: any) => Promise<any>
) {
  const { ShelbyClient } = await import("@shelby-protocol/sdk/browser");

  const client = new ShelbyClient({
    apiKey: process.env.NEXT_PUBLIC_GEOMI_API_KEY!,
    network: "testnet" as any,
    rpcUrl: "https://api.testnet.shelby.xyz/shelby",
    indexer: {
      baseUrl: "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql",
    },
    aptos: {
      clientConfig: {
        API_KEY: process.env.NEXT_PUBLIC_GEOMI_API_KEY!,
      },
    },
  });

  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const expirationMicros = BigInt(Date.now()) * 1000n + 86400_000_000n;

  const signer = {
    accountAddress: walletAddress,
    signTransaction,
  };

  await client.upload({
    signer: signer as any,
    blobName: name,
    blobData: data,
    expirationMicros,
  });

  return { blobName: name };
}
