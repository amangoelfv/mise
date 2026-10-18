/** Zepto product as returned by the MCP search tools. Prices in PAISE (÷100 for INR). */
export interface ZeptoProduct {
  readonly productVariantId: string;
  readonly storeProductId: string;
  readonly name: string;
  readonly price: number; // paise
  readonly mrp: number; // paise
  readonly packSize: string;
  readonly availableQuantity: number;
  /** Populated from get_product_details when available (rating/brand personalization). */
  readonly brand?: string;
  readonly averageRating?: number | null;
  readonly totalRatings?: number | null;
  readonly imageUrl?: string;
}

/** Subset of get_product_details used for rating/brand personalization. */
export interface ZeptoProductDetails {
  readonly productVariantId: string;
  readonly name: string;
  readonly brand?: string;
  readonly averageRating?: number | null;
  readonly totalRatings?: number | null;
  readonly weightInGms?: number;
  readonly isInStock?: boolean;
}
