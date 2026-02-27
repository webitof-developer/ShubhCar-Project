import '@/app/globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { VehicleProvider } from '@/context/VehicleContext';
import { Toaster } from '@/components/ui/sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GlobalLoader } from '@/components/layout/GlobalLoader';
import { DynamicFavicon } from '@/components/layout/DynamicFavicon';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { GlobalLoggerInit } from '@/components/layout/GlobalLoggerInit';

// export const metadata = {
//   title: 'Shubh Car Spares',
//   description: 'Your trusted source for automotive spare parts',
// }

export default function RootLayout({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          <SiteConfigProvider>
            <AuthProvider>
              <VehicleProvider>
                <CartProvider>
                  <WishlistProvider>
                    <DynamicFavicon />
                    <GlobalLoader />
                    <GlobalLoggerInit />
                    {children}
                    <Toaster 
                      theme="light" 
                      closeButton 
                      position="bottom-right"
                      offset="80px"
                      toastOptions={{
                        classNames: {
                          toast: "!bg-zinc-100 !border-zinc-300 !shadow-lg !opacity-100",
                          title: "!text-primary !font-medium !text-sm",
                          description: "!text-zinc-600 !text-xs",
                          actionButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90",
                          cancelButton: "!bg-zinc-200 !text-zinc-700 hover:!bg-zinc-300",
                          icon: "!text-primary",
                          closeButton: "!bg-zinc-200 !text-zinc-500 hover:!text-red-600 hover:!bg-zinc-200 !border-0 !shadow-none top-2 right-2",
                        },
                      }} 
                    />
                  </WishlistProvider>
                </CartProvider>
              </VehicleProvider>
            </AuthProvider>
          </SiteConfigProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
