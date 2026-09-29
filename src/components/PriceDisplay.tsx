import React from 'react';
import { formatDtsNumber } from '../types';

interface PriceDisplayProps {
  priceDts: number;
  variant?: 'card' | 'detail' | 'hero' | 'compact';
  quantity?: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceDts,
  variant = 'card',
  quantity = 1,
}) => {
  const total = priceDts * quantity;
  const { whole, decimals } = formatDtsNumber(total);

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-baseline gap-1.5">
        <span className="font-mono-tabular text-base font-semibold tracking-tight text-[#161514]">
          {whole}
          {decimals ? `.${decimals}` : ''}
        </span>
        <span className="text-[11px] font-semibold tracking-widest text-[#9A7432]">
          DTS
        </span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="relative flex items-center justify-between pt-3.5 border-t border-[#161514]/10">
        <div className="flex flex-col">
          <span className="text-[11px] text-[#6E6A64] tracking-wide">
            Official Price
          </span>
          <span className="font-display italic text-xs text-[#9A7432]">
            Tunisian Dinars
          </span>
        </div>

        <div className="relative flex items-baseline gap-1.5 bg-[#161514] text-[#FAF8F5] px-3.5 py-2 rounded-md shadow-xs border border-[#9A7432]/40">
          <span className="font-display text-2xl font-semibold leading-none tracking-tight font-mono-tabular text-[#FAF8F5]">
            {whole}
          </span>
          {decimals && (
            <span className="font-mono-tabular text-xs text-[#D4B475]">
              .{decimals}
            </span>
          )}
          <span className="text-[11px] font-semibold tracking-widest text-[#D4B475] ml-0.5">
            DTS
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="inline-flex items-center gap-4 bg-[#161514]/90 backdrop-blur-md border border-[#D4B475]/40 px-5 py-3 rounded-lg text-[#FAF8F5]">
        <div className="pr-4 border-r border-[#FAF8F5]/15">
          <p className="text-[11px] text-[#D4B475] tracking-wider">
            Certified Value
          </p>
          <p className="font-display italic text-sm text-[#FAF8F5]/80">
            Tropicanna Edition
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight font-mono-tabular text-[#FAF8F5]">
            {whole}
          </span>
          {decimals && (
            <span className="font-mono-tabular text-sm text-[#D4B475]">
              .{decimals}
            </span>
          )}
          <span className="text-xs font-semibold tracking-widest text-[#D4B475]">
            DTS
          </span>
        </div>
      </div>
    );
  }

  // 'detail' variant: Extraordinary luxury horology / haute-couture price plaque
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#161514] text-[#FAF8F5] p-6 border border-[#9A7432]/40 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 20%, #D4B475 0%, transparent 55%)',
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4B475] mb-1">
            <span>Official Tropicanna Price</span>
            <span aria-hidden="true">·</span>
            <span>Tunisian Dinars</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-4xl sm:text-5xl font-semibold leading-none tracking-tight font-mono-tabular text-[#FAF8F5]">
              {whole}
            </span>
            {decimals && (
              <span className="font-mono-tabular text-lg font-medium text-[#D4B475]">
                .{decimals}
              </span>
            )}
            <div className="flex flex-col ml-1">
              <span className="text-sm font-semibold tracking-widest text-[#D4B475] leading-none">
                DTS
              </span>
              <span className="font-display italic text-xs text-[#FAF8F5]/65 mt-0.5">
                Tax Incl. · Certified Piece
              </span>
            </div>
          </div>
        </div>

        {quantity > 1 && (
          <div className="text-left sm:text-right border-t sm:border-t-0 border-[#FAF8F5]/10 pt-3 sm:pt-0">
            <span className="block text-xs text-[#FAF8F5]/60">
              Unit price: {formatDtsNumber(priceDts).whole} DTS × {quantity}
            </span>
            <span className="font-display italic text-sm text-[#D4B475]">
              Total for {quantity} pieces
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
