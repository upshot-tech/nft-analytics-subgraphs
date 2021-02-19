import { TypedMap, TypedMapEntry, ipfs } from "@graphprotocol/graph-ts";

/* Converts a TypedMap<string, string> to a JSON-encoded string.*/
export function typedMapToJson(t: TypedMap<string, string>): string {
  let keyValues: string[] = [];
  for (let i = 0; i < t.entries.length; i++) {
    let entry: TypedMapEntry<string, string> = t.entries[i];
    keyValues.push('"' + entry.key + '":"' + entry.value + '"');
  }
  return "{" + keyValues.join(",") + "}";
}

export function getIpfsString(uri: string): string {
  let hash = uri.split("/").pop();
  let content = ipfs.cat(hash);

  return content.toString();
}
