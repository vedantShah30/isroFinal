"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import Scene3D from "../components/Scene3D";

export default function ImagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      alert("Not Authenticated");
      router.push("/");
    }
  }, [status, router]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleImageSelect = (file, cloudUrl) => {
    if (activeChat) {
      setActiveChat(null);
    } else if (currentImage && cloudUrl !== currentImage) {
      window.location.reload();
      return;
    }
    setSelectedImage(file);
    setImagePreview(cloudUrl);
    setCurrentImage(cloudUrl);
  };
  const handleSubmitImage = async () => {
    if (!imagePreview) {
      alert("Please upload an image first");
      return;
    }
    try { 
      setIsAnalyzing(true);
      const res = await fetch("/api/chats/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imagePreview,
          routineId: null,
          responses: [],
          metadata: {
            uploadedAt: new Date(),
            processingTime: 0,
            imageSize: "1024x1024",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to create chat");
        return;
      }
      const chatId = data.chat._id;
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Error creating chat:", err);
      alert("Failed to create chat");
    } finally {
      setIsAnalyzing(false);
    }
  };
  // Uploads the image to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setIsUploading(false);
    if (!data.success) {
      console.error("Cloudinary upload failed:", data.error);
      return null;
    }
    return data.url;
  };
  const handleFileInput = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }
    // Upload to Cloudinary
    const cloudUrl = await uploadToCloudinary(file);
    if (cloudUrl) {
      handleImageSelect(file, cloudUrl);
    } else {
      alert("Failed to upload image to cloud storage");
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileInput(file);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {(isUploading || isAnalyzing) && <Loader />}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 ">
        <Scene3D />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div className="w-full flex items-center justify-end mb-4 pointer-events-auto">
            <Link href="/dashboard">
              <span
                aria-label="Go to dashboard"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/6 hover:bg-white/10 border border-white/50 flex items-center justify-center text-white backdrop-blur-sm shadow transition p-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
                  />
                </svg>
              </span>
            </Link>
          </div>
          <AnimatePresence mode="wait">
            {!imagePreview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  onChange={(e) => handleFileInput(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`block cursor-pointer rounded-3xl border-[0.5px] border-solid transition-all duration-300 overflow-hidden ${
                    isDragging
                      ? "border-cyan-400 bg-cyan-950/30 scale-105"
                      : "border-cyan-600 bg-gray-900/40 hover:border-cyan-500 hover:bg-cyan-950/20"
                  }`}
                  style={{
                    backdropFilter: "blur(5px)",
                    boxShadow: isDragging
                      ? "0 0 60px rgba(6, 182, 212, 0.3)"
                      : "0 0 40px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <div className="relative py-32 px-8 text-center">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mb-8"
                    >
                      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/30">
                        <svg
                          className="w-16 h-16 text-cyan-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-3">
                      Upload Satellite Imagery
                    </h3>
                    <p className="text-lg text-gray-400 mb-6">
                      Drag and drop your satellite image here, or click to
                      browse
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-cyan-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        PNG, JPG
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-cyan-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Max 10MB
                      </span>
                    </div>
                  </div>
                </label>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                <div
                  className="rounded-3xl overflow-hidden border-2 border-cyan-500/30 bg-gray-900/40 backdrop-blur-xl max-w-[900px] mx-auto"
                  style={{ boxShadow: "0 0 60px rgba(6, 182, 212, 0.2)" }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setImagePreview(null);
                        setSelectedImage(null);
                        setCurrentImage(null);
                      }}
                      className="absolute top-4 right-4 p-3 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all duration-300 backdrop-blur-sm"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <motion.button
                  onClick={handleSubmitImage}
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-8 max-w-[900px] mx-auto block py-6 rounded-2xl font-bold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative group w-full"
                  style={{
                    background: "#06b6d4",
                    boxShadow: "0 10px 40px rgba(6, 182, 212, 0.3)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isAnalyzing ? (
                      <>
                        <svg
                          className="animate-spin h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Analysis Session...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Begin AI Analysis
                      </>
                    )}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
