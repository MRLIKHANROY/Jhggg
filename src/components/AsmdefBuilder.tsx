/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clipboard, Check, Download, Layers3, Plus, Trash2 } from 'lucide-react';

const COMMON_PLATFORMS = [
  { id: 'Editor', label: 'Unity Editor' },
  { id: 'Android', label: 'Android' },
  { id: 'iOS', label: 'iOS' },
  { id: 'WebGL', label: 'WebGL' },
  { id: 'macOSStandalone', label: 'macOS' },
  { id: 'WindowsStandalone32', label: 'Windows (32-bit)' },
  { id: 'WindowsStandalone64', label: 'Windows (64-bit)' },
  { id: 'LinuxStandalone64', label: 'Linux (64-bit)' },
  { id: 'Switch', label: 'Nintendo Switch' },
  { id: 'PS4', label: 'PlayStation 4' },
  { id: 'PS5', label: 'PlayStation 5' },
  { id: 'XboxOne', label: 'Xbox One' },
  { id: 'GameCoreXboxSeries', label: 'Xbox Series X|S' }
];

export default function AsmdefBuilder() {
  const [assemName, setAssemName] = useState('MyGame.Features.Combat');
  const [rootNamespace, setRootNamespace] = useState('MyGame.Features.Combat');
  const [allowUnsafe, setAllowUnsafe] = useState(false);
  const [autoReferenced, setAutoReferenced] = useState(true);
  const [noEngineRefs, setNoEngineRefs] = useState(false);
  const [overrideRefs, setOverrideRefs] = useState(false);

  // Lists
  const [references, setReferences] = useState<string[]>(['GUID:6055be8ebefd69e48b49212b09b47b2f', 'MyGame.Core']);
  const [precompiledReferences, setPrecompiledReferences] = useState<string[]>(['Newtonsoft.Json.dll']);
  const [defineConstraints, setDefineConstraints] = useState<string[]>(['UNITY_2022_3_OR_NEWER']);
  
  // Platform filtering mode: 'all' | 'include' | 'exclude'
  const [platformMode, setPlatformMode] = useState<'all' | 'include' | 'exclude'>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Android', 'iOS', 'WebGL']);

  const [newRefInput, setNewRefInput] = useState('');
  const [newDllInput, setNewDllInput] = useState('');
  const [newConstraintInput, setNewConstraintInput] = useState('');

  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync state to JSON text
  useEffect(() => {
    const rawAsmdef: Record<string, any> = {
      name: assemName,
      rootNamespace: rootNamespace.trim() !== '' ? rootNamespace.trim() : undefined,
      references: references.filter(r => r.trim() !== ''),
      includePlatforms: platformMode === 'include' ? selectedPlatforms : [],
      excludePlatforms: platformMode === 'exclude' ? selectedPlatforms : [],
      allowUnsafeCode: allowUnsafe,
      overrideReferences: overrideRefs,
      precompiledReferences: overrideRefs ? precompiledReferences.filter(r => r.trim() !== '') : [],
      autoReferenced: autoReferenced,
      defineConstraints: defineConstraints.filter(c => c.trim() !== ''),
      versionDefines: [],
      noEngineReferences: noEngineRefs
    };

    // Clean up undefined / empty lists to keep the file tidy
    Object.keys(rawAsmdef).forEach(key => {
      if (rawAsmdef[key] === undefined || (Array.isArray(rawAsmdef[key]) && rawAsmdef[key].length === 0)) {
        delete rawAsmdef[key];
      }
    });

    setJsonText(JSON.stringify(rawAsmdef, null, 4));
  }, [
    assemName, rootNamespace, allowUnsafe, autoReferenced, noEngineRefs, 
    overrideRefs, references, precompiledReferences, defineConstraints, 
    platformMode, selectedPlatforms
  ]);

  const addReference = () => {
    if (newRefInput.trim()) {
      setReferences([...references, newRefInput.trim()]);
      setNewRefInput('');
    }
  };

  const removeReference = (idx: number) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const addDll = () => {
    if (newDllInput.trim()) {
      setPrecompiledReferences([...precompiledReferences, newDllInput.trim()]);
      setNewDllInput('');
    }
  };

  const removeDll = (idx: number) => {
    setPrecompiledReferences(precompiledReferences.filter((_, i) => i !== idx));
  };

  const addConstraint = () => {
    if (newConstraintInput.trim()) {
      setDefineConstraints([...defineConstraints, newConstraintInput.trim()]);
      setNewConstraintInput('');
    }
  };

  const removeConstraint = (idx: number) => {
    setDefineConstraints(defineConstraints.filter((_, i) => i !== idx));
  };

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assemName.trim() || 'assembly'}.asmdef`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="asmdef_builder_tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Parameters Editor */}
      <div className="flex flex-col gap-5 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-y-auto max-h-[78vh]">
        <div className="flex items-center gap-2 border-b border-unity-border pb-3">
          <Layers3 className="w-5 h-5 text-unity-accent" />
          <h2 className="text-lg font-semibold text-white font-sans">Asmdef Descriptor</h2>
        </div>

        {/* Basic Names setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Assembly Name</label>
            <input
              id="input_asm_name"
              type="text"
              value={assemName}
              onChange={(e) => setAssemName(e.target.value.replace(/[^a-zA-Z0-9_\.]/g, ''))}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent"
              placeholder="MyGame.Features"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium font-sans">Root Namespace</label>
            <input
              id="input_asm_namespace"
              type="text"
              value={rootNamespace}
              onChange={(e) => setRootNamespace(e.target.value)}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent"
              placeholder="Optional root namespace"
            />
          </div>
        </div>

        {/* Binary triggers checkboxes */}
        <div className="grid grid-cols-2 gap-3 border-t border-neutral-800 pt-3.5">
          <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
            <input
              id="cb_asm_allow_unsafe"
              type="checkbox"
              checked={allowUnsafe}
              onChange={(e) => setAllowUnsafe(e.target.checked)}
              className="rounded border-neutral-700 bg-unity-dark text-unity-accent focus:ring-opacity-0 cursor-pointer"
            />
            <span>Allow Unsafe Code</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
            <input
              id="cb_asm_auto_referenced"
              type="checkbox"
              checked={autoReferenced}
              onChange={(e) => setAutoReferenced(e.target.checked)}
              className="rounded border-neutral-700 bg-unity-dark text-unity-accent focus:ring-opacity-0 cursor-pointer"
            />
            <span>Auto Referenced</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
            <input
              id="cb_asm_no_engine"
              type="checkbox"
              checked={noEngineRefs}
              onChange={(e) => setNoEngineRefs(e.target.checked)}
              className="rounded border-neutral-700 bg-unity-dark text-unity-accent focus:ring-opacity-0 cursor-pointer"
            />
            <span>No Engine References</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
            <input
              id="cb_asm_override_ref"
              type="checkbox"
              checked={overrideRefs}
              onChange={(e) => setOverrideRefs(e.target.checked)}
              className="rounded border-neutral-700 bg-unity-dark text-unity-accent focus:ring-opacity-0 cursor-pointer"
            />
            <span>Override Precompiled Refs</span>
          </label>
        </div>

        {/* References List builder */}
        <div className="flex flex-col gap-2.5 border-t border-neutral-800 pt-3.5">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assembly References</label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-unity-dark/40 border border-neutral-800 rounded min-h-[50px] items-center">
            {references.map((ref, idx) => (
              <span key={idx} className="flex items-center gap-1.5 py-0.5 px-2 bg-neutral-800 text-gray-300 rounded font-mono text-[11px] border border-neutral-700">
                <span>{ref}</span>
                <button id={`btn_asm_del_ref_${idx}`} type="button" onClick={() => removeReference(idx)} className="text-gray-500 hover:text-red-400 font-bold cursor-pointer">×</button>
              </span>
            ))}
            {references.length === 0 && <span className="text-[11px] text-gray-500 italic">No references declared. Self-contained assembly.</span>}
          </div>
          <div className="flex gap-2">
            <input
              id="input_asm_new_ref"
              type="text"
              value={newRefInput}
              onChange={(e) => setNewRefInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') addReference(); }}
              className="flex-1 py-1 px-2.5 bg-unity-dark border border-neutral-700 rounded text-xs text-white"
              placeholder="e.g. Unity.TextMeshPro or MyGame.Core"
            />
            <button
              id="btn_asm_add_ref"
              onClick={addReference}
              className="py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-white cursor-pointer rounded transition-all border border-neutral-700"
            >
              Add Reference
            </button>
          </div>
        </div>

        {/* Conditional Precompiled References (Override Refs is Checked) */}
        {overrideRefs && (
          <div className="flex flex-col gap-2.5 border-l-2 border-unity-accent pl-3.5 mt-1">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Precompiled References (.dll name)</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-unity-dark/40 border border-neutral-800 rounded min-h-[50px] items-center">
              {precompiledReferences.map((ref, idx) => (
                <span key={idx} className="flex items-center gap-1.5 py-0.5 px-2 bg-neutral-800 text-gray-300 rounded font-mono text-[11px] border border-neutral-700">
                  <span>{ref}</span>
                  <button id={`btn_asm_del_dll_${idx}`} type="button" onClick={() => removeDll(idx)} className="text-gray-500 hover:text-red-400 font-bold cursor-pointer">×</button>
                </span>
              ))}
              {precompiledReferences.length === 0 && <span className="text-[11px] text-gray-500 italic">No precompiled DLL references.</span>}
            </div>
            <div className="flex gap-2">
              <input
                id="input_asm_new_dll"
                type="text"
                value={newDllInput}
                onChange={(e) => setNewDllInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') addDll(); }}
                className="flex-1 py-1 px-2.5 bg-unity-dark border border-neutral-700 rounded text-xs text-white placeholder-gray-500"
                placeholder="e.g. Newtonsoft.Json.dll"
              />
              <button
                id="btn_asm_add_dll"
                onClick={addDll}
                className="py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-white cursor-pointer rounded transition-all border border-neutral-700"
              >
                Add DLL
              </button>
            </div>
          </div>
        )}

        {/* Define Constraints list builder */}
        <div className="flex flex-col gap-2.5 border-t border-neutral-800 pt-3.5">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Define Constraints</label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-unity-dark/40 border border-neutral-800 rounded min-h-[50px] items-center">
            {defineConstraints.map((constraint, idx) => (
              <span key={idx} className="flex items-center gap-1.5 py-0.5 px-2 bg-neutral-800 text-gray-300 rounded font-mono text-[11px] border border-neutral-700">
                <span>{constraint}</span>
                <button id={`btn_asm_del_constraint_${idx}`} type="button" onClick={() => removeConstraint(idx)} className="text-gray-500 hover:text-red-400 font-bold cursor-pointer">×</button>
              </span>
            ))}
            {defineConstraints.length === 0 && <span className="text-[11px] text-gray-500 italic">No active preprocessor constraints.</span>}
          </div>
          <div className="flex gap-2">
            <input
              id="input_asm_new_constraint"
              type="text"
              value={newConstraintInput}
              onChange={(e) => setNewConstraintInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') addConstraint(); }}
              className="flex-1 py-1 px-2.5 bg-unity-dark border border-neutral-700 rounded text-xs text-white"
              placeholder="e.g. UNITY_POST_PROCESSING_STACK_V2"
            />
            <button
              id="btn_asm_add_constraint"
              onClick={addConstraint}
              className="py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-white cursor-pointer rounded transition-all border border-neutral-700"
            >
              Add Constraint
            </button>
          </div>
        </div>

        {/* Target Platforms constraints selectors */}
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target Platform Limits</label>
            <select
              id="select_asm_platform_mode"
              value={platformMode}
              onChange={(e) => setPlatformMode(e.target.value as any)}
              className="py-0.5 px-2 bg-unity-light-gray border border-neutral-700 rounded text-xs text-white cursor-pointer focus:outline-none"
            >
              <option value="all">Any Platform</option>
              <option value="include">Only INCLUDE on</option>
              <option value="exclude">EXCLUDE on</option>
            </select>
          </div>

          {platformMode !== 'all' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-unity-dark/40 p-2 border border-neutral-800 rounded max-h-[18vh] overflow-y-auto">
              {COMMON_PLATFORMS.map((platform) => {
                const checked = selectedPlatforms.includes(platform.id);
                return (
                  <label
                    key={platform.id}
                    id={`lbl_asm_platform_${platform.id}`}
                    className={`flex items-center gap-1.5 p-1 rounded text-[10px] select-none cursor-pointer transition-all ${
                      checked ? 'bg-unity-light-gray/60 text-white' : 'text-gray-500'
                    }`}
                  >
                    <input
                      id={`cb_asm_platform_${platform.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlatform(platform.id)}
                      className="rounded border-neutral-700 text-unity-accent bg-neutral-900 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="truncate">{platform.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="flex flex-col bg-unity-dark border border-unity-border rounded-lg shadow-2xl overflow-hidden h-full max-h-[78vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-unity-gray border-b border-unity-border">
          <span className="text-xs font-mono font-medium text-white">{assemName || 'assembly'}.asmdef</span>
          <div className="flex gap-2">
            <button
              id="btn_asm_download"
              onClick={handleDownload}
              className="flex items-center gap-1 py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-gray-200 cursor-pointer rounded transition-all border border-neutral-700"
              title="Download assembly definition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              id="btn_asm_copy_json"
              onClick={handleCopy}
              className="flex items-center gap-1 py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-gray-200 cursor-pointer rounded transition-all border border-neutral-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Raw JSON code block */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-[13px] leading-relaxed select-text text-unity-accent whitespace-pre">
          {jsonText}
        </div>
      </div>
    </div>
  );
}
