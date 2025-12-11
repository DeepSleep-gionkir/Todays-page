"use client";

import { Image as ImageIcon, FileJson } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { cn } from "@/lib/utils";

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadImage: () => void;
  onDownloadJSON: () => void;
}

export default function DownloadOptionsModal({
  isOpen,
  onClose,
  onDownloadImage,
  onDownloadJSON,
}: DownloadOptionsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="저장 방식 선택"
      className="bg-[#FDFBF7] shadow-xl border-none"
    >
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => {
            onDownloadImage();
            onClose();
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-border/10 transition-all duration-200",
            "bg-white shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-[#D97757]/30",
            "group"
          )}
        >
          <div className="p-3 bg-[#D97757]/10 rounded-full group-hover:bg-[#D97757]/20 transition-colors">
            <ImageIcon size={28} className="text-[#D97757]" />
          </div>
          <div className="text-center">
            <div className="font-serif font-bold text-[#1A1A1A]">이미지</div>
            <div className="text-xs text-sub mt-1">카드 형태로 저장</div>
          </div>
        </button>

        <button
          onClick={() => {
            onDownloadJSON();
            onClose();
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-border/10 transition-all duration-200",
            "bg-white shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-[#2C2C2C]/30",
            "group"
          )}
        >
          <div className="p-3 bg-[#2C2C2C]/5 rounded-full group-hover:bg-[#2C2C2C]/10 transition-colors">
            <FileJson size={28} className="text-[#2C2C2C]" />
          </div>
          <div className="text-center">
            <div className="font-serif font-bold text-[#1A1A1A]">
              텍스트 (JSON)
            </div>
            <div className="text-xs text-sub mt-1">데이터 원본 저장</div>
          </div>
        </button>
      </div>
    </Modal>
  );
}
