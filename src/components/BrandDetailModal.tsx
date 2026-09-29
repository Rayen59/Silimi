import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  MessageCircle,
  ArrowUpRight,
  Plus,
  Minus,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import {
  BrandItem,
  AccessRole,
  WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  formatDtsNumber,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { PriceDisplay } from './PriceDisplay';

interface BrandDetailViewProps {
  brand: BrandItem;
  role: AccessRole;
  onBack: () => void;
  onAddToCart: (brand: BrandItem, quantity: number) => void;
  onEditBrand?: (brand: BrandItem) => void;
  onDeleteBrand?: (brandId: string) => void;
}

export const BrandDetailView: React.FC<BrandDetailViewProps> = ({
  brand,
  role,
  onBack,
  onAddToCart,
  onEditBrand,
  onDeleteBrand,
}) => {
  // Combine mainPhoto + galleryPhotos without duplicates, keeping mainPhoto first
  const allPhotos = Array.from(
    new Set([brand.mainPhoto, ...(brand.galleryPhotos || [])].filter(Boolean))
  );

  const [activePhoto, setActivePhoto] = useState<string>(
    allPhotos[0] || brand.mainPhoto
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const totalDts = brand.priceDts * quantity;
  const formattedTotal = formatDtsNumber(totalDts);
  const formattedUnit = formatDtsNumber(brand.priceDts);

  const whatsappDirectMessage = [
    'Bonjour Maison Tropicanna,',
    '',
    'Je souhaite acheter ce brin :',
    `• Produit : ${brand.title}`,
    `• Marque : ${brand.brandName}`,
    `• Référence : ${brand.referenceCode}`,
    `• Prix unitaire : ${formattedUnit.whole}${formattedUnit.decimals ? ',' + formattedUnit.decimals : ''} DTS`,
    `• Quantité souhaitée : ${quantity}`,
    `• Total : ${formattedTotal.whole}${formattedTotal.decimals ? ',' + formattedTotal.decimals : ''} DTS`,
    '',
    'Merci de me contacter pour finaliser ma commande.',
  ].join('\n');

  const whatsappDirectUrl = buildWhatsAppUrl(whatsappDirectMessage);

  const handleAdd = () => {
    onAddToCart(brand, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Navigation Breadcrumb & Admin Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#161514]/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#161514] hover:text-[#9A7432] transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la vitrine Tropicanna</span>
        </button>

        {role === 'admin' && (
          <div className="flex items-center gap-2.5">
            {onEditBrand && (
              <button
                type="button"
                onClick={() => onEditBrand(brand)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#161514]/20 bg-white hover:bg-[#F3EFE8] text-xs font-medium text-[#161514] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5 text-[#9A7432]" />
                <span>Modifier ce brin</span>
              </button>
            )}

            {onDeleteBrand && (
              <>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#8B3A3A]/30 bg-white hover:bg-[#FDF2F2] text-xs font-medium text-[#8B3A3A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-[#FDF2F2] border border-[#8B3A3A]/40 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-[#8B3A3A] font-medium">
                      Confirmer ?
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteBrand(brand.id)}
                      className="px-2.5 py-1 bg-[#8B3A3A] text-white text-xs rounded hover:bg-[#6E2B2B] cursor-pointer whitespace-nowrap"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-[#6E6A64] hover:text-[#161514] cursor-pointer whitespace-nowrap"
                    >
                      Non
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Two-Column PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Sticky High-Resolution Photo Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#EFECE6] border border-[#161514]/10">
            <ResilientImage
              src={activePhoto}
              alt={brand.title}
              fallbackLabel={brand.title}
              className="w-full h-full object-cover"
            />
            {activePhoto === brand.mainPhoto && (
              <div className="absolute bottom-3 left-3 bg-[#161514]/80 backdrop-blur-xs text-[#FAF8F5] px-3 py-1 rounded text-[11px] tracking-wide">
                Photo Principale d’Accueil
              </div>
            )}
          </div>

          {/* Thumbnail Selector Strip */}
          {allPhotos.length > 1 && (
            <div>
              <div className="flex items-center justify-between text-xs text-[#6E6A64] mb-2">
                <span>
                  Galerie détaillée partagée par l’administrateur (
                  {allPhotos.length} photos)
                </span>
                <span>Cliquez sur une vignette pour agrandir</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {allPhotos.map((photoUrl, index) => {
                  const isSelected = photoUrl === activePhoto;
                  return (
                    <button
                      key={`${photoUrl}-${index}`}
                      type="button"
                      onClick={() => setActivePhoto(photoUrl)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#9A7432] ring-2 ring-[#9A7432]/30 scale-[1.02]'
                          : 'border-[#161514]/10 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={photoUrl}
                        alt={`${brand.title} vue ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module & Editorial Description */}
        <div className="lg:col-span-5 space-y-6">
          {/* Clean Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6A64]">
            <span className="font-medium text-[#9A7432]">{brand.brandName}</span>
            <span aria-hidden="true">·</span>
            <span>{brand.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Réf. {brand.referenceCode}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#161514] font-medium">
              {brand.availability}
            </span>
          </div>

          {/* Product Title */}
          <h1
            className="font-display text-3xl sm:text-4xl font-semibold text-[#161514] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {brand.title}
          </h1>

          {/* Teaser Summary */}
          <p className="text-base text-[#4A4742] leading-relaxed border-l-2 border-[#9A7432] pl-4 italic font-display text-lg">
            {brand.shortDescription}
          </p>

          {/* Extraordinary Price Plaque in DTS */}
          <PriceDisplay
            priceDts={brand.priceDts}
            quantity={quantity}
            variant="detail"
          />

          {/* Quantity & Primary Action Module */}
          <div className="p-5 rounded-xl bg-[#F3EFE8] border border-[#161514]/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#161514]">
                Quantité désirée
              </span>
              <div className="inline-flex items-center bg-white border border-[#161514]/15 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-1.5 text-sm font-mono-tabular font-semibold text-[#161514]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="px-3 py-2 text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Direct Buy via WhatsApp (+21699532209) */}
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] font-medium text-xs sm:text-sm px-5 py-3.5 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-[#D4B475] shrink-0" />
                <span>Acheter sur WhatsApp</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>

              {/* Save to Cart for Later */}
              <button
                type="button"
                onClick={handleAdd}
                className={`flex items-center justify-center gap-2 font-medium text-xs sm:text-sm px-5 py-3.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  addedFeedback
                    ? 'bg-[#1F4E3B] border-[#1F4E3B] text-white'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#161514] border-[#161514]/20'
                }`}
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Ajouté au Panier</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#9A7432] shrink-0" />
                    <span>Ajouter au Panier</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6E6A64] pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9A7432]" />
                <span>Contact direct Admin : {WHATSAPP_DISPLAY}</span>
              </span>
              <span>Panier sauvegardé</span>
            </div>
          </div>

          {/* Complete Detailed Description by Admin */}
          <div className="pt-6 border-t border-[#161514]/10">
            <div className="flex items-center gap-2 text-xs text-[#6E6A64] mb-3">
              <span>Description Détaillée & Note de l’Administrateur</span>
              <span aria-hidden="true">·</span>
              <span>Fiche Complète</span>
            </div>
            <div className="prose prose-sm max-w-[68ch] text-[#2B2927] space-y-3.5 leading-relaxed whitespace-pre-line text-[15px]">
              {brand.detailedDescription}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
