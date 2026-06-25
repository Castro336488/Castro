let client;

async function getShelbyClient() {
  const { ShelbyClient } = await import("@shelby-protocol/sdk/node");
  
  if (!client) {
    client = new ShelbyClient({
      apiKey: process.env.GEOMI_API_KEY,
      network: "testnet",
      rpcUrl: "https://api.testnet.shelby.xyz/shelby",
      indexer: {
        baseUrl: "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql",
      },
    });
  }
  
  return client;
}

module.exports = { getShelbyClient };