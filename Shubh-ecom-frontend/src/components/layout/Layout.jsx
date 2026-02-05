//src/components/layout/Layout.jsx
import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};
