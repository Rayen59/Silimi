# Tropicanna Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default Deny**: Any path not explicitly matched in `firestore.rules` is unconditionally denied (`allow read, write: if false;`).
2. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) validates its path ID (`brandId`, `adminId`) with `isValidId(id)` (`1..128` chars, `^[a-zA-Z0-9_\-]+$`).
3. **Administrator Exclusivity for Writes**: Only verified administrators (`isAdmin()`, requiring `request.auth.token.email_verified == true` and either existence in `/admins/$(request.auth.uid)` or verified bootstrap email `rayenbouazizi337@gmail.com`) can create, update, or delete `/brands/{brandId}` documents.
4. **Strict Schema & Volumetric Blueprint (`isValidBrandItem`)**: Every `create` and `update` on `/brands/{brandId}` must pass `isValidBrandItem(incoming())`, enforcing `hasAll` and `hasOnly` on exact keys, strict string `.size()` bounds (`title <= 120`, `brandName <= 80`, `category <= 60`, `shortDescription <= 300`, `detailedDescription <= 4000`, `mainPhoto <= 700000`, `referenceCode <= 40`), numeric positivity on `priceDts`, bounded array size on `galleryPhotos` (`<= 8`), and `authorId == request.auth.uid`.
5. **Temporal & Ownership Immutability**: `createdAt` must equal `request.time` on `create` and remain immutable on `update` (`incoming().createdAt == existing().createdAt`). `updatedAt` must equal `request.time` on both `create` and `update`. `authorId` is immutable on `update`.
6. **Secure List Queries**: `allow list` on `/brands/{brandId}` never delegates filtering without checking `resource.data` (`resource.data.availability in ['En Stock', 'Édition Limitée', 'Sur Commande'] || resource.data.authorId == request.auth.uid`) and never invokes `get()` or `exists()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Unauthenticated Write**: `auth = null` attempting `create` on `/brands/brand_1`.
2. **Payload 2 — Unverified Admin Email Spoof**: `auth = { uid: 'spoof1', token: { email: 'rayenbouazizi337@gmail.com', email_verified: false } }` attempting `create` on `/brands/brand_1`.
3. **Payload 3 — Non-Admin Authenticated Write**: `auth = { uid: 'user1', token: { email: 'visitor@example.com', email_verified: true } }` attempting `create` on `/brands/brand_1`.
4. **Payload 4 — Shadow / Ghost Field Injection**: Admin attempting `create` with extra field `isFeaturedHack: true`.
5. **Payload 5 — Identity Spoofing (`authorId` mismatch)**: Admin `uid: 'admin1'` attempting `create` with `authorId: 'someone_else'`.
6. **Payload 6 — Path ID Poisoning**: Admin attempting `create` at `/brands/invalid$id!with spaces`.
7. **Payload 7 — Title Volumetric Overflow**: Admin attempting `create` with `title` of length 250 (`> 120`).
8. **Payload 8 — Unbounded Gallery Array**: Admin attempting `create` with `galleryPhotos` containing 12 items (`> 8`).
9. **Payload 9 — Negative Price**: Admin attempting `create` with `priceDts: -50`.
10. **Payload 10 — Forged Client Timestamp**: Admin attempting `create` with `createdAt` not matching `request.time`.
11. **Payload 11 — Immutable `createdAt` Mutation on Update**: Admin attempting `update` that alters `createdAt`.
12. **Payload 12 — Self-Privilege Escalation on `/admins`**: Regular user attempting `create` on `/admins/user1` with `{ role: 'admin' }`.
