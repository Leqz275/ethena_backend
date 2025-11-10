import { Token, TimeWindow } from "../types/token";

function getTokenSortValue(
  token: Token,
  sortBy: string,
  window: TimeWindow
): number {
  switch (sortBy) {
    case "volume":
      return token.volume_sol;
    case "price":
      return token.price_sol;
    case "marketCap":
      return token.market_cap_sol;
    case "priceChange":
      if (window === "1h") return token.price_1h_change;
      if (window === "24h") return token.price_24h_change;
      if (window === "7d") return token.price_7d_change;
      return 0;
    default:
      return 0;
  }
}


export function filterTokens(tokens: Token[], window: TimeWindow): Token[] {
  return tokens.filter((token) => {
    switch (window) {
      case "1h":
        return token.price_1h_change !== undefined;
      case "24h":
        return token.price_24h_change !== undefined;
      case "7d":
        return token.price_7d_change !== undefined;
      default:
        return true;
    }
  });
}


export function sortTokens(
  tokens: Token[],
  sortBy: "volume" | "price" | "marketCap" | "priceChange",
  window: TimeWindow
): Token[] {
  return tokens.sort((a, b) => {
    const valA = getTokenSortValue(a, sortBy, window);
    const valB = getTokenSortValue(b, sortBy, window);
    return valB - valA; // Descending sort
  });
}



interface CursorData {
  sortBy: string;
  lastValue: number;
  lastAddress: string;
}

export function paginateTokens(
  tokens: Token[],
  sortBy: "volume" | "price" | "marketCap" | "priceChange",
  window: TimeWindow,
  limit: number,
  cursor?: string
) {
  let startIndex = 0;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      startIndex =
        tokens.findIndex(
          (token) =>
            getTokenSortValue(token, sortBy, window) === decoded.lastValue &&
            token.token_address === decoded.lastAddress
        ) + 1; 
    }
  }

  const pageItems = tokens.slice(startIndex, startIndex + limit);

  let nextCursor: string | undefined = undefined;

  if (startIndex + limit < tokens.length) {
    const lastItem = pageItems[pageItems.length - 1];

    if (lastItem) {
      nextCursor = encodeCursor({
        sortBy,
        lastValue: getTokenSortValue(lastItem, sortBy, window),
        lastAddress: lastItem.token_address,
      });
    }
  }

  return {
    items: pageItems,
    nextCursor,
  };
}


function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    return JSON.parse(json) as CursorData;
  } catch {
    return null; // Invalid cursor
  }
}