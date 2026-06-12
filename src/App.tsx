/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToolID } from './types';
import ScriptGenerator from './components/ScriptGenerator';
import ColorConverter from './components/ColorConverter';
import LayerMaskCalculator from './components/LayerMaskCalculator';
import AsmdefBuilder from './components/AsmdefBuilder';
import TmproMarkupDesigner from './components/TmproMarkupDesigner';
import VectorRotationHelper from './components/VectorRotationHelper';

import { 
  Terminal, 
  Palette, 
  Layers, 
  Layers3, 
  Type, 
  Compass, 
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const TOOLS_CONFIG = [
  {
    id: 'script-generator' as ToolID,
    title: 'C# Script Boilerplate',
    desc: 'Generate MonoBehaviours, Singletons, ScriptableObjects & Editors with full field serialization, headers, and tooltips.',
    icon: Terminal,
    component: ScriptGenerator,
    color: 'border-l-blue-500'
  },
  {
    id: 'color-converter' as ToolID,
    title: 'Color Code Converter',
    desc: 'Map colors to C# float ranges, byte-based Color32, hex strings, or TMPro markup codes with reverse parsing.',
    icon: Palette,
    component: ColorConverter,
    color: 'border-l-indigo-500'
  },
  {
    id: 'layermask-calculator' as ToolID,
    title: 'LayerMask bit Calculator',
    desc: 'Calculate precise bitmask integers and 32-bit binary arrays, with dynamic raycast code compilation.',
    icon: Layers,
    component: LayerMaskCalculator,
    color: 'border-l-emerald-500'
  },
  {
    id: 'asmdef-builder' as ToolID,
    title: 'Assembly Definition Builder',
    desc: 'Create and refine structured Unity .asmdef configurations, target limits, precompiled assets, and constraints.',
    icon: Layers3,
    component: AsmdefBuilder,
    color: 'border-l-pink-500'
  },
  {
    id: 'tmpro-markup' as ToolID,
    title: 'TMPro Rich Text Builder',
    desc: 'Format visual text styles using TextMeshPro markup syntax, with real-time parsed rendering simulation.',
    icon: Type,
    component: TmproMarkupDesigner,
    color: 'border-l-amber-500'
  },
  {
    id: 'vector-rotation' as ToolID,
    title: 'Quaternion & Rotation Lab',
    desc: 'Resolve 3D Euler angles into 4D Quaternions with real-time vector product calculations and 3D visual preview.',
    icon: Compass,
    component: VectorRotationHelper,
    color: 'border-l-red-500'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ToolID>('script-generator');

  const currentTool = TOOLS_CONFIG.find((t) => t.id === activeTab) || TOOLS_CONFIG[0];
  const ActiveComponent = currentTool.component;

  return (
    <div className="min-h-screen bg-stone-950 text-gray-200 flex flex-col font-sans">
      
      {/* Header Panel */}
      <header id="app_header" className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 px-4 py-3 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#2196f3]/10 border border-[#2196f3]/50 flex items-center justify-center shadow-[0_0_12px_rgba(33,150,243,0.15)] shrink-0">
              {/* Retro abstract geometric cube emblem representing Unity */}
              <div className="w-4 h-4 border-2 border-unity-accent rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-unity-accent rounded-full" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 id="app_title" className="text-sm font-bold tracking-tight text-white uppercase sm:text-base font-sans">
                Unity Developer Tools
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">
                Sleek, high-productivity offline utilities for client-side gameplay development
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <span className="text-[10px] text-gray-500 font-mono tracking-wider bg-neutral-950 p-1 px-2 border border-neutral-800 rounded">
              UNITY VERSION PRESETS: 2022.3LTS - 6.0LTS
            </span>
            <a
              id="anchor_unity_manual_link"
              href="https://docs.unity3d.com/Manual/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] py-1 px-2 bg-neutral-800 hover:bg-neutral-700 font-mono border border-neutral-700 hover:text-white transition-all rounded flex items-center gap-1 shrink-0"
            >
              <span>Manual</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Modular Navigation List (Hidden or layout-shifted on smaller viewports) */}
        <nav id="sidebar_nav" className="w-full lg:w-80 shrink-0 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-400 tracking-widest px-2 uppercase mb-1">
            Component Modules
          </span>

          <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2 lg:flex lg:flex-col">
            {TOOLS_CONFIG.map((tool) => {
              const IconComp = tool.icon;
              const isActive = activeTab === tool.id;

              return (
                <button
                  id={`btn_tab_link_${tool.id}`}
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex gap-3 items-start ${
                    isActive
                      ? `bg-neutral-900 ${tool.color} border-l-4 border-r-neutral-800 border-t-neutral-800 border-b-neutral-800 text-white shadow-lg`
                      : 'bg-neutral-900/40 hover:bg-neutral-900/80 border-neutral-900 text-gray-400'
                  }`}
                >
                  <IconComp className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-unity-accent' : 'text-gray-500'}`} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold tracking-wide truncate">{tool.title}</span>
                    <span className="text-[10px] leading-relaxed text-gray-500 line-clamp-2">
                      {tool.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Side: Active Workspace Stage */}
        <section id="active_workspace_canvas" className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 sm:p-5 flex flex-col gap-1.5 shadow-md">
            <h2 id="current_tool_title" className="text-base font-semibold text-white tracking-wide">
              {currentTool.title}
            </h2>
            <p id="current_tool_desc" className="text-xs text-gray-400 leading-relaxed font-sans">
              {currentTool.desc}
            </p>
          </div>

          <div className="flex-1 min-h-[50vh]">
            <ActiveComponent />
          </div>
        </section>
      </main>

      {/* Footer Branding Area */}
      <footer id="app_footer" className="mt-auto py-5 bg-neutral-950 border-t border-neutral-900 text-center text-[11px] text-gray-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Unity Developer Tools Suite. Build and export C# logic directly out to your assets catalog.
          </span>
          <span className="font-mono text-[10px]">
            Created via Google AI Studio • Offline Sandbox Persisted
          </span>
        </div>
      </footer>
    </div>
  );
}
