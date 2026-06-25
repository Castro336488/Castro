import { ShelbyClient } from "@shelby-protocol/sdk/browser";

let client: ShelbyClient | null = null;

export function getShelbyClient() {
  if (!client) {
    client = new ShelbyClient({
      apiKey: process.env.NEXT_PUBLIC_GEOMI_API_KEY!,
      network: "testnet" as any,
      rpcUrl: "https://api.testnet.shelby.xyz/shelby",
      indexer: {
        baseUrl: "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql",
      },
    });
  }
  return client;
}
