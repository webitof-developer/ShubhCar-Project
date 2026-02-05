"use client";

import { LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const ProfileSidebarNav = ({ activeTab, onTabChange, onLogout, mobile = false }) => {
    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    if (mobile) {
        return (
            <div className="sticky top-[72px] z-30 w-full mb-6 bg-background/80 backdrop-blur-md border-b border-border/50 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-none">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-full py-3 gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-destructive border border-destructive/20 hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </div>
        );
    }

    // Desktop Vertical Navigation
    return (
        <div className="space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                        )}
                        <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors")} />
                        {item.label}
                    </button>
                );
            })}

            <div className="pt-2 mt-2 border-t border-border/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={onLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
};
