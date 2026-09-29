import React, { useState } from 'react';
import {
  X,
  Upload,
  Star,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BrandItem,
  AvailabilityStatus,
  VALIDATION_LIMITS,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { PriceDisplay } from './PriceDisplay';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrand?: BrandItem | null;
  onSaveBrand: (
    brandData: Omit<BrandItem, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
}

/**
 * Compresses an uploaded image file on a canvas so it stays well within
 * Firestore's document size limits (< 700,000 chars).
 */
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1100;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible d’initialiser le canvas image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Fichier image invalide.'));
      img.src = String(event.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    reader.readAsDataURL(file);
  });
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  isOpen,
  onClose,
  initialBrand,
  onSaveBrand,
}) => {
  const [title, setTitle] = useState(initialBrand?.title || '');
  const [brandName, setBrandName] = useState(
    initialBrand?.brandName || 'Maison Tropicanna'
  );
  const [category, setCategory] = useState(
    initialBrand?.category || 'Collection Privée'
  );
  const [referenceCode, setReferenceCode] = useState(
    initialBrand?.referenceCode ||
      `TRP-${Math.floor(100 + Math.random() * 900)}`
  );
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    initialBrand?.availability || 'En Stock'
  );
  const [priceDtsInput, setPriceDtsInput] = useState<string>(
    initialBrand ? String(initialBrand.priceDts) : ''
  );
  const [shortDescription, setShortDescription] = useState(
    initialBrand?.shortDescription || ''
  );
  const [detailedDescription, setDetailedDescription] = useState(
    initialBrand?.detailedDescription || ''
  );

  // Photos list and main photo selection
  const initialPhotos = initialBrand
    ? Array.from(
        new Set([
          initialBrand.mainPhoto,
          ...(initialBrand.galleryPhotos || []),
        ])
      )
    : [];

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [mainPhoto, setMainPhoto] = useState<string>(
    initialBrand?.mainPhoto || initialPhotos[0] || ''
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const parsedPrice = Number(priceDtsInput);
  const validPrice =
    Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    try {
      const remainingSlots =
        VALIDATION_LIMITS.GALLERY_MAX_COUNT - photos.length;
      if (remainingSlots <= 0) {
        setError(
          `Vous pouvez ajouter jusqu'à ${VALIDATION_LIMITS.GALLERY_MAX_COUNT} photos maximum par brin.`
        );
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const compressedList: string[] = [];

      for (const file of filesToProcess) {
        const dataUrl = await compressImageFile(file);
        if (dataUrl.length <= VALIDATION_LIMITS.PHOTO_MAX_CHARS) {
          compressedList.push(dataUrl);
        }
      }

      if (compressedList.length > 0) {
        const updated = [...photos, ...compressedList];
        setPhotos(updated);
        if (!mainPhoto) {
          setMainPhoto(compressedList[0]);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger cette photo.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = (urlToAdd: string) => {
    const trimmed = urlToAdd.trim();
    if (!trimmed) return;
    if (photos.includes(trimmed)) {
      setMainPhoto(trimmed);
      setCustomPhotoUrl('');
      return;
    }
    if (photos.length >= VALIDATION_LIMITS.GALLERY_MAX_COUNT) {
      setError(
        `Limite de ${VALIDATION_LIMITS.GALLERY_MAX_COUNT} photos atteinte.`
      );
      return;
    }
    const updated = [...photos, trimmed];
    setPhotos(updated);
    if (!mainPhoto) {
      setMainPhoto(trimmed);
    }
    setCustomPhotoUrl('');
    setError(null);
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    const updated = photos.filter((p) => p !== urlToRemove);
    setPhotos(updated);
    if (mainPhoto === urlToRemove) {
      setMainPhoto(updated[0] || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim().slice(0, VALIDATION_LIMITS.TITLE_MAX);
    const cleanBrand = brandName
      .trim()
      .slice(0, VALIDATION_LIMITS.BRAND_NAME_MAX);
    const cleanCategory = category
      .trim()
      .slice(0, VALIDATION_LIMITS.CATEGORY_MAX);
    const cleanRef = referenceCode
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, '-')
      .slice(0, VALIDATION_LIMITS.REFERENCE_MAX);
    const cleanShort = shortDescription
      .trim()
      .slice(0, VALIDATION_LIMITS.SHORT_DESC_MAX);
    const cleanDetailed = detailedDescription
      .trim()
      .slice(0, VALIDATION_LIMITS.DETAILED_DESC_MAX);

    if (!cleanTitle || !cleanBrand || !cleanShort || !cleanDetailed) {
      setError(
        'Veuillez remplir le nom du brin, la marque, la petite description d’accueil et la description détaillée.'
      );
      return;
    }

    if (photos.length === 0 || !mainPhoto) {
      setError(
        'Veuillez ajouter au moins une photo et choisir la photo principale qui s’affichera à l’accueil.'
      );
      return;
    }

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      parsedPrice > VALIDATION_LIMITS.PRICE_MAX
    ) {
      setError('Veuillez saisir un prix en DTS valide.');
      return;
    }

    setIsSaving(true);
    try {
      const orderedGallery = [
        mainPhoto,
        ...photos.filter((p) => p !== mainPhoto),
      ].slice(0, VALIDATION_LIMITS.GALLERY_MAX_COUNT);

      await onSaveBrand(
        {
          title: cleanTitle,
          brandName: cleanBrand,
          category: cleanCategory || 'Collection Privée',
          referenceCode: cleanRef || 'TRP-01',
          availability,
          priceDts: parsedPrice,
          shortDescription: cleanShort,
          detailedDescription: cleanDetailed,
          mainPhoto,
          galleryPhotos: orderedGallery,
        },
        initialBrand?.id
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la publication.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#161514]/70 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl bg-[#FAF8F5] text-[#161514] rounded-xl shadow-2xl border border-[#161514]/15 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#161514] text-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#D4B475]">
              <span>Studio Administrateur Tropicanna</span>
              <span aria-hidden="true">·</span>
              <span>Direction Artistique</span>
            </div>
            <h2 className="font-display text-2xl font-normal text-[#FAF8F5]">
              {initialBrand
                ? `Modifier « ${initialBrand.title} »`
                : 'Publier un Nouveau Brin & Galerie Photos'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#FAF8F5]/70 hover:text-[#FAF8F5] hover:bg-[#FAF8F5]/10 transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre d'administration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8"
        >
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#FDF2F2] border border-[#8B3A3A]/30 text-xs text-[#8B3A3A]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Photos & Main Photo Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#161514]/10">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#161514]">
                  01. Photos du Brin & Choix de la Photo Principale d’Accueil
                </h3>
                <p className="text-xs text-[#6E6A64]">
                  Importez plusieurs photos et cliquez sur « Définir comme Photo
                  Principale » pour choisir celle qui s’affichera sur l’accueil.
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-[#6E6A64]">
                {photos.length} / {VALIDATION_LIMITS.GALLERY_MAX_COUNT} photos
              </span>
            </div>

            {/* Upload & URL controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <label className="md:col-span-5 flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-[#9A7432]/50 bg-[#F3EFE8]/70 hover:bg-[#F3EFE8] transition-colors cursor-pointer text-center">
                <Upload className="w-5 h-5 text-[#9A7432]" />
                <span className="text-xs font-semibold text-[#161514]">
                  Importer des photos depuis votre appareil
                </span>
                <span className="text-[11px] text-[#6E6A64]">
                  JPG, PNG, WEBP · Plusieurs photos autorisées
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="md:col-span-7 flex flex-col justify-center gap-3 p-4 rounded-xl bg-white border border-[#161514]/10">
                <div>
                  <label className="block text-xs font-medium text-[#161514] mb-1.5">
                    Ou ajouter une photo par lien direct (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-[#FAF8F5] border border-[#161514]/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#9A7432]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPhotoUrl(customPhotoUrl)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#161514] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#2C2A28] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Photos Grid with "Main Photo" Selector */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {photos.map((photoUrl, idx) => {
                  const isMain = photoUrl === mainPhoto;
                  return (
                    <div
                      key={`${photoUrl}-${idx}`}
                      className={`group relative rounded-xl overflow-hidden border bg-white transition-all ${
                        isMain
                          ? 'border-[#9A7432] ring-2 ring-[#9A7432]/30'
                          : 'border-[#161514]/15'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full bg-[#EFECE6]">
                        <ResilientImage
                          src={photoUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-2.5 flex items-center justify-between gap-1 bg-white">
                        <button
                          type="button"
                          onClick={() => setMainPhoto(photoUrl)}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            isMain
                              ? 'bg-[#161514] text-[#D4B475]'
                              : 'bg-[#F3EFE8] text-[#161514] hover:bg-[#E5DFD5]'
                          }`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              isMain ? 'fill-[#D4B475] text-[#D4B475]' : ''
                            }`}
                          />
                          <span>
                            {isMain ? 'Photo Principale' : 'Choisir Principale'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photoUrl)}
                          className="p-1.5 text-[#6E6A64] hover:text-[#8B3A3A] transition-colors cursor-pointer"
                          aria-label="Supprimer cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Identity & Extraordinary Price in DTS */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#161514]/10">
              <h3 className="font-display text-xl font-semibold text-[#161514]">
                02. Identité du Brin & Tarif en Dinars (DTS)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#161514] mb-1.5">
                  Nom du Brin / Produit *
                </label>
                <input
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Élixir d'Ambre & Néroli"
                  className="w-full bg-white border border-[#161514]/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#9A7432]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#161514] mb-1.5">
                  Nom de la Marque (Brand) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.BRAND_NAME_MAX}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Maison Tropicanna Parfums"
                  className="w-full bg-white border border-[#161514]/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#9A7432]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#161514] mb-1.5">
                  Catégorie
                </label>
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.CATEGORY_MAX}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Haute Parfumerie, Maroquinerie, Horlogerie..."
                  className="w-full bg-white border border-[#161514]/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#9A7432]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#161514] mb-1.5">
                    Code Référence
                  </label>
                  <input
                    type="text"
                    maxLength={VALIDATION_LIMITS.REFERENCE_MAX}
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="TRP-01"
                    className="w-full bg-white border border-[#161514]/15 rounded-lg px-3 py-2.5 text-sm font-mono-tabular focus:outline-none focus:border-[#9A7432]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#161514] mb-1.5">
                    Disponibilité
                  </label>
                  <select
                    value={availability}
                    onChange={(e) =>
                      setAvailability(e.target.value as AvailabilityStatus)
                    }
                    className="w-full bg-white border border-[#161514]/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#9A7432]"
                  >
                    <option value="En Stock">En Stock</option>
                    <option value="Édition Limitée">Édition Limitée</option>
                    <option value="Sur Commande">Sur Commande</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price Input + Live Extraordinary Price Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
              <div className="lg:col-span-5">
                <label className="block text-xs font-medium text-[#161514] mb-1.5">
                  Prix Officiel en DTS (Dinars Tunisiens) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={VALIDATION_LIMITS.PRICE_MAX}
                    required
                    value={priceDtsInput}
                    onChange={(e) => setPriceDtsInput(e.target.value)}
                    placeholder="385"
                    className="w-full bg-white border border-[#161514]/20 rounded-lg px-4 py-3 pr-16 text-lg font-mono-tabular font-semibold focus:outline-none focus:border-[#9A7432]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-widest text-[#9A7432]">
                    DTS
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7">
                <span className="block text-[11px] text-[#6E6A64] mb-1.5">
                  Aperçu en direct de l’affichage extraordinaire du prix :
                </span>
                <PriceDisplay priceDts={validPrice} variant="detail" />
              </div>
            </div>
          </div>

          {/* Section 3: Short Homepage Description & Detailed Description */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-[#161514]/10">
              <h3 className="font-display text-xl font-semibold text-[#161514]">
                03. Textes & Descriptions Rédigés par l’Administrateur
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#161514]">
                  Petite description pour l’Accueil (affichée sur la carte de
                  présentation) *
                </label>
                <span className="text-[11px] font-mono-tabular text-[#6E6A64]">
                  {shortDescription.length} / {VALIDATION_LIMITS.SHORT_DESC_MAX}
                </span>
              </div>
              <textarea
                rows={2}
                required
                maxLength={VALIDATION_LIMITS.SHORT_DESC_MAX}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Rédigez une courte phrase d'accroche élégante qui s'affichera sous la photo principale à l'accueil..."
                className="w-full bg-white border border-[#161514]/15 rounded-lg p-3.5 text-sm focus:outline-none focus:border-[#9A7432]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#161514]">
                  Description en Détail (affichée lorsque le visiteur clique sur
                  le brin) *
                </label>
                <span className="text-[11px] font-mono-tabular text-[#6E6A64]">
                  {detailedDescription.length} /{' '}
                  {VALIDATION_LIMITS.DETAILED_DESC_MAX}
                </span>
              </div>
              <textarea
                rows={6}
                required
                maxLength={VALIDATION_LIMITS.DETAILED_DESC_MAX}
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="Rédigez ici l'histoire complète du brin, ses matières, ses dimensions, ses notes et tous les détails que le client découvrira..."
                className="w-full bg-white border border-[#161514]/15 rounded-lg p-3.5 text-sm focus:outline-none focus:border-[#9A7432]"
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#161514]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[#161514]/20 text-xs font-medium text-[#161514] hover:bg-[#F3EFE8] transition-colors cursor-pointer whitespace-nowrap"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4B475]" />
              <span>
                {isSaving
                  ? 'Enregistrement...'
                  : initialBrand
                    ? 'Enregistrer les Modifications'
                    : 'Publier ce Brin dans la Vitrine'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
