//src/components/profile/AddressSection.jsx

"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, MapPin, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/services/userAddressService';
import { toast } from 'sonner';

export const AddressSection = ({ user }) => {
  const { accessToken } = useAuth(); // PHASE 12: Get auth token
  
  // PHASE 12: State management
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteAddressId, setDeleteAddressId] = useState(null);

  // Form state
  const [formLabel, setFormLabel] = useState('');
  const [formName, setFormName] = useState('');
  const [formLine1, setFormLine1] = useState('');
  const [formLine2, setFormLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  // PHASE 12: Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, [accessToken]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses(accessToken);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[ADDRESS_SECTION] Load failed:', error);
      toast.error('Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormLabel('');
    setFormName('');
    setFormLine1('');
    setFormLine2('');
    setFormCity('');
    setFormState('');
    setFormPincode('');
    setFormPhone('');
    setFormIsDefault(false);
    setEditingAddress(null);
  };

  const openAddModal = () => {
    resetForm();
    setFormIsDefault(addresses.length === 0); // First address is default
    setShowAddressModal(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setFormLabel(address.label || 'Home');
    setFormName(address.fullName || '');
    setFormLine1(address.line1 || '');
    setFormLine2(address.line2 || '');
    setFormCity(address.city || '');
    setFormState(address.state || '');
    setFormPincode(address.postalCode || '');
    setFormPhone(address.phone || '');
    setFormIsDefault(address.isDefaultShipping || false);
    setShowAddressModal(true);
  };

  // PHASE 12: Real save handler
  const handleSave = async () => {
    // Validation
    if (!formLabel.trim() || !formName.trim() || !formLine1.trim() || 
        !formCity.trim() || !formState.trim() || !formPincode.trim() || !formPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const addressData = {
        label: formLabel.trim() || 'Home',
        fullName: formName.trim(),
        line1: formLine1.trim(),
        line2: formLine2.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        postalCode: formPincode.trim(),
        phone: formPhone.trim(),
        isDefaultShipping: formIsDefault,
        isDefaultBilling: formIsDefault,
      };

      if (editingAddress) {
        // Update existing
        const addressId = editingAddress._id || editingAddress.id;
        await updateAddress(addressId, addressData, accessToken);
        toast.success('Address updated successfully');
      } else {
        // Create new
        await addAddress(addressData, accessToken);
        toast.success('Address added successfully');
      }

      setShowAddressModal(false);
      resetForm();
      loadAddresses(); // Refetch
    } catch (error) {
      console.error('[ADDRESS_SECTION] Save failed:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  // PHASE 12: Real delete handler
  const handleDelete = async () => {
    if (!deleteAddressId) return;

    try {
      await deleteAddress(deleteAddressId, accessToken);
      toast.success('Address deleted successfully');
      setDeleteAddressId(null);
      loadAddresses(); // Refetch
    } catch (error) {
      console.error('[ADDRESS_SECTION] Delete failed:', error);
      toast.error('Failed to delete address');
    }
  };

  // PHASE 12: Real set default handler
  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId, accessToken);
      toast.success('Default address updated');
      loadAddresses(); // Refetch
    } catch (error) {
      console.error('[ADDRESS_SECTION] Set default failed:', error);
      toast.error('Failed to set default address');
    }
  };
  
  const canManageAddresses = true; // PHASE 12: Enable address management

  return (
    <>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="bg-secondary/30 px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">My Addresses</h3>
          <Button 
            size="sm" 
            onClick={openAddModal}
            disabled={!canManageAddresses || saving}
            title="Address management will be available after backend integration"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New
          </Button>
        </div>
        <div className="p-5">
          {loading ? (
             <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />       </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No addresses saved yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4" 
                onClick={openAddModal}
                disabled={!canManageAddresses}
                title="Address management will be available after backend integration"
              >
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address._id || address.id}
                  className="p-4 rounded-lg border border-border/50 bg-secondary/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{address.label || 'Home'}</Badge>
                        {address.isDefaultShipping && (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            <Check className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{address.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} - {address.postalCode}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Phone: {address.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditModal(address)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteAddressId(address._id || address.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {!address.isDefaultShipping && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 p-0 h-auto text-primary"
                      onClick={() => handleSetDefault(address._id || address.id)}
                      disabled={!canManageAddresses || saving}
                    >
                      Set as default
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Home, Office, Warehouse..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Recipient name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line1">
                Address Line 1 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="line1"
                value={formLine1}
                onChange={(e) => setFormLine1(e.target.value)}
                placeholder="Street address, building name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2</Label>
              <Input
                id="line2"
                value={formLine2}
                onChange={(e) => setFormLine2(e.target.value)}
                placeholder="Landmark, area (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state"
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">
                  Pincode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pincode"
                  value={formPincode}
                  onChange={(e) => setFormPincode(e.target.value)}
                  placeholder="6-digit pincode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={formIsDefault}
                onCheckedChange={(checked) => setFormIsDefault(checked === true)}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingAddress ? 'Save Changes' : 'Add Address'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
