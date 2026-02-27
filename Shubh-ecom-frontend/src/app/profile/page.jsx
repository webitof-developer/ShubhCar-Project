"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileSidebarNav } from '@/components/profile/ProfileSidebarNav';
import { AddressSection } from '@/components/profile/AddressSection';
import { OrdersSection } from '@/components/profile/OrdersSection';
import { WishlistSection } from '@/components/profile/WishlistSection';
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { ProfileSettingsPanel } from '@/components/profile/ProfileSettingsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Clock, ShieldCheck } from 'lucide-react';
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
        <ProfilePageSkeleton />
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
            {activeTab === 'overview' && (
              <ProfileOverview
                profileData={profileData}
                stats={stats}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === 'orders' && <OrdersSection user={profileData} />}
            {activeTab === 'wishlist' && <WishlistSection user={profileData} />}
            {activeTab === 'addresses' && <AddressSection user={profileData} />}
            {activeTab === 'settings' && (
              <ProfileSettingsPanel onDeleteAccount={() => setShowDeleteDialog(true)} />
            )}
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
