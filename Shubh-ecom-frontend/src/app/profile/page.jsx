"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileSidebarNav } from '@/components/profile/ProfileSidebarNav';
import { AddressSection } from '@/components/profile/AddressSection';
import { OrdersSection } from '@/components/profile/OrdersSection';
import { WishlistSection } from '@/components/profile/WishlistSection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Clock, ShieldCheck, XCircle, Trash2, Package, Heart, MapPin } from 'lucide-react';
import { getCurrentUser } from '@/services/userService';
import { getMyOrders } from '@/services/orderService';
import { getWishlist } from '@/services/wishlistService';
import { getUserAddresses } from '@/services/userAddressService';
import { toast } from 'sonner';

const Profile = () => {
  const { user: authUser, accessToken, isLoggedIn, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0, addresses: 0 });
  const router = useRouter();

  // UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const profile = await getCurrentUser(accessToken);
        setProfileData(profile);
      } catch (error) {
        console.error('[PROFILE_PAGE] Failed to load profile:', error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;
      try {
        const [orders, wishlist, addresses] = await Promise.all([
          getMyOrders(accessToken).catch(() => []),
          getWishlist(accessToken).catch(() => []),
          getUserAddresses(accessToken).catch(() => []),
        ]);
        setStats({
          orders: Array.isArray(orders) ? orders.length : 0,
          wishlist: Array.isArray(wishlist) ? wishlist.length : 0,
          addresses: Array.isArray(addresses) ? addresses.length : 0,
        });
      } catch (error) {
        console.error('[PROFILE_PAGE] Failed to load stats:', error);
        setStats({ orders: 0, wishlist: 0, addresses: 0 });
      }
    };

    fetchStats();
  }, [accessToken]);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const profile = await getCurrentUser(accessToken);
      setProfileData(profile);
    } catch (error) {
      console.error('[PROFILE_PAGE] Refetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    // Mock delete - UI only for now
    setShowDeleteDialog(false);
    logout();
    router.push('/');
    toast.success('Account deleted successfully');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  // Loading State - Skeleton
  if (loading) {
    return (
      <Layout>
        {/* Header Skeleton */}
        <div className="bg-secondary/30 border-b border-border/50">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Sidebar Skeleton */}
            <div className="hidden lg:block lg:col-span-3 space-y-6">
              <div className="bg-card rounded-xl border border-border/50 p-6 space-y-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-24 w-24 rounded-full mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-4 pt-4 border-t border-border/50">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-9 space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" /> {/* Welcome Banner */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            </div>

          </div>
        </div>
      </Layout>
    );
  }

  // Not Logged In State
  if (!profileData && !loading) {
    return (
      <Layout>
        <div className="bg-secondary/30 border-b border-border/50">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-bold mb-4">My Profile</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
            {!isLoggedIn && (
              <Button onClick={() => router.push('/login')} size="lg">Go to Login</Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // --- TAB CONTENT RENDERERS ---

  const renderOverview = () => (
    <div className="space-y-6 fade-in-animation">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-xl border border-primary/20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {profileData.firstName}!</h2>
        <p className="text-muted-foreground">
          Manage your orders, addresses, and account details from your dashboard.
        </p>
      </div>

      {/* Status Alerts */}
      {profileData?.verificationStatus === 'pending' && (
        <Alert className="bg-warning/10 border-warning/30">
          <Clock className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Account Under Review</AlertTitle>
          <AlertDescription>
            Your wholesale account is pending approval. You can browse and shop at retail prices.
          </AlertDescription>
        </Alert>
      )}

      {profileData?.verificationStatus === 'approved' && profileData?.customerType === 'wholesale' && (
        <Alert className="bg-success/10 border-success/30">
          <ShieldCheck className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Wholesale Approved</AlertTitle>
          <AlertDescription>
            Your wholesale account is approved. You have access to wholesale pricing.
          </AlertDescription>
        </Alert>
      )}

      {profileData?.verificationStatus === 'rejected' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Verification Rejected</AlertTitle>
          <AlertDescription>
            Your wholesale application was not approved. Please contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders Card */}
        <Card
          onClick={() => setActiveTab('orders')}
          className="relative overflow-hidden border-border/50 bg-card hover:bg-secondary/20 transition-all group cursor-pointer shadow-none"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-24 h-24 text-blue-500 transform rotate-12 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Orders
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Package className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime orders placed</p>
          </CardContent>
        </Card>

        {/* Wishlist Card */}
        <Card
          onClick={() => setActiveTab('wishlist')}
          className="relative overflow-hidden border-border/50 bg-card hover:bg-secondary/20 transition-all group cursor-pointer shadow-none"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Heart className="w-24 h-24 text-rose-500 transform rotate-12 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Wishlist Items
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <Heart className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.wishlist}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved for later</p>
          </CardContent>
        </Card>

        {/* Addresses Card */}
        <Card
          onClick={() => setActiveTab('addresses')}
          className="relative overflow-hidden border-border/50 bg-card hover:bg-secondary/20 transition-all group cursor-pointer shadow-none"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <MapPin className="w-24 h-24 text-emerald-500 transform rotate-12 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Saved Addresses
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin className="h-4 w-4" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.addresses}</div>
            <p className="text-xs text-muted-foreground mt-1">Shipping addresses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 fade-in-animation">
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">Account Settings</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <div>
              <p className="font-semibold text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Mobile Navigation (Sticky) */}
        <div className="lg:hidden">
          <div className="mb-6 bg-card rounded-xl border border-border/50 p-4 relative overflow-hidden">
            {/* Verified Badge - Top Right Absolute */}
            {profileData?.customerType === 'wholesale' && (
              <div className="absolute top-3 right-3">
                {profileData.verificationStatus === 'approved' && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 h-5 px-1.5 text-[10px] font-medium gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
                {profileData.verificationStatus === 'pending' && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 h-5 px-1.5 text-[10px] font-medium gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xl font-bold text-primary">
                  {`${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate pr-16 leading-tight">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-xs text-muted-foreground truncate mb-1.5">{profileData.email}</p>

                {/* Mobile Details Row - Flex wrapped */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {profileData.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                      {/* Phone icon isn't imported separately but used in other comps, I'll rely on lucide-react Phone import if present or add it */}
                      <span className="font-medium">{profileData.phone}</span>
                    </div>
                  )}
                  <Badge variant={profileData.customerType === 'wholesale' ? 'default' : 'secondary'} className="h-5 px-2 text-[10px] font-medium">
                    {profileData.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <ProfileSidebarNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={() => setShowLogoutDialog(true)}
            mobile={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Desktop Sidebar (Left Column) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <ProfileCard user={profileData} onProfileUpdate={handleProfileUpdate} />
              <div className="border-t border-border/50 p-3">
                <ProfileSidebarNav
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onLogout={() => setShowLogoutDialog(true)}
                />
              </div>
            </div>

            {/* Quick Stats Mini-Widget (Optional, can be removed if feels cluttered) */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10 p-4">
              <p className="text-xs font-semibold text-primary uppercase mb-2">Member Since</p>
              <p className="text-sm text-foreground">
                {new Date(profileData.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 min-h-[500px]">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'orders' && <OrdersSection user={profileData} />}
            {activeTab === 'wishlist' && <WishlistSection user={profileData} />}
            {activeTab === 'addresses' && <AddressSection user={profileData} />}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data including orders, addresses, and preferences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Yes, Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .fade-in-animation {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
};

export default Profile;
