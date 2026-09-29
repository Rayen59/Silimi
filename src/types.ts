/**
 * Validation & Schema Constants synchronized with firebase-blueprint.json
 */
export const VALIDATION_LIMITS = {
  TITLE_MAX: 120,
  BRAND_NAME_MAX: 80,
  CATEGORY_MAX: 60,
  SHORT_DESC_MAX: 300,
  DETAILED_DESC_MAX: 4000,
  REFERENCE_MAX: 40,
  GALLERY_MAX_COUNT: 8,
  PHOTO_MAX_CHARS: 700000,
  PRICE_MAX: 10000000,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
} as const;

export type AvailabilityStatus = 'En Stock' | 'Édition Limitée' | 'Sur Commande';

export interface BrandItem {
  id: string;
  title: string;
  brandName: string;
  category: string;
  shortDescription: string;
  detailedDescription: string;
  priceDts: number;
  mainPhoto: string;
  galleryPhotos: string[];
  referenceCode: string;
  availability: AvailabilityStatus;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  brandId: string;
  title: string;
  brandName: string;
  referenceCode: string;
  priceDts: number;
  mainPhoto: string;
  quantity: number;
}

export type AccessRole = 'locked' | 'user' | 'admin';

export const WHATSAPP_NUMBER = '21699532209';
export const WHATSAPP_DISPLAY = '+216 99 532 209';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function formatDtsNumber(amount: number): {
  whole: string;
  decimals: string | null;
} {
  const safe = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  const hasDecimals = safe % 1 !== 0;
  const wholePart = Math.floor(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimalPart = hasDecimals
    ? (safe % 1).toFixed(3).substring(2)
    : null;
  return { whole: wholePart, decimals: decimalPart };
}
