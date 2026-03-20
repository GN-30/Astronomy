import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FileUploader({
  onFileSelect,
  label,
  accept = "image/*",
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      onFileSelect(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const onSelectFile = (e) => {
    handleFileChange(e.target.files[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center gap-2
          ${isDragging ? "border-purple-500 bg-purple-500/10 scale-[1.02]" : "border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"}
          ${file ? "border-green-500/50 bg-green-500/5" : ""}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onSelectFile}
          accept={accept}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center"
            >
              <div className="p-3 bg-slate-700/50 rounded-full mb-2">
                <Upload className="text-slate-400" size={24} />
              </div>
              <p className="text-sm text-slate-300 font-medium">
                Click or drag kundli chart
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, or PDF</p>
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700"
            >
              {preview ? (
                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                  <FileText className="text-purple-400" size={32} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center gap-1 text-[10px] text-green-400 mt-1 font-bold">
                  <CheckCircle size={10} /> Ready to analyze
                </div>
              </div>

              <button
                onClick={removeFile}
                className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                title="Remove file"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
