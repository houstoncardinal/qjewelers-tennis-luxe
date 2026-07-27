import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Settings, BarChart2,
  ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { useAdminTheme } from "@/lib/admin-context";
import { triggerHaptic } from "@/lib/haptics";
import { BottomSheet, useBottomSheet } from "./bottom-sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
}

const MAIN_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: ShoppingBag, label: "Orders", to: "/admin/orders" },
  { icon: Package, label: "Products", to: "/admin/products" },
  { icon: Users, label: "Customers", to: "/admin/customers" },
];

const MORE_NAV: NavItem[] = [
  { icon: BarChart2, label: "Analytics", to: "/admin/analytics" },
  { icon: Package, label: "Returns", to: "/admin/returns" },
  { icon: Users, label: "Reviews", to: "/admin/reviews" },
  { icon: ShoppingBag, label: "Promotions", to: "/admin/promotions" },
  { icon: Package, label: "Blog", to: "/admin/blog" },
  { icon: Users, label: "Subscribers", to: "/admin/subscribers" },
  { icon: Settings, label: "Settings", to: "/admin/settings" },
];

export function MobileBottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme } = useAdminTheme();
  const { isOpen, open, close, setIsOpen } = useBottomSheet();

  const isActive = (to: string) => {
    if (to === "/admin") return currentPath === "/admin" || currentPath === "/admin/";
    return currentPath.startsWith(to);
  };

  const handleNavClick = () => {
    triggerHaptic('light');
    close();
  };

  return (
    <>
      {/* Main Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[99997] border-t" style={{ background: 'var(--at-canvas-bg)', borderColor: 'var(--at-card-border)' }}>
        <div className="flex items-center justify-around h-16 safe-area-bottom">
          {MAIN_NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
                onClick={() => triggerHaptic('light')}
                className="flex flex-col items-center justify-center flex-1 h-full relative min-w-0"
                style={{ color: active ? theme.accentColor : 'var(--at-text-muted)' }}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[0.50rem] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[0.50rem] mt-1 font-medium tracking-tight truncate max-w-full">
                  {item.label}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: theme.accentColor }} />
                )}
              </Link>
            );
          })}
          <button
            onClick={() => {
              triggerHaptic('medium');
              open();
            }}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-0"
            style={{ color: 'var(--at-text-muted)' }}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[0.50rem] mt-1 font-medium tracking-tight">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={close} title="More Options">
        <div className="space-y-1">
          {MORE_NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
                onClick={handleNavClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: active ? `${theme.accentColor}15` : 'transparent',
                  color: active ? theme.accentColor : 'var(--at-text-body)',
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accentColor }} />}
              </Link>
            );
          })}
          
          <div className="h-px my-2" style={{ background: 'var(--at-card-border)' }} />
          
          <button
            onClick={() => {
              triggerHaptic('warning');
              // Handle logout
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all text-red-500"
            style={{ background: 'transparent' }}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </BottomSheet>

      {/* Safe area padding for iPhone notch */}
      <style>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}
