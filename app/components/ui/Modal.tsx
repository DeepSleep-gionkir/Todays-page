"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className={cn(
          "w-full max-w-md bg-canvas rounded-lg shadow-modal border border-white p-6 relative animate-in zoom-in-95 duration-200",
          "flex flex-col gap-4",
          className
        )}
      >
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-xl font-serif font-bold text-title">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground transition-colors absolute top-4 right-4"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-foreground font-sans leading-relaxed">
          {children}
        </div>

        {footer && <div className="mt-4 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
