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
    <Modal isOpen={isOpen} onClose={onClose} title="저장 방식 선택">
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => {
            onDownloadImage();
            onClose();
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent transition-all duration-200",
            "bg-[#D97757]/5 hover:bg-[#D97757]/10 hover:border-[#D97757]/30 hover:scale-[1.02]",
            "group"
          )}
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
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
            "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-transparent transition-all duration-200",
            "bg-[#2C2C2C]/5 hover:bg-[#2C2C2C]/10 hover:border-[#2C2C2C]/30 hover:scale-[1.02]",
            "group"
          )}
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
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
