
import type { NodeData } from '../types';

export async function calculateHash(
  index: number,
  previousHash: string,
  timestamp: string,
  data: NodeData,
  nonce: number
): Promise<string> {
  const dataString = `${index}${previousHash}${timestamp}${JSON.stringify(data)}${nonce}`;
  const encoder = new TextEncoder();
  const dataUint8Array = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
