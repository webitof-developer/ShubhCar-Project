"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Heart, MapPin, Package, ShieldCheck, XCircle } from 'lucide-react';

export const ProfileOverview = ({ profileData, stats, onTabChange }) => {
  return (
    <div className="space-y-6 fade-in-animation">
      <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-xl border border-primary/20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {profileData.firstName}!</h2>
        <p className="text-muted-foreground">
          Manage your orders, addresses, and account details from your dashboard.
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          onClick={() => onTabChange('orders')}
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

        <Card
          onClick={() => onTabChange('wishlist')}
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

        <Card
          onClick={() => onTabChange('addresses')}
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
};
