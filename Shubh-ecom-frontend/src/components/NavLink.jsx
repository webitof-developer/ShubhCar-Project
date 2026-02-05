//src/components/NavLink.jsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItem({ href, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? "text-primary" : "text-muted"}
    >
      {children}
    </Link>
  );
}
