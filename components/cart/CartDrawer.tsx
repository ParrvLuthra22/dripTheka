"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalDeposit, totalFull, totalItems } =
    useCartStore();
  const count = totalItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#141518]/40 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#E4E2DD] flex flex-col border-l border-[#141518]/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#141518]/10">
              <div>
                <h2 className="font-display italic text-xl text-[#141518]">
                  What&apos;s In Your Glass
                </h2>
                {count > 0 && (
                  <p className="font-mono text-xs text-[#141518]/50 mt-0.5">
                    {count} piece{count !== 1 ? "s" : ""} — Pour #001
                  </p>
                )}
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#141518]/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2L14 14M14 2L2 14" stroke="#141518" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <p className="font-display italic text-2xl text-[#141518]/30">Empty glass.</p>
                  <p className="font-mono text-xs text-[#141518]/40 uppercase tracking-widest">
                    Fill it up
                  </p>
                  <Link
                    href="/pour/pour-001"
                    onClick={closeCart}
                    className="mt-4 font-mono text-xs uppercase tracking-widest border border-[#004AAD] text-[#004AAD] px-4 py-2 hover:bg-[#004AAD] hover:text-[#E4E2DD] transition-all duration-200"
                  >
                    See the Pour
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex gap-4 border-b border-[#141518]/10 pb-4"
                  >
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display italic text-[#141518] truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-[#141518]/50">
                          {item.size} · {item.colorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {/* Quantity */}
                        <div className="flex items-center border border-[#141518]/20">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity - 1)
                            }
                            className="w-7 h-7 flex items-center justify-center font-mono text-sm hover:bg-[#141518]/10 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 h-7 flex items-center justify-center font-mono text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity + 1)
                            }
                            className="w-7 h-7 flex items-center justify-center font-mono text-sm hover:bg-[#141518]/10 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.size)}
                          className="font-mono text-xs text-[#141518]/40 hover:text-red-500 transition-colors"
                        >
                          remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-mono text-sm text-[#141518]">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <p className="font-mono text-xs text-[#004AAD] mt-0.5">
                        {formatPrice(item.depositAmount * item.quantity)} now
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-[#141518]/10 space-y-3">
                <div className="flex justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#141518]/50">
                    Full price
                  </span>
                  <span className="font-mono text-sm text-[#141518]">
                    {formatPrice(totalFull())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#004AAD]">
                    Pay now (30%)
                  </span>
                  <span className="font-mono text-sm font-bold text-[#004AAD]">
                    {formatPrice(totalDeposit())}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[#141518]/40 leading-relaxed">
                  70% due when your drop ships. No full payment now.
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center font-mono text-xs uppercase tracking-widest bg-[#004AAD] text-[#E4E2DD] py-4 hover:bg-[#141518] transition-colors duration-200"
                >
                  Pour It Out — {formatPrice(totalDeposit())}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
