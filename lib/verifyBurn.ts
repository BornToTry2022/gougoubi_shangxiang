import { getAddress } from "viem";
import { publicClient } from "./chain";
import { DEAD_ADDRESS, GGB, toTokens } from "./ggb";
import { DRAW_TIERS } from "./fortune";

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** Minimum tokens for a burn to count — blocks dust / 0-value Transfer farming.
 *  990 = the 普通签 entry (1000) with 1% headroom for float/rounding. */
const MIN_BURN_TOKENS = DRAW_TIERS[0].burn * 0.99;

function topicToAddress(topic: string): string {
  // last 20 bytes of a 32-byte topic
  return getAddress("0x" + topic.slice(-40));
}

export type BurnVerification =
  | {
      ok: true;
      from: string;
      to: string;
      amount: number; // whole GGB tokens
      blockNumber: bigint;
    }
  | { ok: false; error: string };

/**
 * Verify a transaction is a genuine GGB burn to the dead address.
 * Needs only the tx hash + a public RPC (no API key). Idempotent.
 */
export async function verifyBurn(txHash: string): Promise<BurnVerification> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, error: "交易哈希格式不正确" };
  }

  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  } catch {
    return { ok: false, error: "链上还查不到这笔交易，请稍等几秒再试" };
  }

  if (receipt.status !== "success") {
    return { ok: false, error: "这笔交易在链上失败了" };
  }

  const dead = DEAD_ADDRESS.toLowerCase();
  let sawDust = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== GGB.address.toLowerCase()) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    if (!log.topics[1] || !log.topics[2]) continue;
    if (topicToAddress(log.topics[2]).toLowerCase() !== dead) continue;

    const amount = toTokens(BigInt(log.data));
    // Ignore dust / 0-value transfers so they can't farm leaderboard points/draws.
    if (amount < MIN_BURN_TOKENS) {
      sawDust = true;
      continue;
    }
    return {
      ok: true,
      from: topicToAddress(log.topics[1]),
      to: DEAD_ADDRESS,
      amount,
      blockNumber: receipt.blockNumber,
    };
  }

  return {
    ok: false,
    error: sawDust
      ? "销毁数量太少了（至少 1000 狗狗币才能求签）"
      : "这笔交易里没有找到向黑洞地址销毁狗狗币的记录",
  };
}
