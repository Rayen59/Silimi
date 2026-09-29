import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  ShoppingBag,
  Check,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  PhoneCall,
  Copy,
} from 'lucide-react';
import {
  BrandItem,
  WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  formatDtsNumber,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { PriceDisplay } from './PriceDisplay';

interface ProductDetailViewProps {
  brand: BrandItem;
  isAdmin: boolean;
  onBack: () => void;
  onAddToCart: (brand: BrandItem, quantity: number) => void;
  onEditBrand: (brand: BrandItem) => void;
  onDeleteBrand: (brandId: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  brand,
  isAdmin,
  onBack,
  onAddToCart,
  onEditBrand,
  onDeleteBrand,
}) => {
  // Combine mainPhoto + galleryPhotos without duplicates, keeping mainPhoto first
  const allPhotos = Array.from(
    new Set([brand.mainPhoto, ...(brand.galleryPhotos || [])].filter(Boolean))
  );

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentPhoto = allPhotos[activePhotoIndex] || brand.mainPhoto;

  const whatsappDirectMessage = [
    'Bonjour Maison Tropicanna,',
    '',
    `Je souhaite acheter le brin suivant :`,
    `• Produit : ${brand.title}`,
    `• Marque : ${brand.brandName}`,
    `• Référence : ${brand.referenceCode}`,
    `• Quantité : ${quantity}`,
    `• Prix Total : ${formatDtsNumber(brand.priceDts * quantity).whole} DTS`,
    '',
    'Merci de me contacter pour finaliser ma commande.',
  ].join('\n');

  const whatsappHref = buildWhatsAppUrl(whatsappDirectMessage);

  const handleAdd = () => {
    onAddToCart(brand, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 2200);
  };

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText('+21699532209');
    setCopiedPhone(true);
    window.setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Navigation & Admin Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#161514]/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#161514] hover:text-[#9A7432] transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la Collection Tropicanna</span>
        </button>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onEditBrand(brand)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#161514] text-[#FAF8F5] rounded-lg hover:bg-[#2C2A28] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#D4B475]" />
              <span>Modifier ce Brin</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteBrand(brand.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#8B3A3A]/30 text-[#8B3A3A] hover:bg-[#8B3A3A]/10 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          </div>
        )}
      </div>

      {/* Main PDP Split Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Multi-Photo Editorial Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#EFECE6] border border-[#161514]/10 group">
            <ResilientImage
              src={currentPhoto}
              alt={`${brand.title} — Photo ${activePhotoIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300"
            />

            {/* Subtle Photo Index Counter */}
            <div className="absolute bottom-4 left-4 bg-[#161514]/80 backdrop-blur-xs text-[#FAF8F5] px-3 py-1.5 rounded-md text-xs font-mono-tabular">
              Photo {activePhotoIndex + 1} / {allPhotos.length}
              {activePhotoIndex === 0 ? ' · Photo Principale' : ''}
            </div>

            {/* Fullscreen Zoom Affordance */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 p-2.5 rounded-lg bg-[#161514]/75 hover:bg-[#161514] text-[#FAF8F5] transition-colors cursor-pointer"
              aria-label="Agrandir la photographie"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Gallery Prev/Next Controls when multiple photos exist */}
            {allPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? allPhotos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF8F5]/90 hover:bg-[#FAF8F5] text-[#161514] shadow-md transition-colors cursor-pointer"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === allPhotos.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF8F5]/90 hover:bg-[#FAF8F5] text-[#161514] shadow-md transition-colors cursor-pointer"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allPhotos.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {allPhotos.map((photoUrl, idx) => (
                <button
                  key={`${photoUrl}-${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === activePhotoIndex
                      ? 'border-[#9A7432] ring-2 ring-[#9A7432]/25'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={photoUrl}
                    alt={`Miniature ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#161514]/80 text-[#D4B475] text-[10px] py-0.5 text-center font-medium">
                      Principale
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase & Story Module */}
        <div className="lg:col-span-5 space-y-6">
          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6A64]">
            <span className="font-semibold text-[#9A7432]">
              {brand.brandName}
            </span>
            <span aria-hidden="true">·</span>
            <span>{brand.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Réf. {brand.referenceCode}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#161514] font-medium">
              {brand.availability}
            </span>
          </div>

          {/* Product Display Headline */}
          <h1
            className="font-display text-3xl sm:text-4xl font-semibold text-[#161514] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {brand.title}
          </h1>

          {/* Short Summary Lead-In */}
          <p className="text-base text-[#46433F] leading-relaxed border-l-2 border-[#9A7432] pl-4 italic font-display text-lg">
            {brand.shortDescription}
          </p>

          {/* Extraordinary DTS Price Plaque */}
          <PriceDisplay
            priceDts={brand.priceDts}
            variant="detail"
            quantity={quantity}
          />

          {/* Quantity & Contiguous Purchase Actions */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6E6A64]">
                Quantité désirée
              </span>
              <div className="inline-flex items-center border border-[#161514]/20 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-sm font-medium text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-mono-tabular font-semibold text-[#161514]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="px-3.5 py-2 text-sm font-medium text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary Action 1: Direct WhatsApp Purchase (+21699532209) */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#1E5631] hover:bg-[#174426] text-white font-semibold text-sm px-6 py-4 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>Acheter via WhatsApp ({WHATSAPP_DISPLAY})</span>
            </a>

            {/* Secondary Action 2: Add to Persistent Cart */}
            <button
              type="button"
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-2.5 font-semibold text-sm px-6 py-3.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                addedFeedback
                  ? 'bg-[#161514] text-[#D4B475] border-[#161514]'
                  : 'bg-white hover:bg-[#F3EFE8] text-[#161514] border-[#161514]/25'
              }`}
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-[#D4B475]" />
                  <span>Ajouté au panier pour revenir plus tard</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#9A7432]" />
                  <span>Ajouter au Panier (Sauvegarder pour après)</span>
                </>
              )}
            </button>

            {/* Direct Contact Assistance Line */}
            <div className="flex items-center justify-between text-xs text-[#6E6A64] pt-2 px-1">
              <span className="inline-flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#9A7432]" />
                <span>Ligne directe Admin : {WHATSAPP_DISPLAY}</span>
              </span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1 text-[#161514] hover:text-[#9A7432] font-medium cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedPhone ? 'Numéro copié' : 'Copier le numéro'}</span>
              </button>
            </div>
          </div>

          {/* Complete Detailed Description by Admin */}
          <div className="pt-6 border-t border-[#161514]/10 space-y-3">
            <h2 className="font-display text-2xl font-semibold text-[#161514]">
              Description en Détail & Savoir-Faire
            </h2>
            <div className="space-y-3.5 text-[15px] text-[#2C2A28] leading-relaxed whitespace-pre-line">
              {brand.detailedDescription}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#121110]/95 flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-[#FAF8F5]/10 hover:bg-[#FAF8F5]/20 text-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Fermer l'aperçu plein écran"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full space-y-4">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#1A1816]">
              <ResilientImage
                src={currentPhoto}
                alt={brand.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#FAF8F5]/75">
              <span>
                {brand.brandName} · {brand.title}
              </span>
              <span className="font-mono-tabular">
                Photo {activePhotoIndex + 1} sur {allPhotos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
