import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  Plus,
  Search,
  Check,
  ArrowUpRight,
  LogOut,
  Pencil,
  Sparkles,
  Cloud,
  Eye,
} from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
  testConnection,
} from './firebase';
import {
  BrandItem,
  CartItem,
  AccessRole,
  WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  formatDtsNumber,
  VALIDATION_LIMITS,
} from './types';
import { INITIAL_BRANDS, HERO_SHOWROOM_IMAGE } from './data/initialBrands';
import { PasswordGate } from './components/PasswordGate';
import { ResilientImage } from './components/ResilientImage';
import { PriceDisplay } from './components/PriceDisplay';
import { CartDrawer } from './components/CartDrawer';
import { BrandDetailView } from './components/BrandDetailModal';
import { AdminStudioModal } from './components/AdminStudioModal';

const LOCAL_BRANDS_KEY = 'tropicanna_catalog_brands_blank_v2';
const LOCAL_CART_KEY = 'tropicanna_saved_cart_blank_v2';

export default function App() {
  // Password Gate Role ('locked' on initial arrival so user enters code immediately)
  const [role, setRole] = useState<AccessRole>('locked');

  // Firebase Auth state (used for cloud Firestore persistence when Admin connects Google)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Catalog state initialized completely blank unless Admin has added items
  const [brands, setBrands] = useState<BrandItem[]>(() => {
    try {
      localStorage.removeItem('tropicanna_catalog_brands_v1');
      localStorage.removeItem('tropicanna_catalog_v1');
      const saved = localStorage.getItem(LOCAL_BRANDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to empty INITIAL_BRANDS
    }
    return INITIAL_BRANDS;
  });

  // Persistent Shopping Cart ("ajouter au panier pour revenir après")
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      localStorage.removeItem('tropicanna_saved_cart_v1');
      localStorage.removeItem('tropicanna_cart_v1');
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Navigation & UI state
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [addedCardId, setAddedCardId] = useState<string | null>(null);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  // Validate Firestore connection on boot
  useEffect(() => {
    testConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore listener when authenticated
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    const brandsPath = 'brands';
    const q = query(
      collection(db, brandsPath),
      where('availability', 'in', [
        'En Stock',
        'Édition Limitée',
        'Sur Commande',
      ])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: BrandItem[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: String(d.title || ''),
              brandName: String(d.brandName || ''),
              category: String(d.category || 'Collection Privée'),
              shortDescription: String(d.shortDescription || ''),
              detailedDescription: String(d.detailedDescription || ''),
              priceDts: Number(d.priceDts || 0),
              mainPhoto: String(d.mainPhoto || ''),
              galleryPhotos: Array.isArray(d.galleryPhotos)
                ? d.galleryPhotos.map(String)
                : [],
              referenceCode: String(d.referenceCode || 'TRP-01'),
              availability: d.availability || 'En Stock',
              authorId: String(d.authorId || ''),
              createdAt: d.createdAt?.toDate
                ? d.createdAt.toDate().toISOString()
                : new Date().toISOString(),
              updatedAt: d.updatedAt?.toDate
                ? d.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
            };
          });

          setBrands((prev) => {
            const byId = new Map<string, BrandItem>();
            remoteItems.forEach((item) => byId.set(item.id, item));
            prev.forEach((item) => {
              if (!byId.has(item.id)) {
                byId.set(item.id, item);
              }
            });
            const merged = Array.from(byId.values());
            localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, brandsPath);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  // Persist cart to localStorage so user can return later
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  // Persist brands to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(brands));
    } catch {
      // ignore storage quota errors
    }
  }, [brands]);

  // Derived categories & filtered items
  const categories = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesCategory =
        activeCategory === 'all' || b.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.brandName.toLowerCase().includes(q) ||
        b.shortDescription.toLowerCase().includes(q) ||
        b.referenceCode.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [brands, activeCategory, searchQuery]);

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedBrandId) || null,
    [brands, selectedBrandId]
  );

  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  // Cart Handlers
  const handleAddToCart = (brand: BrandItem, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.brandId === brand.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [
        ...prev,
        {
          brandId: brand.id,
          title: brand.title,
          brandName: brand.brandName,
          referenceCode: brand.referenceCode,
          priceDts: brand.priceDts,
          mainPhoto: brand.mainPhoto,
          quantity,
        },
      ];
    });

    setAddedCardId(brand.id);
    window.setTimeout(() => {
      setAddedCardId((curr) => (curr === brand.id ? null : curr));
    }, 1800);
  };

  const handleUpdateCartQuantity = (brandId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.brandId === brandId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (brandId: string) => {
    setCart((prev) => prev.filter((item) => item.brandId !== brandId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Admin Save Brand Handler (Local + Firestore Cloud when authenticated)
  const handleSaveBrand = async (
    brandData: Omit<BrandItem, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const rawId =
      existingId ||
      `trp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const safeId = rawId
      .replace(/[^a-zA-Z0-9_\-]/g, '-')
      .slice(0, 128);

    const nowIso = new Date().toISOString();
    const existingItem = brands.find((b) => b.id === safeId);

    const newItem: BrandItem = {
      ...brandData,
      id: safeId,
      authorId: firebaseUser?.uid || existingItem?.authorId || 'admin_tropicanna',
      createdAt: existingItem?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    // Update immediate UI state & localStorage
    setBrands((prev) => {
      const exists = prev.some((b) => b.id === safeId);
      if (exists) {
        return prev.map((b) => (b.id === safeId ? newItem : b));
      }
      return [newItem, ...prev];
    });

    // Also update cart item snapshot if this brand is in the cart
    setCart((prev) =>
      prev.map((c) =>
        c.brandId === safeId
          ? {
              ...c,
              title: newItem.title,
              brandName: newItem.brandName,
              referenceCode: newItem.referenceCode,
              priceDts: newItem.priceDts,
              mainPhoto: newItem.mainPhoto,
            }
          : c
      )
    );

    // If admin connected Google account, persist to Firestore following strict blueprint rules
    if (firebaseUser) {
      const docPath = `brands/${safeId}`;
      try {
        await setDoc(doc(db, 'brands', safeId), {
          title: newItem.title.slice(0, VALIDATION_LIMITS.TITLE_MAX),
          brandName: newItem.brandName.slice(0, VALIDATION_LIMITS.BRAND_NAME_MAX),
          category: newItem.category.slice(0, VALIDATION_LIMITS.CATEGORY_MAX),
          shortDescription: newItem.shortDescription.slice(
            0,
            VALIDATION_LIMITS.SHORT_DESC_MAX
          ),
          detailedDescription: newItem.detailedDescription.slice(
            0,
            VALIDATION_LIMITS.DETAILED_DESC_MAX
          ),
          priceDts: Number(newItem.priceDts),
          mainPhoto: newItem.mainPhoto.slice(
            0,
            VALIDATION_LIMITS.PHOTO_MAX_CHARS
          ),
          galleryPhotos: newItem.galleryPhotos
            .slice(0, VALIDATION_LIMITS.GALLERY_MAX_COUNT)
            .map((p) => p.slice(0, VALIDATION_LIMITS.PHOTO_MAX_CHARS)),
          referenceCode: newItem.referenceCode
            .replace(/[^a-zA-Z0-9_\-]/g, '-')
            .slice(0, VALIDATION_LIMITS.REFERENCE_MAX),
          availability: newItem.availability,
          authorId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setCloudNotice('Brin synchronisé sur le Cloud Firestore Tropicanna.');
        window.setTimeout(() => setCloudNotice(null), 4000);
      } catch (error) {
        handleFirestoreError(
          error,
          existingId ? OperationType.UPDATE : OperationType.CREATE,
          docPath
        );
      }
    } else {
      setCloudNotice('Brin publié dans la vitrine Tropicanna.');
      window.setTimeout(() => setCloudNotice(null), 3500);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    setCart((prev) => prev.filter((c) => c.brandId !== brandId));
    if (selectedBrandId === brandId) {
      setSelectedBrandId(null);
    }

    if (firebaseUser && VALIDATION_LIMITS.ID_PATTERN.test(brandId)) {
      try {
        await deleteDoc(doc(db, 'brands', brandId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `brands/${brandId}`);
      }
    }
  };

  const handleGoogleCloudConnect = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setCloudNotice('Synchronisation Cloud Administrateur activée.');
      window.setTimeout(() => setCloudNotice(null), 3500);
    } catch {
      setCloudNotice(
        'Connexion Google annulée. Vos publications restent enregistrées localement.'
      );
      window.setTimeout(() => setCloudNotice(null), 3500);
    }
  };

  const handleLogout = async () => {
    setSelectedBrandId(null);
    setIsCartOpen(false);
    setIsAdminModalOpen(false);
    setEditingBrand(null);
    setRole('locked');
    if (firebaseUser) {
      try {
        await signOut(auth);
      } catch {
        // Ignore signOut error
      }
    }
  };

  // 1. Entry Password Gate ("lorsque il entre a la page directement alors afficher a lui un code où il peut saisir un mot de passe")
  if (role === 'locked') {
    return <PasswordGate onUnlock={(unlockedRole) => setRole(unlockedRole)} />;
  }

  const featuredHeroBrand = brands[0];
  const generalWhatsAppUrl = buildWhatsAppUrl(
    'Bonjour Maison Tropicanna, je visite votre vitrine privée et je souhaite avoir des informations sur vos brins.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#161514]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#161514]/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#vitrine"
            onClick={(e) => {
              e.preventDefault();
              setSelectedBrandId(null);
            }}
            className="font-display text-2xl font-semibold tracking-tight text-[#161514] whitespace-nowrap shrink-0"
          >
            Tropicanna
          </a>

          {/* Zone 2: 4–5 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A5650]">
            <a
              href="#collection"
              onClick={(e) => {
                e.preventDefault();
                setSelectedBrandId(null);
                document
                  .getElementById('collection')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#161514] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Collection
            </a>
            <a
              href="#maisons"
              onClick={(e) => {
                e.preventDefault();
                setSelectedBrandId(null);
                document
                  .getElementById('maisons')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#161514] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Maisons & Savoir-Faire
            </a>
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#161514] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Contact Direct
            </a>
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setEditingBrand(null);
                  setIsAdminModalOpen(true);
                }}
                className="text-[#9A7432] hover:text-[#161514] hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap"
              >
                Studio Admin
              </button>
            )}
          </nav>

          {/* Zone 3: 1–2 primary actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4B475]" />
              <span>Panier ({totalCartItems})</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#161514]/20 bg-white hover:bg-[#FDF2F2] hover:border-[#8B3A3A]/40 text-xs font-medium text-[#161514] hover:text-[#8B3A3A] transition-colors cursor-pointer whitespace-nowrap"
              title="Se déconnecter du compte"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Control Banner (Visible exclusively when logged in as Admin) */}
      {role === 'admin' && (
        <div className="bg-[#161514] text-[#FAF8F5] border-b border-[#9A7432]/30">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#D4B475] font-medium">
                Espace Administrateur Actif
              </span>
              <span aria-hidden="true" className="text-[#FAF8F5]/40">
                ·
              </span>
              <span className="text-[#FAF8F5]/80">
                Partagez vos brins, choisissez la photo principale d’accueil et
                fixez les tarifs en DTS.
              </span>
              {cloudNotice && (
                <>
                  <span aria-hidden="true" className="text-[#FAF8F5]/40">
                    ·
                  </span>
                  <span className="text-[#A7F3D0] font-medium">
                    {cloudNotice}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {!firebaseUser && (
                <button
                  type="button"
                  onClick={handleGoogleCloudConnect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F5]/10 hover:bg-[#FAF8F5]/20 text-[#FAF8F5] text-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#D4B475]" />
                  <span>Activer Sync Cloud</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingBrand(null);
                  setIsAdminModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#D4B475] hover:bg-[#DFC288] text-[#121110] font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un Brin & Photos</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#FAF8F5]/20 hover:bg-[#FAF8F5]/10 text-[#FAF8F5] text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-[#D4B475]" />
                <span>Déconnexion Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Either Product Detail View OR Storefront Showcase */}
      <main className="flex-1">
        {selectedBrand ? (
          <BrandDetailView
            brand={selectedBrand}
            role={role}
            onBack={() => setSelectedBrandId(null)}
            onAddToCart={handleAddToCart}
            onEditBrand={(brandToEdit) => {
              setEditingBrand(brandToEdit);
              setIsAdminModalOpen(true);
            }}
            onDeleteBrand={handleDeleteBrand}
          />
        ) : (
          <>
            {/* Section 1: Storefront Hero Showcase */}
            <section
              id="vitrine"
              className="relative border-b border-[#161514]/10 bg-[#F3EFE8]"
            >
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Editorial Column */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6A64]">
                      <span className="font-medium text-[#9A7432]">
                        Maison Tropicanna
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Vitrine Privée de Marques</span>
                      <span aria-hidden="true">·</span>
                      <span>Tarifs Certifiés en DTS</span>
                    </div>

                    <h1
                      className="font-display text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#161514] leading-[1.08] tracking-tight"
                      style={{ textWrap: 'balance' }}
                    >
                      Des brins d’exception présentés dans leurs moindres
                      détails.
                    </h1>

                    <p className="text-base text-[#4A4742] leading-relaxed max-w-xl">
                      Chaque création partagée par notre maison dévoile sa
                      galerie photographique complète, son histoire détaillée et
                      son prix en Dinars Tunisiens (DTS). Commandez
                      instantanément par WhatsApp ou conservez votre sélection
                      dans votre panier privé.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href="#collection"
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById('collection')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        <span>Découvrir les Brins ({brands.length})</span>
                        <ArrowUpRight className="w-4 h-4 text-[#D4B475]" />
                      </a>

                      {role === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrand(null);
                            setIsAdminModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#9A7432] bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4 text-[#9A7432]" />
                          <span>Publier un Nouveau Brin</span>
                        </button>
                      ) : (
                        <a
                          href={generalWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#161514]/20 bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          <MessageCircle className="w-4 h-4 text-[#9A7432]" />
                          <span>WhatsApp Direct ({WHATSAPP_DISPLAY})</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Hero Visual Spotlight */}
                  <div className="lg:col-span-6">
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-[#161514] border border-[#161514]/15 shadow-md group">
                      <ResilientImage
                        src={
                          featuredHeroBrand?.mainPhoto || HERO_SHOWROOM_IMAGE
                        }
                        alt={
                          featuredHeroBrand?.title ||
                          'Collection Privée Tropicanna'
                        }
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {featuredHeroBrand && (
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div className="text-[#FAF8F5]">
                            <div className="flex items-center gap-2 text-xs text-[#D4B475] mb-1">
                              <span>À la Une</span>
                              <span aria-hidden="true">·</span>
                              <span>{featuredHeroBrand.brandName}</span>
                            </div>
                            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
                              {featuredHeroBrand.title}
                            </h2>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedBrandId(featuredHeroBrand.id)
                              }
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#D4B475] hover:underline cursor-pointer"
                            >
                              <span>Voir les photos & détails</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <PriceDisplay
                            priceDts={featuredHeroBrand.priceDts}
                            variant="hero"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Featured Brands & Products Collection ("les brins") */}
            <section
              id="collection"
              className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"
            >
              {/* Section Header + Search & Category Filters */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#161514]/10">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#6E6A64] mb-2">
                    <span>01. Catalogue Officiel</span>
                    <span aria-hidden="true">·</span>
                    <span>Cliquez sur un brin pour voir tous les détails</span>
                  </div>
                  <h2
                    className="font-display text-3xl sm:text-4xl font-semibold text-[#161514]"
                    style={{ textWrap: 'balance' }}
                  >
                    Les Brins & Marques Partagés
                  </h2>
                </div>

                {/* Search Input */}
                <div className="w-full md:w-72 relative">
                  <Search className="w-4 h-4 text-[#6E6A64] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un brin, une marque..."
                    className="w-full bg-white border border-[#161514]/15 focus:border-[#9A7432] rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-[#161514] placeholder-[#6E6A64] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Interactive Category Filter Bar (Segmented Controls) */}
              <div className="flex flex-wrap items-center justify-between gap-4 my-6">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategory === 'all'
                        ? 'bg-white text-[#161514] shadow-xs'
                        : 'text-[#5A5650] hover:text-[#161514]'
                    }`}
                  >
                    Tous les Brins ({brands.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        activeCategory === cat
                          ? 'bg-white text-[#161514] shadow-xs'
                          : 'text-[#5A5650] hover:text-[#161514]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBrand(null);
                      setIsAdminModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A7432] hover:text-[#161514] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un nouveau brin à l’accueil</span>
                  </button>
                )}
              </div>

              {/* 3-Column Product Grid */}
              {brands.length === 0 ? (
                <div className="text-center py-20 bg-[#F3EFE8] rounded-xl border border-[#161514]/10 p-8 max-w-2xl mx-auto">
                  <Sparkles className="w-6 h-6 text-[#9A7432] mx-auto mb-3" />
                  <h3 className="font-display text-2xl sm:text-3xl text-[#161514] mb-2">
                    Aucun brin publié pour le moment
                  </h3>
                  <p className="text-sm text-[#6E6A64] mb-6 leading-relaxed">
                    {role === 'admin'
                      ? 'Votre catalogue est vierge. Cliquez sur le bouton ci-dessous pour ajouter votre premier brin, importer vos photos, choisir la photo principale d’accueil et définir son prix en DTS.'
                      : 'La collection est en cours de préparation par l’administrateur. Revenez prochainement ou contactez-nous directement sur WhatsApp.'}
                  </p>
                  {role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBrand(null);
                        setIsAdminModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs sm:text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#D4B475]" />
                      <span>Publier votre premier brin</span>
                    </button>
                  ) : (
                    <a
                      href={generalWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#D4B475]" />
                      <span>Contacter l’Admin ({WHATSAPP_DISPLAY})</span>
                    </a>
                  )}
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-16 bg-[#F3EFE8] rounded-xl border border-[#161514]/10 p-8">
                  <Sparkles className="w-6 h-6 text-[#9A7432] mx-auto mb-3" />
                  <h3 className="font-display text-2xl text-[#161514] mb-2">
                    Aucun brin ne correspond à votre recherche
                  </h3>
                  <p className="text-sm text-[#6E6A64] mb-5">
                    Réinitialisez les filtres pour afficher l’ensemble de la
                    collection Tropicanna.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-[#161514] text-[#FAF8F5] text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Afficher toute la collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredBrands.map((brand) => {
                    const isAdded = addedCardId === brand.id;
                    const photoCount = Array.from(
                      new Set(
                        [brand.mainPhoto, ...(brand.galleryPhotos || [])].filter(
                          Boolean
                        )
                      )
                    ).length;

                    const formattedUnit = formatDtsNumber(brand.priceDts);
                    const cardWhatsAppMessage = [
                      'Bonjour Maison Tropicanna,',
                      '',
                      `Je souhaite acheter le brin « ${brand.title} » (${brand.brandName} — Réf: ${brand.referenceCode}) au prix de ${formattedUnit.whole}${formattedUnit.decimals ? ',' + formattedUnit.decimals : ''} DTS.`,
                      '',
                      'Merci de me contacter pour valider ma commande.',
                    ].join('\n');

                    const cardWhatsAppUrl =
                      buildWhatsAppUrl(cardWhatsAppMessage);

                    return (
                      <article
                        key={brand.id}
                        className="group bg-white rounded-xl border border-[#161514]/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        {/* Main Photo Chosen by Admin (Clicking opens specific brand detail) */}
                        <div className="relative aspect-[4/3] w-full bg-[#EFECE6] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedBrandId(brand.id)}
                            className="w-full h-full block text-left cursor-pointer focus:outline-none"
                            aria-label={`Voir les détails de ${brand.title}`}
                          >
                            <ResilientImage
                              src={brand.mainPhoto}
                              alt={brand.title}
                              fallbackLabel={brand.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </button>

                          {/* Subtle Gallery Photo Counter */}
                          <button
                            type="button"
                            onClick={() => setSelectedBrandId(brand.id)}
                            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#161514]/80 backdrop-blur-xs text-[#FAF8F5] px-2.5 py-1 rounded text-[11px] hover:bg-[#161514] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-[#D4B475]" />
                            <span>
                              {photoCount > 1
                                ? `${photoCount} photos · Détails`
                                : 'Voir détails'}
                            </span>
                          </button>

                          {/* Admin Quick Edit Button */}
                          {role === 'admin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBrand(brand);
                                setIsAdminModalOpen(true);
                              }}
                              className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 hover:bg-white text-[#161514] px-2.5 py-1.5 rounded-md text-[11px] font-medium shadow-xs border border-[#161514]/15 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 text-[#9A7432]" />
                              <span>Modifier</span>
                            </button>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                          <div className="space-y-2.5">
                            {/* Clean Unboxed Metadata */}
                            <div className="flex items-center gap-2 text-xs text-[#6E6A64]">
                              <span className="font-medium text-[#9A7432] truncate">
                                {brand.brandName}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{brand.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#161514] whitespace-nowrap">
                                {brand.availability}
                              </span>
                            </div>

                            {/* Clickable Product Title */}
                            <h3 className="font-display text-2xl font-semibold text-[#161514] leading-snug">
                              <button
                                type="button"
                                onClick={() => setSelectedBrandId(brand.id)}
                                className="text-left hover:text-[#9A7432] transition-colors cursor-pointer line-clamp-1"
                              >
                                {brand.title}
                              </button>
                            </h3>

                            {/* Short Homepage Description written by Admin */}
                            <p className="text-sm text-[#5A5650] leading-relaxed line-clamp-3">
                              {brand.shortDescription}
                            </p>
                          </div>

                          <div className="space-y-4">
                            {/* Extraordinary Price Display in DTS */}
                            <PriceDisplay
                              priceDts={brand.priceDts}
                              variant="card"
                            />

                            {/* Action Buttons: Direct Buy via WhatsApp + Add to Cart */}
                            <div className="grid grid-cols-12 gap-2.5">
                              <a
                                href={cardWhatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="col-span-7 inline-flex items-center justify-center gap-1.5 bg-[#161514] hover:bg-[#2C2A28] text-[#FAF8F5] text-xs font-medium px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#D4B475] shrink-0" />
                                <span>Acheter</span>
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleAddToCart(brand, 1)}
                                className={`col-span-5 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                                  isAdded
                                    ? 'bg-[#1F4E3B] border-[#1F4E3B] text-white'
                                    : 'bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#161514] border-[#161514]/15'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    <span>Ajouté</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-3.5 h-3.5 text-[#9A7432] shrink-0" />
                                    <span>Panier</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 3: Craftsmanship, Ordering Experience & Direct WhatsApp Concierge */}
            <section
              id="maisons"
              className="bg-[#161514] text-[#FAF8F5] border-t border-[#161514]"
            >
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-[#D4B475]">
                      <span>02. Conciergerie & Commande Directe</span>
                      <span aria-hidden="true">·</span>
                      <span>Service Client Personnalisé</span>
                    </div>
                    <h2
                      className="font-display text-3xl sm:text-4xl font-normal text-[#FAF8F5] leading-tight"
                      style={{ textWrap: 'balance' }}
                    >
                      Une expérience d’achat simple, directe et sur-mesure.
                    </h2>
                    <p className="text-sm sm:text-base text-[#FAF8F5]/75 leading-relaxed max-w-2xl">
                      Chaque brin présenté sur Tropicanna est sélectionné et
                      documenté par l’administrateur avec ses photographies
                      originales et son prix en Dinars Tunisiens (DTS). Cliquez
                      sur « Acheter » pour ouvrir instantanément une discussion
                      WhatsApp avec notre direction au{' '}
                      <span className="text-[#D4B475] font-mono-tabular">
                        {WHATSAPP_DISPLAY}
                      </span>
                      , ou enregistrez vos articles dans votre panier pour y
                      revenir plus tard.
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                    <a
                      href={generalWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 bg-[#D4B475] hover:bg-[#DFC288] text-[#121110] font-semibold text-xs sm:text-sm px-6 py-4 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>Discuter sur WhatsApp ({WHATSAPP_DISPLAY})</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="inline-flex items-center justify-center gap-2 bg-[#FAF8F5]/10 hover:bg-[#FAF8F5]/15 text-[#FAF8F5] font-medium text-xs sm:text-sm px-6 py-3.5 rounded-lg border border-[#FAF8F5]/15 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#D4B475]" />
                      <span>
                        Consulter mon panier sauvegardé ({totalCartItems})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#FAF8F5] border-t border-[#161514]/10 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6A64]">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-semibold text-[#161514]">
              Tropicanna
            </span>
            <span aria-hidden="true">·</span>
            <span>Maison de Marques & Collection Privée</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#161514] transition-colors"
            >
              WhatsApp : {WHATSAPP_DISPLAY}
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="hover:text-[#161514] transition-colors cursor-pointer"
            >
              Panier ({totalCartItems})
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-[#8B3A3A] hover:underline transition-colors cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>
                Déconnexion ({role === 'admin' ? 'Compte Admin' : 'Compte Client'})
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-Over Persistent Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSelectBrand={(id) => setSelectedBrandId(id)}
      />

      {/* Admin Studio Modal for Creating / Editing Brands & Choosing Main Photo */}
      {role === 'admin' && isAdminModalOpen && (
        <AdminStudioModal
          isOpen={isAdminModalOpen}
          onClose={() => {
            setIsAdminModalOpen(false);
            setEditingBrand(null);
          }}
          initialBrand={editingBrand}
          onSaveBrand={handleSaveBrand}
        />
      )}
    </div>
  );
}
