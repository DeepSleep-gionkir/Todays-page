"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
// import { useRouter } from "next/navigation"; // Removed as we are merging create page here
import { FcGoogle } from "react-icons/fc";
import { Upload, AlertTriangle, Info } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { useToast } from "@/app/context/ToastContext";
import LoadingOverlay from "@/app/components/game/LoadingOverlay";
// Assuming there is a verifyUser / createCharacter action? We might need to import logic from create page
import { useRouter } from "next/navigation"; // Added router
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore"; // Ensure imports
import { app } from "@/lib/firebase";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1); // Default to 1 (square) or 16/9
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Nickname State
  const [nickname, setNickname] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [tempNickname, setTempNickname] = useState("");

  // Redirect if character already exists for today
  useEffect(() => {
    const checkExistingCharacter = async () => {
      if (!user) return;
      const db = getFirestore(app); // Ensure app is imported or available via context/import
      const dateStr = new Date().toISOString().split("T")[0];
      const charId = `${dateStr}_${user.uid}`;

      try {
        const docRef = doc(db, "users", user.uid, "characters", charId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          router.push(`/character/${charId}`);
        }
      } catch (e) {
        console.error("Check failed", e);
      }
    };

    const checkNickname = async () => {
      if (!user) return;
      const db = getFirestore(app);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().nickname) {
          setNickname(userDocSnap.data().nickname);
        } else {
          setShowNicknameModal(true);
        }
      } catch (e) {
        console.error("Nickname check failed", e);
      }
    };

    if (user && !loading) {
      checkExistingCharacter();
      checkNickname();
    }
  }, [user, loading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate size 5MB
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be smaller than 5MB", "error");
        return;
      }
      setImageFile(file);

      // Create preview URL and detect Aspect Ratio
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        setAspectRatio(img.width / img.height);
        setImagePreview(previewUrl);
      };
    }
  };

  const handleSaveNickname = async () => {
    if (!user || !tempNickname.trim()) return;
    try {
      const db = getFirestore(app);
      await setDoc(
        doc(db, "users", user.uid),
        { nickname: tempNickname },
        { merge: true }
      );
      setNickname(tempNickname);
      setShowNicknameModal(false);
    } catch (e) {
      console.error("Failed to save nickname", e);
      showToast("닉네임 저장 실패", "error");
    }
  };

  const handleCreate = async () => {
    if (!name || !description) {
      showToast("모든 필드를 입력해 주세요.", "error");
      return;
    }
    if (!user) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }

    setIsSubmitting(true);
    setShowLoadingOverlay(true);

    try {
      // Dynamic import to avoid SSR issues if any, and keep main bundle small
      // Parallelize imports for speed
      const [
        { ref, uploadBytes, getDownloadURL },
        { storage },
        { doc, setDoc, getFirestore },
        { generateCharacterDetails, generateDiaryEntry }, // Import here or below? imported below via import()
      ] = await Promise.all([
        import("firebase/storage"),
        import("@/lib/firebase"),
        import("firebase/firestore"),
        import("@/app/actions/generate"),
      ]);

      // PARALLEL EXECUTION: Start Upload and Generation simultaneously
      const uploadPromise = (async () => {
        if (!imageFile) return "";
        const dateStr = new Date().toISOString().split("T")[0];
        const storageRef = ref(
          storage,
          `daily_characters/${dateStr}/${user.uid}_${Date.now()}`
        );
        await uploadBytes(storageRef, imageFile);
        return await getDownloadURL(storageRef);
      })();

      const generationPromise = generateCharacterDetails(name, description);

      // Save Nickname Logic
      const handleSaveNickname = async () => {
        if (!user || !tempNickname.trim()) return;
        try {
          const db = getFirestore(app);
          await setDoc(
            doc(db, "users", user.uid),
            { nickname: tempNickname },
            { merge: true }
          );
          setNickname(tempNickname);
          setShowNicknameModal(false);
        } catch (e) {
          console.error("Failed to save nickname", e);
          showToast("닉네임 저장 실패", "error");
        }
      };

      // Wait for both to complete
      // Also generate simple diary summary simultaneously
      const summaryPromise = generateDiaryEntry("character", {
        name,
        description,
      });

      const [imageUrl, generatedData, shortSummary] = await Promise.all([
        uploadPromise,
        generationPromise,
        summaryPromise,
      ]);

      // All heavy lifting done, now finalizing
      setIsFinalizing(true);

      // 3. Save to Firestore with NEW NESTED STRUCTURE
      const db = getFirestore();
      const dateStr = new Date().toISOString().split("T")[0];
      const charId = `${dateStr}_${user.uid}`;

      const characterData = {
        id: charId,
        uid: user.uid,
        authorName: nickname || user.displayName || "Anonymous",
        name,
        description,
        imageUrl,
        abilities: generatedData.abilities,
        narrative: generatedData.narrative,
        summary: shortSummary, // Save the short diary entry
        date: dateStr,
        createdAt: new Date().toISOString(),
        stats: { wins: 0, losses: 0, battles: 0 },
      };

      // Save to user's personal collection: users/{uid}/characters/{charId}
      await setDoc(
        doc(db, "users", user.uid, "characters", charId),
        characterData
      );

      // Also save to admin records: records/{date}/characters/{charId}
      await setDoc(
        doc(db, "records", dateStr, "characters", charId),
        characterData
      );

      // Success - Wait a bit for the user to see the "filling pages..." message
      setTimeout(() => {
        setIsSubmitting(false);
        // Use window.location for full reload/clean slate or router for SPA nav
        // For now router is fine but I don't have router here.
        // Ah I removed router import. I should bring it back to redirect.
        window.location.href = `/character/${charId}`;
      }, 1500); // Slightly increased delay to ensure user sees the "Filling pages" message
    } catch (error: unknown) {
      console.error("Creation failed", error);
      setIsSubmitting(false);
      setShowLoadingOverlay(false);
      setIsFinalizing(false);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("429")) {
        setErrorMessage(
          "⏳ 이용자가 많아 지연되고 있습니다. 잠시 후 다시 시도해주세요."
        );
        showToast(
          "이용자가 많아 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
          "error"
        );
      } else {
        setErrorMessage("😢 캐릭터 생성에 실패했습니다. 다시 시도해주세요.");
        showToast("캐릭터 생성에 실패했습니다. 다시 시도해주세요.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-accent font-serif animate-pulse">Loading...</div>
      </div>
    );
  }

  // Loading Overlay
  if (showLoadingOverlay) {
    return (
      <div className="fixed inset-0 z-50">
        <LoadingOverlay type="character" isFinalizing={isFinalizing} />
      </div>
    );
  }

  // 4.1 Login View
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] relative animate-in fade-in duration-700">
        {/* Logo Centered */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#D97757] tracking-tighter drop-shadow-sm">
            Today&apos;s Page
          </h1>
        </div>

        {/* Bottom Button */}
        <div className="w-full max-w-sm pb-16 px-4">
          <Button
            onClick={signInWithGoogle}
            variant="secondary"
            fullWidth
            size="lg"
            className="gap-3 shadow-soft border-none py-4 hover:scale-[1.02] transition-transform"
          >
            <FcGoogle size={24} />
            <span className="text-foreground font-medium font-serif">
              Google 계정으로 시작하기
            </span>
          </Button>
        </div>
      </div>
    );
  }

  // 4.2 Home - Creation View
  return (
    <div className="flex flex-col max-w-lg mx-auto py-8 animate-in fade-in duration-500 pb-24">
      {/* Welcome Message */}
      <section className="mb-12 text-center md:text-left pt-8">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-3">
          Good Morning, <br className="md:hidden" />
          <span className="text-[#D97757]">
            {user.displayName?.split(" ")[0]}
          </span>
          .
        </h2>
        <p className="text-sub font-sans text-lg">
          오늘의 이야기, 그 첫 페이지를 넘겨보세요.
        </p>
      </section>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-[#944C4C]/10 border-2 border-[#944C4C] rounded-lg flex items-center gap-3"
          >
            <AlertTriangle className="text-[#944C4C] shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-[#944C4C] font-bold font-serif text-sm">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#944C4C]/60 hover:text-[#944C4C] text-xl font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form (Paper Style) */}
      <div className="space-y-10">
        <div className="space-y-4 relative">
          <label className="block text-sm font-bold text-[#1A1A1A] font-serif absolute -top-6 left-0 flex justify-between w-full">
            <span>Name</span>
            <span className="text-xs text-sub font-sans font-normal opacity-60">
              {name.length} / 20
            </span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="주인공의 이름을 입력하세요"
            maxLength={20}
            className="font-serif text-xl border-b-2 border-t-0 border-x-0 rounded-none px-0 py-2 bg-transparent focus:border-[#D97757] focus:ring-0 placeholder:font-serif placeholder:text-gray-300 placeholder:text-lg"
          />
        </div>

        <div className="space-y-4 relative">
          <label className="block text-sm font-bold text-[#1A1A1A] font-serif absolute -top-6 left-0">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="오늘의 주인공은 어떤 사람인가요? (600자)"
            className="w-full min-h-[300px] bg-[#FaF8F5] border-none rounded-sm focus:outline-none ring-1 ring-transparent focus:ring-[#D97757]/20 font-sans resize-none transition-all placeholder:text-gray-300 text-foreground text-lg"
            maxLength={600}
            style={{
              lineHeight: "2rem",
              padding: "0.5rem 1.5rem",
              backgroundImage:
                "linear-gradient(transparent 1.95rem, #E6E4DD 1.95rem)",
              backgroundSize: "100% 2rem",
              backgroundAttachment: "local",
              backgroundPosition: "0 0.5rem",
            }}
          />
          <div className="text-right text-xs text-gray-400">
            {description.length} / 600
          </div>
        </div>

        {/* Image Upload Placeholder */}
        {/* Image Upload Placeholder */}
        <motion.label
          layout
          htmlFor="image-upload"
          className={`group border-2 border-dashed border-input rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#D97757] hover:text-[#D97757] transition-colors cursor-pointer bg-white/30 hover:bg-[#D97757]/5 overflow-hidden relative`}
          transition={{
            type: "spring",
            damping: 30, // Increased damping to reduce oscillation
            stiffness: 200,
          }}
        >
          <AnimatePresence mode="wait">
            {imagePreview ? (
              <motion.div
                key={imagePreview}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} // Simple fade
                className="relative w-full rounded-lg overflow-hidden shadow-sm border border-black/5"
                style={{ aspectRatio: aspectRatio }} // Enforce aspect ratio immediately
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover block"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-white font-bold font-serif text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    클릭해서 변경하기
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, height: "8rem" }}
                animate={{ opacity: 1, height: "8rem" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <Upload
                  size={28}
                  strokeWidth={1.5}
                  className="group-hover:scale-110 transition-transform mb-2"
                />
                <span className="text-sm font-medium font-sans">
                  이미지 업로드 (Optional)
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </motion.label>

        {/* Warning Box */}
        {/* Warning Box */}
        <div className="bg-[#E6E4DD]/40 border border-[#E6E4DD] p-5 rounded-xl flex gap-4 items-start">
          <Info className="text-sub shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="font-bold text-[#1A1A1A] text-sm">
              콘텐츠 가이드라인
            </h4>
            <p className="text-sm text-sub leading-relaxed font-sans">
              정치적, 선정적, 폭력적인 콘텐츠는 제재될 수 있습니다.
              <br />
              오늘의 페이지는 모두에게 열린 공간입니다.
            </p>
          </div>
        </div>

        {/* Action Button - Ensure it's rendered! */}
        <div className="pt-4 pb-20">
          {" "}
          {/* Extra padding bottom for safe mobile view */}
          <Button
            onClick={handleCreate}
            fullWidth
            size="lg"
            variant="primary"
            disabled={isSubmitting}
            className="shadow-soft py-4 text-lg font-serif animate-in fade-in slide-in-from-bottom-4"
          >
            오늘의 페이지 작성하기
          </Button>
        </div>
      </div>
    </div>
  );
}
