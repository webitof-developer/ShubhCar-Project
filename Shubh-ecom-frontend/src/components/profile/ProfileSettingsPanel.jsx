"use client";

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export const ProfileSettingsPanel = ({ onDeleteAccount }) => {
  return (
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
            <Button variant="destructive" size="sm" onClick={onDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
