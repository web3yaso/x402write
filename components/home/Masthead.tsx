"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletConnect } from "@/components/shared/WalletConnect";

export function Masthead() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <header className="mast">
      <div className="mast-row" ref={wrapRef}>
        <Link href="/" className="brand"><span className="mark"></span>x402write</Link>
        <div className="mast-right">
          <WalletConnect />
          <button
            className={`menu-btn${open ? " open" : ""}`}
            aria-label="菜单"
            aria-expanded={open}
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          >
            <span className="bars"></span>
          </button>
        </div>
        <nav className={`menu-panel${open ? " open" : ""}`} aria-label="站点导航">
          <div className="menu-eyebrow">x402write</div>
          <Link href="/publish"><span className="mtxt"><span className="mt">发布报告</span><span className="msub">签名上链你的文章</span></span><span className="ar">→</span></Link>
          <Link href="/reports"><span className="mtxt"><span className="mt">报告目录</span><span className="msub">链上可验证内容库</span></span><span className="ar">→</span></Link>
        </nav>
      </div>
    </header>
  );
}
