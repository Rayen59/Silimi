import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { AccessRole } from '../types';
import { HERO_SHOWROOM_IMAGE } from '../data/initialBrands';
import { ResilientImage } from './ResilientImage';

interface PasswordGateProps {
  onUnlock: (role: AccessRole) => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (trimmed === 'tropicanna') {
      setError(null);
      setCode('');
      onUnlock('user');
      return;
    }

    if (trimmed === 'TropicannA10') {
      setError(null);
      setCode('');
      onUnlock('admin');
      return;
    }

    setError(
      'Invalid access code. Please verify your confidential invitation password.'
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#121110] text-[#FAF8F5] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Visual Showcase Column */}
      <div className="relative hidden lg:flex lg:col-span-7 overflow-hidden bg-[#1A1816]">
        <ResilientImage
          src={HERO_SHOWROOM_IMAGE}
          alt="Tropicanna Private Showroom"
          className="w-full h-full object-cover opacity-85 scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/45 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <span className="font-display text-2xl tracking-tight text-[#FAF8F5]">
              Tropicanna
            </span>
          </div>

          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs text-[#D4B475] mb-3">
              <span>Private Showroom</span>
              <span aria-hidden="true">·</span>
              <span>Exclusive Brands & Creations</span>
              <span aria-hidden="true">·</span>
              <span>Tunisia</span>
            </div>
            <h1
              className="font-display text-4xl xl:text-5xl font-normal leading-tight text-[#FAF8F5] mb-4"
              style={{ textWrap: 'balance' }}
            >
              Curated luxury brands presented in a private circle.
            </h1>
            <p className="text-sm text-[#FAF8F5]/75 leading-relaxed max-w-lg">
              Access our confidential catalog of creations, explore full photo
              galleries for every item, view official prices in Tunisian Dinars
              (DTS), and order directly via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Right Authentication Portal Column */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-16 bg-[#121110] border-l border-[#FAF8F5]/10">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Header */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#1E1C19] border border-[#D4B475]/30 text-[#D4B475] mb-6">
              <Lock className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#D4B475] mb-2">
              <span>Entry Portal</span>
              <span aria-hidden="true">·</span>
              <span>Protected Access Code</span>
            </div>

            <h2
              className="font-display text-3xl sm:text-4xl font-normal text-[#FAF8F5] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Welcome to Tropicanna
            </h2>
            <p className="mt-2.5 text-sm text-[#FAF8F5]/65 leading-relaxed">
              Please enter your confidential access password to enter the
              showroom or access the administration studio.
            </p>
          </div>

          {/* Password Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="tropicanna-access-code"
                className="block text-xs font-medium text-[#FAF8F5]/80 mb-2"
              >
                Access Password
              </label>
              <div className="relative">
                <input
                  id="tropicanna-access-code"
                  type={showPassword ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password..."
                  autoFocus
                  autoComplete="off"
                  className="w-full bg-[#1B1917] border border-[#FAF8F5]/15 focus:border-[#D4B475] rounded-lg px-4 py-3.5 pr-12 text-sm text-[#FAF8F5] placeholder-[#FAF8F5]/35 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#FAF8F5]/50 hover:text-[#FAF8F5] transition-colors"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-[#3A1D1D] border border-[#E57373]/40 text-xs text-[#FFCDD2] leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#D4B475] hover:bg-[#DFC288] text-[#121110] font-semibold text-sm px-6 py-3.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Enter Tropicanna</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trust Footer */}
          <div className="mt-10 pt-6 border-t border-[#FAF8F5]/10 flex items-center gap-2 text-xs text-[#FAF8F5]/45">
            <ShieldCheck className="w-4 h-4 text-[#D4B475] shrink-0" />
            <span>
              Strictly confidential access · Direct WhatsApp orders (+216 99 532 209)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
