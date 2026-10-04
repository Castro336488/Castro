import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

let client: ShelbyClient | null = null;

export function getShelbyClient(): ShelbyClient {
  if (client) return client;
  client = new ShelbyClient({
    network: Network.SHELBYNET,
    apiKey: "aptoslabs_NEAWFEhGivU_EghWkiBPGJBkKk5gc2Hhhnb6XYFp51oK",
    rpc: { apiKey: "aptoslabs_NEAWFEhGivU_EghWkiBPGJBkKk5gc2Hhhnb6XYFp51oK" },
    indexer: { apiKey: "aptoslabs_NEAWFEhGivU_EghWkiBPGJBkKk5gc2Hhhnb6XYFp51oK" },
  });
  return client;
}
