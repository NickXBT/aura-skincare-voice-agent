"use client";

import React, { useState, useEffect } from "react";
import { X, Key, Mic, Volume2, ShieldCheck, Check, Info } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  onSelectVoice: (voiceName: string) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  availableVoices,
  selectedVoiceName,
  onSelectVoice,
  apiKey,
  onSaveApiKey,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(tempKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B123F]/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F7F3FA] border-b border-[#E8DFED] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2B123F] text-white flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2B123F]">Engine & Voice Settings</h3>
              <p className="text-[11px] text-[#6F6575]">Configure zero-cost fallback or live LLM keys</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6F6575] hover:text-[#2B123F] hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Zero-Cost default banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zero-Cost Mode Active by Default:</span> You do NOT need any paid API key to evaluate this application. The built-in intelligent engine executes tool calling and policy guardrails instantly with 100% reliability.
            </div>
          </div>

          {/* Optional Gemini API Key */}
          <div>
            <label className="block text-xs font-bold text-[#2B123F] mb-1">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to use free zero-cost engine)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] focus:border-[#6D3A91] focus:ring-1 focus:ring-[#6D3A91] outline-hidden text-xs text-[#1A1220] transition font-mono"
            />
            <p className="text-[11px] text-[#6F6575] mt-1">
              If provided, calls Gemini 1.5 Flash with native tool calling. Keys are stored only in your local browser session.
            </p>
          </div>

          {/* Voice selection */}
          <div>
            <label className="block text-xs font-bold text-[#2B123F] mb-1 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#4A2365]" />
              Speech Synthesis Voice
            </label>
            <select
              value={selectedVoiceName}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] focus:border-[#6D3A91] focus:ring-1 focus:ring-[#6D3A91] outline-hidden text-xs text-[#1A1220] bg-white transition"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default Browser Voice</option>
              ) : (
                availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang}) {voice.lang.includes("IN") ? "🇮🇳 [Recommended]" : ""}
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-[#6F6575] mt-1">
              Indian English voices (en-IN) are automatically prioritized for Aria.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#2B123F] hover:bg-[#F7F3FA] rounded-xl border border-[#E8DFED] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2B123F] hover:bg-[#4A2365] rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Saved!
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
