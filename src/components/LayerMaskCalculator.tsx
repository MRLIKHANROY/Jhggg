/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayerItem } from '../types';
import { Clipboard, Check, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

const INITIAL_LAYERS = [
  { index: 0, name: 'Default', isActive: true, isBuiltIn: true },
  { index: 1, name: 'TransparentFX', isActive: false, isBuiltIn: true },
  { index: 2, name: 'Ignore Raycast', isActive: false, isBuiltIn: true },
  { index: 3, name: 'Builtin Layer 3', isActive: false, isBuiltIn: true },
  { index: 4, name: 'Water', isActive: false, isBuiltIn: true },
  { index: 5, name: 'UI', isActive: false, isBuiltIn: true },
  { index: 6, name: 'Builtin Layer 6', isActive: false, isBuiltIn: true },
  { index: 7, name: 'Builtin Layer 7', isActive: false, isBuiltIn: true },
  { index: 8, name: 'PostProcessing', isActive: true, isBuiltIn: false },
  { index: 9, name: 'Player', isActive: false, isBuiltIn: false },
  { index: 10, name: 'Enemy', isActive: false, isBuiltIn: false },
  { index: 11, name: 'Ground', isActive: true, isBuiltIn: false },
  { index: 12, name: 'Obstacles', isActive: false, isBuiltIn: false },
  { index: 13, name: 'Interactables', isActive: false, isBuiltIn: false },
  { index: 14, name: 'Projectiles', isActive: false, isBuiltIn: false },
  { index: 15, name: 'Npc', isActive: false, isBuiltIn: false }
];

export default function LayerMaskCalculator() {
  // Create state for 32 complete layers
  const [layers, setLayers] = useState<LayerItem[]>(() => {
    const list: LayerItem[] = [];
    for (let i = 0; i < 32; i++) {
      const existing = INITIAL_LAYERS.find(l => l.index === i);
      if (existing) {
        list.push(existing);
      } else {
        list.push({
          index: i,
          name: `User Layer ${i}`,
          isActive: false,
          isBuiltIn: false
        });
      }
    }
    return list;
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleLayer = (index: number) => {
    setLayers(layers.map(l => l.index === index ? { ...l, isActive: !l.isActive } : l));
  };

  const updateLayerName = (index: number, newName: string) => {
    setLayers(layers.map(l => l.index === index ? { ...l, name: newName } : l));
  };

  const clearAllLayers = () => {
    setLayers(layers.map(l => ({ ...l, isActive: false })));
  };

  const selectAllLayers = () => {
    setLayers(layers.map(l => ({ ...l, isActive: true })));
  };

  const invertLayers = () => {
    setLayers(layers.map(l => ({ ...l, isActive: !l.isActive })));
  };

  // Calculate final LayerMask integer
  const maskInt = layers.reduce((acc, layer) => {
    if (layer.isActive) {
      // Use standard bit shift 1 << layer.index. Acc is handled in positive integers.
      return acc + Math.pow(2, layer.index);
    }
    return acc;
  }, 0);

  // Binary Representation (MSB to LSB padding to 32 bits, split every 8 bits for readable groupings)
  const binaryString = layers
    .slice()
    .reverse()
    .map(l => (l.isActive ? '1' : '0'))
    .join('');

  const formattedBinary = binaryString.match(/.{1,8}/g)?.join(' ') || binaryString;

  const handleCopyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Build C# Code expressions
  const activeLayers = layers.filter(l => l.isActive);
  
  let dynamicMaskCode = 'int mask = 0;';
  if (activeLayers.length > 0) {
    if (activeLayers.length <= 4) {
      const parts = activeLayers.map(l => `(1 << ${l.index})`).join(' | ');
      dynamicMaskCode = `int mask = ${parts}; // Decimal: ${maskInt}`;
    } else {
      dynamicMaskCode = `int mask = ${maskInt}; // Bit indices: ` + activeLayers.map(l => l.index).join(', ');
    }
  }

  const nameMaskList = activeLayers.map(l => `"${l.name}"`).join(', ');
  const getMaskCode = `int mask = LayerMask.GetMask(${nameMaskList || '""'});`;

  const raycastExample = `// Dynamic LayerMask application in Unity Raycasting
int mask = ${maskInt}; // ${activeLayers.length} active layers: [${activeLayers.map(l => l.name).slice(0, 3).join(', ')}${activeLayers.length > 3 ? '...' : ''}]

RaycastHit hit;
float maxDistance = 50f;

if (Physics.Raycast(transform.position, transform.forward, out hit, maxDistance, mask))
{
    Debug.Log($"Raycast hit: {hit.collider.name} on Layer: {LayerMask.LayerToName(hit.collider.gameObject.layer)}");
    // Trigger custom game logic
}`;

  const inverseRaycastCode = `// Invert the LayerMask to collide with EVERYTHING EXCEPT the selected layers
int mask = ${maskInt};
int invertedMask = ~mask;

// Raycast ignoring your selected filters
if (Physics.Raycast(transform.position, transform.forward, out float.MaxValue, invertedMask)) 
{
    // Collides with everything except your selected filters
}`;

  return (
    <div id="layermask_tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Layer Checklist (7/12 layout) */}
      <div className="lg:col-span-7 flex flex-col gap-4 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-hidden max-h-[78vh]">
        <div className="flex items-center justify-between border-b border-unity-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-unity-accent" />
            <h2 className="text-lg font-semibold text-white">Layer Index Registrar</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              id="btn_mask_clear"
              onClick={clearAllLayers}
              className="py-1 px-2.5 bg-unity-light-gray hover:bg-neutral-700 transition-all rounded text-gray-300 border border-neutral-700 cursor-pointer text-[11px]"
            >
              Clear
            </button>
            <button
              id="btn_mask_select_all"
              onClick={selectAllLayers}
              className="py-1 px-2.5 bg-unity-light-gray hover:bg-neutral-700 transition-all rounded text-gray-300 border border-neutral-700 cursor-pointer text-[11px]"
            >
              Select All
            </button>
            <button
              id="btn_mask_invert"
              onClick={invertLayers}
              className="py-1 px-2.5 bg-unity-light-gray hover:bg-neutral-700 transition-all rounded text-gray-300 border border-neutral-700 cursor-pointer text-[11px]"
            >
              Invert
            </button>
          </div>
        </div>

        {/* 32 Layer Fields Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[52vh]">
          {layers.map((layer) => (
            <div 
              key={layer.index} 
              className={`flex items-center justify-between p-2 rounded transition-colors border select-none ${
                layer.isActive 
                  ? 'bg-unity-dark/70 border-unity-accent/20 text-white' 
                  : 'bg-neutral-900/30 border-neutral-800 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <input
                  id={`cb_layer_toggle_${layer.index}`}
                  type="checkbox"
                  checked={layer.isActive}
                  onChange={() => toggleLayer(layer.index)}
                  className="rounded border-neutral-700 text-unity-accent bg-neutral-900 focus:ring-0 cursor-pointer h-4 w-4 shrink-0"
                />
                
                {/* Index Indicator */}
                <span className="font-mono text-[11px] text-gray-500 w-5 shrink-0 text-right">
                  {layer.index}
                </span>

                {/* Layer Name Editor */}
                <input
                  id={`input_layer_name_${layer.index}`}
                  type="text"
                  value={layer.name}
                  onChange={(e) => updateLayerName(layer.index, e.target.value)}
                  className="bg-transparent border-none text-xs font-medium focus:outline-none focus:ring-1 focus:ring-unity-border rounded px-1 text-white truncate flex-1 min-w-0"
                  placeholder={`Layer ${layer.index}`}
                />
              </div>

              {/* Mask Bit Value indicator (2^layer.index) */}
              <span className="font-mono text-[10px] text-gray-600 shrink-0 ml-2">
                {layer.isActive ? `+${Math.pow(2, layer.index)}` : `1<<${layer.index}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bit Results & C# Snippet compilation (5/12 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
        
        {/* Integer & Binary Outputs Dashboard */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selected Mask Totals</span>
          
          <div className="grid grid-cols-2 gap-4 border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[10px] text-gray-500 block">DECIMAL INT VALUE</span>
              <span id="label_mask_int_output" className="text-2xl font-mono font-bold text-unity-accent">{maskInt}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">HEXADECIMAL VALUE</span>
              <span id="label_mask_hex_output" className="text-2xl font-mono font-bold text-unity-green">0x{maskInt.toString(16).toUpperCase()}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 block mb-1">BINARY REPRESENTATION (32-BIT)</span>
            <span id="label_mask_binary_output" className="text-[11px] font-mono p-1.5 bg-neutral-950 border border-neutral-800 rounded text-amber-500 block text-center tracking-wider">
              {formattedBinary}
            </span>
            <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono mt-1 px-1">
              <span>Bit 31 (MSB)</span>
              <span>Bit 0 (LSB)</span>
            </div>
          </div>
        </div>

        {/* Dynamic C# Generation blocks */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">C# Bitwise Definition</span>
            <button
              id="btn_copy_bitwise_snippet"
              onClick={() => handleCopyCode('bitwise', dynamicMaskCode)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'bitwise' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'bitwise' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[11px] text-unity-accent overflow-x-auto select-all">
            {dynamicMaskCode}
          </div>
        </div>

        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">LayerMask.GetMask()</span>
            <button
              id="btn_copy_getmask_snippet"
              onClick={() => handleCopyCode('getmask', getMaskCode)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'getmask' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'getmask' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[11px] text-unity-accent overflow-x-auto select-all">
            {getMaskCode}
          </div>
          <span className="text-[9px] text-gray-500 leading-normal">Retrieves the integer value based on name strings defined in Unity project manager.</span>
        </div>

        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">Raycast Code Implementation</span>
            <button
              id="btn_copy_raycast_snippet"
              onClick={() => handleCopyCode('raycast', raycastExample)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'raycast' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'raycast' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[10px] text-gray-300 select-all overflow-x-auto whitespace-pre">
            {raycastExample}
          </pre>
        </div>

        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">Inverse Raycast Example (~Tilde)</span>
            <button
              id="btn_copy_inverse_snippet"
              onClick={() => handleCopyCode('inverse', inverseRaycastCode)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'inverse' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'inverse' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[10px] text-gray-300 select-all overflow-x-auto whitespace-pre">
            {inverseRaycastCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
