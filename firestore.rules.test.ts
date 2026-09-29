/**
 * Security Rules Verification Suite for Tropicanna Firestore Rules
 * Verifies that all 12 Dirty Dozen adversarial payloads return PERMISSION_DENIED.
 */

export interface SimulatedContext {
  uid: string | null;
  email?: string;
  email_verified?: boolean;
  requestTime: string;
}

export interface BrandPayload {
  title: string;
  brandName: string;
  category: string;
  shortDescription: string;
  detailedDescription: string;
  priceDts: number;
  mainPhoto: string;
  galleryPhotos: unknown[];
  referenceCode: string;
  availability: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const ALLOWED_KEYS = [
  'title',
  'brandName',
  'category',
  'shortDescription',
  'detailedDescription',
  'priceDts',
  'mainPhoto',
  'galleryPhotos',
  'referenceCode',
  'availability',
  'authorId',
  'createdAt',
  'updatedAt',
];

export function evaluateBrandCreateRule(
  brandId: string,
  ctx: SimulatedContext,
  data: BrandPayload
): 'ALLOW' | 'PERMISSION_DENIED' {
  const isSignedIn = ctx.uid !== null;
  const isVerified = isSignedIn && ctx.email_verified === true;
  const isAdmin = isVerified && ctx.email === 'rayenbouazizi337@gmail.com';
  const isValidId =
    typeof brandId === 'string' &&
    brandId.length >= 1 &&
    brandId.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(brandId);

  const keys = Object.keys(data);
  const hasOnlyAllowedKeys =
    keys.length === ALLOWED_KEYS.length &&
    ALLOWED_KEYS.every((k) => keys.includes(k));

  const isValidBrandItem =
    hasOnlyAllowedKeys &&
    typeof data.title === 'string' &&
    data.title.length >= 1 &&
    data.title.length <= 120 &&
    typeof data.brandName === 'string' &&
    data.brandName.length >= 1 &&
    data.brandName.length <= 80 &&
    typeof data.category === 'string' &&
    data.category.length >= 1 &&
    data.category.length <= 60 &&
    typeof data.shortDescription === 'string' &&
    data.shortDescription.length >= 1 &&
    data.shortDescription.length <= 300 &&
    typeof data.detailedDescription === 'string' &&
    data.detailedDescription.length >= 1 &&
    data.detailedDescription.length <= 4000 &&
    typeof data.priceDts === 'number' &&
    data.priceDts >= 0 &&
    data.priceDts <= 10000000 &&
    typeof data.mainPhoto === 'string' &&
    data.mainPhoto.length >= 1 &&
    data.mainPhoto.length <= 700000 &&
    Array.isArray(data.galleryPhotos) &&
    data.galleryPhotos.length <= 8 &&
    (data.galleryPhotos.length === 0 ||
      (typeof data.galleryPhotos[0] === 'string' &&
        data.galleryPhotos[0].length <= 700000)) &&
    typeof data.referenceCode === 'string' &&
    data.referenceCode.length >= 1 &&
    data.referenceCode.length <= 40 &&
    /^[a-zA-Z0-9_\-]+$/.test(data.referenceCode) &&
    ['En Stock', 'Édition Limitée', 'Sur Commande'].includes(
      data.availability
    ) &&
    typeof data.authorId === 'string' &&
    data.authorId.length >= 1 &&
    data.authorId.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(data.authorId) &&
    data.authorId === ctx.uid;

  const temporalValid =
    data.createdAt === ctx.requestTime && data.updatedAt === ctx.requestTime;

  if (isVerified && isValidId && isValidBrandItem && temporalValid && isAdmin) {
    return 'ALLOW';
  }
  return 'PERMISSION_DENIED';
}
