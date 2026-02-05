"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2X2, Search, ShoppingCart, User, UserCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      icon: Grid2X2,
      label: 'Categories',
      path: '/categories'
    },
    {
      icon: Search,
      label: 'Search',
      path: '#' // Custom event trigger
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      path: '/cart',
      badge: itemCount
    },
    {
      icon: isAuthenticated ? UserCircle : User,
      label: isAuthenticated ? 'Profile' : 'Login',
      path: isAuthenticated ? '/profile' : '/login'
    },
  ];

  const isActive = (path) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && path !== '#' && pathname.startsWith(path.split('?')[0])) return true;
    return false;
  };

  if (!mounted) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] px-2">
      <div className="h-16 flex items-center justify-between relative max-w-lg mx-auto w-full">

        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const active = isActive(path);

          return (
            <Link
              key={label}
              href={path}
              onClick={(e) => {
                if (label === 'Search') {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('open-mobile-search'));
                }
              }}
              className={cn(
                "relative flex-1 flex items-center justify-center h-full transition-all duration-300 group touch-manipulation tap-highlight-transparent",
              )}
            >
              {/* Active Background Pill */}
              {active && (
                <span className="absolute inset-x-2 inset-y-2 bg-slate-100 rounded-2xl -z-10 animate-in fade-in zoom-in-95 duration-300 ease-out" />
              )}

              <div className="relative flex items-center justify-center pointer-events-none">
                <Icon
                  className={cn(
                    "w-6 h-6 transition-all duration-300 ease-out",
                    active ? "text-slate-900 fill-slate-900/10 stroke-[2.5px] scale-110" : "text-slate-400 stroke-[1.5px] group-hover:text-slate-600 group-active:scale-90"
                  )}
                />

                {/* Notification Badge */}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-0 duration-300">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;