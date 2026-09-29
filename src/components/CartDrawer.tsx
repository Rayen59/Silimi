import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  CartItem,
  WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  formatDtsNumber,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { PriceDisplay } from './PriceDisplay';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (brandId: string, delta: number) => void;
  onRemoveItem: (brandId: string) => void;
  onClearCart: () => void;
  onSelectBrand: (brandId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectBrand,
}) => {
  if (!isOpen) return null;

  const totalDts = items.reduce(
    (acc, item) => acc + item.priceDts * item.quantity,
    0
  );
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const whatsappCartMessage = [
    'Hello Tropicanna,',
    '',
    'I would like to order the items saved in my cart:',
    ...items.map(
      (item, idx) =>
        `${idx + 1}. ${item.title} (${item.brandName} — Ref: ${item.referenceCode}) × ${item.quantity} = ${formatDtsNumber(item.priceDts * item.quantity).whole} DTS`
    ),
    '',
    `Total Order Amount: ${formatDtsNumber(totalDts).whole} DTS`,
    '',
    'Please confirm availability and delivery details.',
  ].join('\n');

  const whatsappHref = buildWhatsAppUrl(whatsappCartMessage);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#161514]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside
        className="relative z-10 w-full max-w-md bg-[#FAF8F5] text-[#161514] h-full flex flex-col shadow-2xl border-l border-[#161514]/10"
        aria-label="Your Tropicanna Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#161514]/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6E6A64]">
              <span>Saved Selection</span>
              <span aria-hidden="true">·</span>
              <span>
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#161514]">
              Your Private Cart
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6E6A64] hover:text-[#161514] hover:bg-[#161514]/5 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#9A7432] mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl text-[#161514] mb-2">
                Your cart is empty
              </h3>
              <p className="text-sm text-[#6E6A64] max-w-xs leading-relaxed mb-6">
                Add your favorite brands and creations to the cart to save them
                and return anytime later.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#161514] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#2C2A28] transition-colors cursor-pointer whitespace-nowrap"
              >
                Explore the Collection
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[#6E6A64] pb-2 border-b border-[#161514]/10">
                <span>Automatically saved on this device</span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-[#8B3A3A] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Clear cart
                </button>
              </div>

              <div className="divide-y divide-[#161514]/10">
                {items.map((item) => (
                  <div
                    key={item.brandId}
                    className="py-4 first:pt-1 flex gap-4 items-start"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBrand(item.brandId);
                        onClose();
                      }}
                      className="w-20 h-20 rounded-lg overflow-hidden bg-[#EFECE6] shrink-0 border border-[#161514]/10 cursor-pointer group"
                    >
                      <ResilientImage
                        src={item.mainPhoto}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-[#6E6A64]">
                            {item.brandName} · {item.referenceCode}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectBrand(item.brandId);
                              onClose();
                            }}
                            className="font-display text-lg font-semibold text-[#161514] hover:text-[#9A7432] transition-colors text-left line-clamp-1 cursor-pointer"
                          >
                            {item.title}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.brandId)}
                          className="p-1 text-[#6E6A64] hover:text-[#8B3A3A] transition-colors cursor-pointer"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#161514]/15 rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.brandId, -1)}
                            className="p-1.5 text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-mono-tabular font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.brandId, 1)}
                            className="p-1.5 text-[#161514] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <PriceDisplay
                          priceDts={item.priceDts}
                          quantity={item.quantity}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout via WhatsApp */}
        {items.length > 0 && (
          <div className="p-6 bg-[#F3EFE8] border-t border-[#161514]/10 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-xs text-[#6E6A64]">
                  Estimated Total
                </span>
                <span className="font-display italic text-xs text-[#9A7432]">
                  Personal payment & delivery arrangement
                </span>
              </div>
              <div className="text-right">
                <span className="font-display text-3xl font-semibold font-mono-tabular text-[#161514]">
                  {formatDtsNumber(totalDts).whole}
                </span>
                <span className="text-xs font-semibold tracking-widest text-[#9A7432] ml-1.5">
                  DTS
                </span>
              </div>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] font-medium text-xs sm:text-sm px-5 py-3.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 text-[#D4B475] shrink-0" />
              <span>Order via WhatsApp ({WHATSAPP_DISPLAY})</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </a>
          </div>
        )}
      </aside>
    </div>
  );
};
