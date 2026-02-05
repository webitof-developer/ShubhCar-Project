
//src/components/profile/ProfileCard.jsx

"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, User, Mail, Phone, Building2, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { updateUserProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const ProfileCard = ({ user, onProfileUpdate }) => {
  const router = useRouter();
  const { accessToken, logout } = useAuth(); // PHASE 11: Get accessToken and logout
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [saving, setSaving] = useState(false); // PHASE 11: Track save state


  // Edit form state
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  if (!user) return null;

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  // PHASE 11: Profile edit handler with backend integration
  const handleSaveProfile = async () => {
    console.log('[PROFILE_CARD] Save button clicked');
    console.log('[PROFILE_CARD] Form values:', { editFirstName, editLastName, editPhone });
    console.log('[PROFILE_CARD] Access token present:', !!accessToken);

    // Validation
    if (!editFirstName.trim() || !editLastName.trim()) {
      console.log('[PROFILE_CARD] Validation failed: First/Last name empty');
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editPhone.trim()) {
      console.log('[PROFILE_CARD] Validation failed: Phone empty');
      toast.error('Phone number is required');
      return;
    }

    console.log('[PROFILE_CARD] Validation passed, saving...');
    setSaving(true);
    try {
      const profileData = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
      };

      console.log('[PROFILE_CARD] Calling updateUserProfile with:', profileData);
      const updatedProfile = await updateUserProfile(accessToken, profileData);
      console.log('[PROFILE_CARD] Update response:', updatedProfile);

      if (updatedProfile) {
        toast.success('Profile updated successfully');
        setShowEditDialog(false);
        console.log('[PROFILE_CARD] Triggering parent refetch');
        // Trigger parent refetch
        if (onProfileUpdate) {
          onProfileUpdate();
        } else {
          console.warn('[PROFILE_CARD] onProfileUpdate callback not provided!');
        }
      } else {
        console.error('[PROFILE_CARD] Update returned null/false');
        toast.error('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('[PROFILE_CARD] Save error:', error);
      toast.error('An error occurred while saving your profile');
    } finally {
      setSaving(false);
      console.log('[PROFILE_CARD] Save complete');
    }
  };



  const openEditDialog = () => {
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditPhone(user.phone || '');
    setShowEditDialog(true);
  };

  const getVerificationBadge = () => {
    if (user.customerType !== 'wholesale') return null;

    switch (user.verificationStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="text-center p-6 border-b border-border/50 bg-gradient-to-b from-secondary/20 to-transparent relative">
        <div className="absolute top-4 right-4">
          {getVerificationBadge()}
        </div>
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-3xl font-bold text-primary">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full border border-border cursor-pointer hover:bg-secondary transition-colors" onClick={openEditDialog}>
            <Pencil className="w-3.5 h-3.5 text-foreground/70" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-muted-foreground font-medium mb-3">{user.email}</p>
      </div>

      <div className="p-6 space-y-5">
        {user.phone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Phone</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{user.phone}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Type</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.customerType === 'wholesale' ? 'default' : 'secondary'} className="h-6 px-2.5 text-[11px] font-medium">
              {user.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}
            </Badge>
          </div>
        </div>

        {/* Wholesale Business Info */}
        {user.wholesaleInfo?.businessName && (
          <div className="p-3 mt-2 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Details</span>
              <span className="font-semibold text-foreground">{user.wholesaleInfo.businessName}</span>
              {user.wholesaleInfo.gstOrTaxId && (
                <span className="text-xs text-muted-foreground mt-1">Tax ID: {user.wholesaleInfo.gstOrTaxId}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      < Dialog open={showEditDialog} onOpenChange={setShowEditDialog} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
};
