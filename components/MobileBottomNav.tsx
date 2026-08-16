"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/ancestors", label: "Ancestors", icon: "👥" },
    { href: "/documents", label: "Documents", icon: "📜" },
    { href: "/tree", label: "Tree", icon: "🌳" },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d1117]/92 backdrop-blur-xl border-t border-white/10 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl flex items-center justify-around"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-2xl transition duration-150 ${
              isActive
                ? "bg-[rgba(127,29,45,0.25)] text-[#f4efe7] font-semibold border border-[rgba(127,29,45,0.4)]"
                : "text-[#e1d8cb]/70 hover:text-[#f4efe7]"
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{item.icon}</span>
            <span className="text-[10px] tracking-wide uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
