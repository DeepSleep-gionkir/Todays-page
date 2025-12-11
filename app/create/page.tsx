"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { AlertTriangle, Upload } from "lucide-react";
import LoadingOverlay from "@/app/components/game/LoadingOverlay";
import { useToast } from "@/app/context/ToastContext";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Textarea from "@/app/components/ui/Textarea";

export default function CreateCharacterPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !user) return;

    setIsSubmitting(true);

    try {
      // 1. Upload Image (if exists)
      let imageUrl = "";
      if (imageFile) {
        const { ref, uploadBytes, getDownloadURL } = await import(
          "firebase/storage"
        );
        const { storage } = await import("@/lib/firebase");
        const dateStr = new Date().toISOString().split("T")[0];
        const storageRef = ref(
          storage,
          `daily_characters/${dateStr}/${user.uid}_${Date.now()}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 2. Generate Content via Gemini
      const { generateCharacterDetails } = await import(
        "@/app/actions/generate"
      );
      const generatedData = await generateCharacterDetails(name, description);

      // 3. Save to Firestore
      const { doc, setDoc, getFirestore } = await import("firebase/firestore");
      // Import app to ensure init
      await import("@/lib/firebase");
      const db = getFirestore();

      const dateStr = new Date().toISOString().split("T")[0];
      const charId = `${dateStr}_${user.uid}`;

      const characterData = {
        id: charId,
        uid: user.uid,
        authorName: user.displayName || "Anonymous",
        name,
        description,
        imageUrl,
        abilities: generatedData.abilities,
        narrative: generatedData.narrative,
        date: dateStr,
        createdAt: new Date().toISOString(),
        stats: { wins: 0, losses: 0, battles: 0 }, // Initialize stats
      };

      await setDoc(doc(db, "daily_characters", charId), characterData);

      // Update User Stats (create count)
      // This is optional for now or can be done via increments

      // 4. Redirect
      router.push(`/character/${charId}`);
    } catch (error: unknown) {
      console.error("Creation failed", error);
      setIsSubmitting(false);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("429_TOO_MANY_REQUESTS")) {
        showToast(
          "이용자가 많아 AI가 과부하 상태입니다. 잠시 후 다시 시도해주세요. (429)",
          "error"
        );
      } else {
        showToast("캐릭터 생성에 실패했습니다. 다시 시도해주세요.", "error");
      }
    }
  };

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-8">
      {isSubmitting && <LoadingOverlay type="character" />}

      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-serif text-main">새로운 페르소나 생성</h2>
        <p className="text-sm text-sub">
          오늘 하루, 당신을 대변할 캐릭터를 만들어보세요.
        </p>
      </header>

      {/* Warning Box */}
      <div className="bg-surface p-4 rounded-lg border border-border flex items-start gap-3">
        <AlertTriangle
          className="text-secondary flex-shrink-0 mt-0.5"
          size={20}
        />
        <div className="text-xs text-sub leading-relaxed">
          <strong className="block text-main mb-1 font-serif">주의사항</strong>
          정치적, 선정적, 과도한 폭력성을 포함한 콘텐츠 생성은 엄격히
          금지됩니다. 또한 타인의 권리를 침해하거나 불쾌감을 줄 수 있는 내용은
          제재될 수 있습니다. 따뜻하고 즐거운 커뮤니티를 위해 협조 부탁드립니다.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-main">
            이름
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="캐릭터의 이름을 입력하세요"
            required
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-main"
          >
            설명 (최대 600자)
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="캐릭터의 성격, 외모, 배경 등을 자유롭게 묘사해주세요."
            required
            maxLength={600}
          />
          <div className="text-right text-xs text-sub">
            {description.length} / 600
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-main">
            이미지 업로드
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-surface hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {imageFile ? (
                  <p className="text-sm text-main font-medium">
                    {imageFile.name}
                  </p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-3 text-secondary" />
                    <p className="mb-2 text-sm text-sub">
                      <span className="font-semibold">클릭하여 업로드</span>
                    </p>
                    <p className="text-xs text-sub">PNG, JPG (MAX. 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
          {isSubmitting ? "생성 중..." : "캐릭터 생성하기"}
        </Button>
      </form>
    </div>
  );
}
