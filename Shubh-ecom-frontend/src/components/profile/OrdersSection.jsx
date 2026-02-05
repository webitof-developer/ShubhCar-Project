//src/components/profile/OrdersSection.jsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders } from '@/services/orderService';
import { resolveProductImages } from '@/utils/media';
import { formatPrice } from '@/services/pricingService';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '@/constants/orderStatus';

export const OrdersSection = () => {
  const { accessToken, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isAuthenticated || !accessToken) return;
      try {
        const data = await getMyOrders(accessToken, { includeItems: true });
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[PROFILE_ORDERS] Failed to load orders:', error);
        setOrders([]);
      }
    };
    loadOrders();
  }, [accessToken, isAuthenticated]);

  const recentOrders = orders.slice(0, 3);

  const OrderCard = ({ order }) => {
    const displayItems = (order.items || []).slice(0, 2);
    const remainingCount = (order.items || []).length - 2;

    return (
      <Link
        href="/orders"
        className="block p-4 rounded-lg border border-border/50 bg-secondary/20 hover:border-primary/30 transition-all"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">#{order.orderNumber}</span>
              <Badge variant="outline" className={`text-xs ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                {getOrderStatusLabel(order.orderStatus)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(order.placedAt || order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="flex items-center gap-1">
                {formatPrice(order.grandTotal || 0)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayItems.map((item, index) => (
              <div
                key={item._id}
                className="w-10 h-10 rounded-md bg-secondary overflow-hidden border-2 border-card flex-shrink-0"
                style={{ zIndex: displayItems.length - index }}
              >
                <img
                  src={resolveProductImages(item.product?.images || [])[0]}
                  alt={item.product?.name || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                className="w-10 h-10 rounded-md bg-secondary border-2 border-card flex items-center justify-center flex-shrink-0 text-xs font-medium text-muted-foreground"
                style={{ zIndex: 0 }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="bg-secondary/30 px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">My Orders</h3>
        {orders.length > 0 && (
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
      <div className="p-5">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
            <Link href="/categories">
              <Button variant="outline" size="sm" className="mt-4">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <OrderCard key={order._id || order.orderNumber} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
