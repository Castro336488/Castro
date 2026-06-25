import { ShelbyClient } from "@shelby-protocol/sdk/node";
import dotenv from "dotenv";
dotenv.config();

const client = new ShelbyClient({
  apiKey: process.env.GEOMI_API_KEY,
  rpcUrl: "https://api.testnet.shelby.xyz/shelby",
  indexer: {
    baseUrl: "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql",
  },
});

console.log("Shelby client connected ✅");