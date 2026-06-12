/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clipboard, Check, RefreshCw, Palette, HelpCircle } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Color.white', hex: '#FFFFFF', r: 1, g: 1, b: 1, a: 1 },
  { name: 'Color.black', hex: '#000000', r: 0, g: 0, b: 0, a: 1 },
  { name: 'Color.red', hex: '#FF0000', r: 1, g: 0, b: 0, a: 1 },
  { name: 'Color.green', hex: '#00FF00', r: 0, g: 1, b: 0, a: 1 },
  { name: 'Color.blue', hex: '#0000FF', r: 0, g: 0, b: 1, a: 1 },
  { name: 'Color.cyan', hex: '#00FFFF', r: 0, g: 1, b: 1, a: 1 },
  { name: 'Color.magenta', hex: '#FF00FF', r: 1, g: 0, b: 1, a: 1 },
  { name: 'Color.yellow', hex: '#FFFF00', r: 1, g: 0.92, b: 0.016, a: 1 },
  { name: 'Color.gray', hex: '#808080', r: 0.5, g: 0.5, b: 0.5, a: 1 },
  { name: 'Color.clear', hex: '#00000000', r: 0, g: 0, b: 0, a: 0 }
];

export default function ColorConverter() {
  const [r, setR] = useState(0.42); // 0 to 1
  const [g, setG] = useState(0.12);
  const [b, setB] = useState(0.95);
  const [a, setA] = useState(1.0);

  const [pasteInput, setPasteInput] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState({ error: false, message: '' });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync color picker with numeric states
  const hexValue = rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));

  function rgbToHex(redNum: number, greenNum: number, blueNum: number): string {
    const toHexStr = (c: number) => {
      const hex = Math.min(255, Math.max(0, c)).toString(16).toUpperCase();
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHexStr(redNum)}${toHexStr(greenNum)}${toHexStr(blueNum)}`;
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const rInt = parseInt(hex.substring(1, 3), 16);
    const gInt = parseInt(hex.substring(3, 5), 16);
    const bInt = parseInt(hex.substring(5, 7), 16);

    setR(parseFloat((rInt / 255).toFixed(3)));
    setG(parseFloat((gInt / 255).toFixed(3)));
    setB(parseFloat((bInt / 255).toFixed(3)));
  };

  const loadPreset = (preset: typeof PRESET_COLORS[0]) => {
    setR(preset.r);
    setG(preset.g);
    setB(preset.b);
    setA(preset.a);
  };

  const handlePasteParser = () => {
    if (!pasteInput.trim()) {
      setPasteFeedback({ error: true, message: 'Please paste code string first.' });
      return;
    }

    const clean = pasteInput.trim().replace(/\s+/g, '');
    let matched = false;

    // Detect format: new Color(r,g,b) or new Color(r,g,b,a)
    // Matches e.g. "newColor(0.24f,1f,0.5f,0.85f)"
    const colorRegex = /newColor\(([\d\.]+)f?,([\d\.]+)f?,([\d\.]+)f?(?:,([\d\.]+)f?)?\)/i;
    const colorMatch = clean.match(colorRegex);

    if (colorMatch) {
      const rVal = parseFloat(colorMatch[1]);
      const gVal = parseFloat(colorMatch[2]);
      const bVal = parseFloat(colorMatch[3]);
      const aVal = colorMatch[4] !== undefined ? parseFloat(colorMatch[4]) : 1.0;

      if (!isNaN(rVal) && !isNaN(gVal) && !isNaN(bVal)) {
        setR(Math.min(1.0, Math.max(0.0, rVal)));
        setG(Math.min(1.0, Math.max(0.0, gVal)));
        setB(Math.min(1.0, Math.max(0.0, bVal)));
        setA(Math.min(1.0, Math.max(0.0, aVal)));
        matched = true;
      }
    }

    // Detect format: new Color32(r,g,b,a)
    // Matches e.g. "newColor32(255,128,0,255)"
    if (!matched) {
      const color32Regex = /newColor32\((\d+),(\d+),(\d+),(\d+)\)/i;
      const color32Match = clean.match(color32Regex);
      if (color32Match) {
        const r32 = parseInt(color32Match[1], 10);
        const g32 = parseInt(color32Match[2], 10);
        const b32 = parseInt(color32Match[3], 10);
        const a32 = parseInt(color32Match[4], 10);

        if (!isNaN(r32) && !isNaN(g32) && !isNaN(b32) && !isNaN(a32)) {
          setR(parseFloat((r32 / 255).toFixed(3)));
          setG(parseFloat((g32 / 255).toFixed(3)));
          setB(parseFloat((b32 / 255).toFixed(3)));
          setA(parseFloat((a32 / 255).toFixed(3)));
          matched = true;
        }
      }
    }

    // Detect format: hex code like #FF5500 or FF5500CC
    if (!matched) {
      const hexRegex = /#?([A-F0-9]{6})([A-F0-9]{2})?/i;
      const hexMatch = clean.match(hexRegex);
      if (hexMatch) {
        const hexBody = hexMatch[1];
        const alphaBody = hexMatch[2];

        const rHex = parseInt(hexBody.substring(0, 2), 16);
        const gHex = parseInt(hexBody.substring(2, 4), 16);
        const bHex = parseInt(hexBody.substring(4, 6), 16);

        setR(parseFloat((rHex / 255).toFixed(3)));
        setG(parseFloat((gHex / 255).toFixed(3)));
        setB(parseFloat((bHex / 255).toFixed(3)));

        if (alphaBody) {
          const aHex = parseInt(alphaBody, 16);
          setA(parseFloat((aHex / 255).toFixed(3)));
        } else {
          setA(1.0);
        }
        matched = true;
      }
    }

    if (matched) {
      setPasteFeedback({ error: false, message: 'Successfully parsed and synced!' });
      setPasteInput('');
      setTimeout(() => setPasteFeedback({ error: false, message: '' }), 3000);
    } else {
      setPasteFeedback({
        error: true,
        message: 'Could not parse color format. Try pasting "new Color(0.2f, 0.4f, 0.8f)" or Hex (#FF2412).'
      });
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert decimal safely to single decimal floats
  const formatFloatRepr = (val: number) => {
    if (val === 0) return '0f';
    if (val === 1) return '1f';
    return `${val.toFixed(3).replace(/\.?0+$/, '')}f`;
  };

  const rFloat = formatFloatRepr(r);
  const gFloat = formatFloatRepr(g);
  const bFloat = formatFloatRepr(b);
  const aFloat = formatFloatRepr(a);

  const rByte = Math.round(r * 255);
  const gByte = Math.round(g * 255);
  const bByte = Math.round(b * 255);
  const aByte = Math.round(a * 255);

  const hex8Digit = hexValue + Math.min(255, Math.max(0, aByte)).toString(16).toUpperCase().padStart(2, '0');

  // Outputs list for presentation
  const outputs = [
    {
      id: 'unity-color-rgb',
      label: 'new Color (RGB)',
      code: `new Color(${rFloat}, ${gFloat}, ${bFloat})`,
      desc: 'Standard float format (alpha is defaulted to 1f)'
    },
    {
      id: 'unity-color-rgba',
      label: 'new Color (RGBA)',
      code: `new Color(${rFloat}, ${gFloat}, ${bFloat}, ${aFloat})`,
      desc: 'Normalized float format with alpha channel'
    },
    {
      id: 'unity-color32',
      label: 'new Color32 (RGBA Bytes)',
      code: `new Color32(${rByte}, ${gByte}, ${bByte}, ${aByte})`,
      desc: 'Fast byte representation (0 to 255)'
    },
    {
      id: 'hex-rgb',
      label: 'Hex RGB Code',
      code: hexValue,
      desc: '6-digit hex code specification'
    },
    {
      id: 'hex-rgba',
      label: 'Hex RGBA Code',
      code: hex8Digit,
      desc: '8-digit hex code with alpha byte'
    },
    {
      id: 'tmpro-markup',
      label: 'TextMeshPro Color Tag',
      code: `<color=${hexValue}>`,
      desc: 'Unity TMPro rich text custom color format'
    }
  ];

  return (
    <div id="color_converter_tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Controls: Left Section (7/12 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-y-auto max-h-[78vh]">
        <div className="flex items-center gap-2 border-b border-unity-border pb-3">
          <Palette className="w-5 h-5 text-unity-accent" />
          <h2 className="text-lg font-semibold text-white">Color Formulators</h2>
        </div>

        {/* Dynamic Canvas preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            id="color_preview_canvas"
            className="h-28 rounded-lg relative overflow-hidden flex items-end p-3 border border-unity-border shadow-[inset_0_3px_8px_rgba(0,0,0,0.5)]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 8 8\'%3E%3Crect fill=\'%23111\' width=\'4\' height=\'4\'/%3E%3Crect fill=\'%23222\' x=\'4\' width=\'4\' height=\'4\'/%3E%3Crect fill=\'%23222\' y=\'4\' width=\'4\' height=\'4\'/%3E%3Crect fill=\'%23111\' x=\'4\' y=\'4\' width=\'4\' height=\'4\'/%3E%3C/svg%3E")'
            }}
          >
            <div 
              className="absolute inset-0 transition-colors duration-100"
              style={{ backgroundColor: `rgba(${rByte}, ${gByte}, ${bByte}, ${a})` }}
            />
            {/* Real-time RGB display badge */}
            <span className="relative z-10 px-2 py-0.5 bg-black/70 text-[11px] font-mono rounded text-gray-200 border border-neutral-700/50">
              RGBA({rByte}, {gByte}, {bByte}, {a.toFixed(2)})
            </span>
          </div>

          {/* Quick preset selector */}
          <div className="flex flex-col gap-1.5" id="presets_container">
            <label className="text-xs text-gray-400 font-medium">Standard Unity Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  id={`btn_preset_${preset.name.replace('.', '_')}`}
                  className="flex items-center gap-1.5 p-1 px-2 rounded bg-unity-dark hover:bg-unity-light-gray transition-all text-left text-[11px] border border-neutral-800 text-gray-300 cursor-pointer"
                  onClick={() => loadPreset(preset)}
                >
                  <span 
                    className="w-3 h-3 rounded-sm border border-neutral-700" 
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="truncate font-mono">{preset.name.split('.')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input sliders mapping */}
        <div className="flex flex-col gap-4 border-t border-unity-border pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">R, G, B, A Sliders</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Picker:</span>
              <div className="relative w-6 h-6 rounded overflow-hidden border border-neutral-600">
                <input 
                  id="color_native_picker"
                  type="color" 
                  value={hexValue} 
                  onChange={handleColorPickerChange}
                  className="absolute inset-[-4px] w-[35px] h-[35px] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Red Channel */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-400 font-medium">Red Channel</span>
                <span className="text-gray-400">Float: <b className="text-white">{r.toFixed(3)}</b> &nbsp;|&nbsp; Byte: <b className="text-white">{rByte}</b></span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  id="slider_red"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.005" 
                  value={r} 
                  onChange={(e) => setR(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 rounded-lg bg-neutral-900 border border-neutral-800 accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Green Channel */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-green-400 font-medium">Green Channel</span>
                <span className="text-gray-400">Float: <b className="text-white">{g.toFixed(3)}</b> &nbsp;|&nbsp; Byte: <b className="text-white">{gByte}</b></span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  id="slider_green"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.005" 
                  value={g} 
                  onChange={(e) => setG(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 rounded-lg bg-neutral-900 border border-neutral-800 accent-green-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Blue Channel */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-400 font-medium">Blue Channel</span>
                <span className="text-gray-400">Float: <b className="text-white">{b.toFixed(3)}</b> &nbsp;|&nbsp; Byte: <b className="text-white">{bByte}</b></span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  id="slider_blue"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.005" 
                  value={b} 
                  onChange={(e) => setB(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 rounded-lg bg-neutral-900 border border-neutral-800 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Alpha Channel */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-300 font-medium flex items-center gap-1">
                  <span>Alpha (Opacity)</span>
                </span>
                <span className="text-gray-400">Float: <b className="text-white">{a.toFixed(3)}</b> &nbsp;|&nbsp; Byte: <b className="text-white">{aByte}</b></span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  id="slider_alpha"
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.005" 
                  value={a} 
                  onChange={(e) => setA(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 rounded-lg bg-neutral-900 border border-neutral-800 accent-neutral-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reverse Parser Box */}
        <div className="flex flex-col gap-2.5 border-t border-unity-border pt-4">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-unity-accent" />
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reverse Parser</label>
          </div>
          <span className="text-[11px] text-gray-500 leading-normal">
            Pasted a line of C# from an existing script? Paste it below to automatically load its color values.
          </span>
          <div className="flex gap-2">
            <input 
              id="input_reverse_parse"
              type="text"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              className="flex-1 py-1 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-unity-accent font-mono"
              placeholder="e.g. new Color(0.24f, 0.6f, 0.9f, 1f) or #00FFAA"
              onKeyDown={(e) => { if(e.key === 'Enter') handlePasteParser(); }}
            />
            <button
              id="btn_reverse_parse"
              onClick={handlePasteParser}
              className="flex items-center gap-1 py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-white cursor-pointer rounded transition-all border border-neutral-700 font-medium"
            >
              Parse & Sync
            </button>
          </div>
          {pasteFeedback.message && (
            <span id="label_parse_feedback" className={`text-[11px] font-medium leading-normal ${pasteFeedback.error ? 'text-red-400' : 'text-green-400'}`}>
              {pasteFeedback.message}
            </span>
          )}
        </div>
      </div>

      {/* Code Snippets Panel: Right Section (5/12 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">C# Engine Formats</h3>

        {outputs.map((format) => (
          <div key={format.id} className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 tracking-wide uppercase">{format.label}</span>
              <button
                id={`btn_copy_color_${format.id}`}
                onClick={() => copyToClipboard(format.id, format.code)}
                className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
              >
                {copiedKey === format.id ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs text-unity-accent select-all overflow-x-auto whitespace-nowrap">
              {format.code}
            </div>
            <span className="text-[10px] text-gray-500 leading-normal">{format.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
