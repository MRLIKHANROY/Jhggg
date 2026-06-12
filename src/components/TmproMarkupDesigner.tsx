/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clipboard, Check, Type, AlignCenter, Bold, Italic, Link, Sparkles } from 'lucide-react';

const MARKUP_HELPERS = [
  { label: 'Bold', tagStart: '<b>', tagEnd: '</b>', icon: 'B' },
  { label: 'Italic', tagStart: '<i>', tagEnd: '</i>', icon: 'I' },
  { label: 'Underline', tagStart: '<u>', tagEnd: '</u>', icon: 'U' },
  { label: 'Strikethrough', tagStart: '<s>', tagEnd: '</s>', icon: 'S' }
];

export default function TmproMarkupDesigner() {
  const [rawText, setRawText] = useState(
    `<align=center><size=140%><b><color=#FF5555>CRITICAL HIT!</color></b></size></align>\n\nYou dealt <color=#FFFF55><b>9,999</b></color> holy damage to the <color=#55FF55>Forest Goblin</color>!\n\n<size=80%><color=#888888><i>Pre-order bonus multiplier applied.</i></color></size>`
  );
  
  const [parsedHtml, setParsedHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [insertColor, setInsertColor] = useState('#FF55FF');
  const [insertSize, setInsertSize] = useState('120');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Parse TextMeshPro Markup tags to HTML equivalents
  useEffect(() => {
    setParsedHtml(parseTmpro(rawText));
  }, [rawText]);

  const parseTmpro = (text: string): string => {
    let html = text;

    // Standard HTML escaping to avoid safety/injection issues, while letting tags render
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Helper to un-escape specific tags we want to process
    const restoreTag = (tagPattern: RegExp, replacement: (...args: any[]) => string) => {
      html = html.replace(tagPattern, (...args) => replacement(...args));
    };

    // 1. Noparse block masking (We bypass parsing inside <noparse> blocks)
    // We can simulate noparse simply by extracting them, processing strings, then inserting them back.
    // For this simulation, we'll restore tags selectively:

    // Bold & Italic
    restoreTag(/&lt;b&gt;/gi, () => '<strong>');
    restoreTag(/&lt;\/b&gt;/gi, () => '</strong>');
    restoreTag(/&lt;i&gt;/gi, () => '<em>');
    restoreTag(/&lt;\/i&gt;/gi, () => '</em>');

    // Underline & Strikethrough
    restoreTag(/&lt;u&gt;/gi, () => '<span style="text-decoration: underline;">');
    restoreTag(/&lt;\/u&gt;/gi, () => '</span>');
    restoreTag(/&lt;s&gt;/gi, () => '<span style="text-decoration: line-through;">');
    restoreTag(/&lt;\/s&gt;/gi, () => '</span>');

    // Color tag: <color=#RGB>, <color=#RGBA>, <color=red>
    restoreTag(/&lt;color=(#?[A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?&gt;/gi, (_, hex, alpha) => {
      let colorStyle = hex;
      if (alpha) {
        // Convert alpha byte (e.g. CC) to standard css opacity fraction
        const opacityDec = (parseInt(alpha, 16) / 255).toFixed(2);
        colorStyle = `${hex}; opacity: ${opacityDec}`;
      }
      return `<span style="color: ${colorStyle}">`;
    });
    restoreTag(/&lt;color=(red|green|blue|yellow|cyan|magenta|white|black|orange|purple|grey|gray)&gt;/gi, (_, name) => {
      return `<span style="color: ${name}">`;
    });
    restoreTag(/&lt;\/color&gt;/gi, () => '</span>');

    // Size tag: <size=120%>, <size=24px>, <size=60>
    restoreTag(/&lt;size=(\d+)(%|px)?&gt;/gi, (_, val, unit) => {
      let sizeStyle = '';
      if (unit === '%') {
        sizeStyle = `${val}%`;
      } else if (unit === 'px' || !unit) {
        // Pixel or raw digits (defaults to points/pixels in TMPro relative scale)
        const sizeVal = Math.min(60, Math.max(10, parseInt(val, 10)));
        sizeStyle = `${sizeVal + 4}px`; // map units proportionally
      }
      return `<span style="font-size: ${sizeStyle}">`;
    });
    restoreTag(/&lt;\/size&gt;/gi, () => '</span>');

    // Align tag: <align=center>, <align=left>, <align=right>
    restoreTag(/&lt;align=(left|center|right|justify)&gt;/gi, (_, alignment) => {
      return `<div style="text-align: ${alignment}; width: 100%;">`;
    });
    restoreTag(/&lt;\/align&gt;/gi, () => '</div>');

    // Alpha tag: <alpha=#AA>
    restoreTag(/&lt;alpha=#?([A-Fa-f0-9]{2})&gt;/gi, (_, alphaHex) => {
      const dec = (parseInt(alphaHex, 16) / 255).toFixed(2);
      return `<span style="opacity: ${dec}">`;
    });

    // Translate line breaks safely
    html = html.replace(/\r?\n/g, '<br />');

    return html;
  };

  // Helper function to insert tags at selection coordinates
  const insertTagPair = (startTag: string, endTag: string) => {
    const area = textAreaRef.current;
    if (!area) return;

    const startPos = area.selectionStart;
    const endPos = area.selectionEnd;
    const text = area.value;

    const selected = text.substring(startPos, endPos);
    const replacement = startTag + selected + endTag;

    const updatedText = text.substring(0, startPos) + replacement + text.substring(endPos);
    setRawText(updatedText);

    // Re-focus and set selection back
    setTimeout(() => {
      area.focus();
      area.selectionStart = startPos + startTag.length;
      area.selectionEnd = startPos + startTag.length + selected.length;
    }, 50);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="tmpro_markup_tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Editor & Tag Toolbox Column */}
      <div className="flex flex-col gap-4 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-y-auto max-h-[78vh]">
        <div className="flex items-center gap-2 border-b border-unity-border pb-3">
          <Type className="w-5 h-5 text-unity-accent" />
          <h2 className="text-lg font-semibold text-white">TextMeshPro Constructor</h2>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-unity-dark/50 p-2 border border-neutral-800 rounded">
          {MARKUP_HELPERS.map((helper) => (
            <button
              id={`btn_markup_insert_${helper.label.toLowerCase()}`}
              key={helper.label}
              onClick={() => insertTagPair(helper.tagStart, helper.tagEnd)}
              className="py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-gray-200 cursor-pointer rounded transition-all border border-neutral-700 font-bold"
              title={`Insert ${helper.label} Tags`}
            >
              {helper.icon}
            </button>
          ))}

          <span className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Color insertion utility */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Color:</span>
            <div className="relative w-5 h-5 rounded overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
              <input
                id="input_markup_color_picker"
                type="color"
                value={insertColor}
                onChange={(e) => setInsertColor(e.target.value)}
                className="absolute inset-[-4px] w-[30px] h-[30px] cursor-pointer"
              />
            </div>
            <button
              id="btn_markup_insert_color"
              onClick={() => insertTagPair(`<color=${insertColor}>`, '</color>')}
              className="py-1 px-2 bg-unity-light-gray hover:bg-neutral-700 text-[10px] text-gray-200 cursor-pointer rounded transition-all border border-neutral-700"
            >
              Apply
            </button>
          </div>

          <span className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Size insert utility */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Size:</span>
            <input
              id="input_markup_size_val"
              type="number"
              min="10"
              max="200"
              value={insertSize}
              onChange={(e) => setInsertSize(e.target.value)}
              className="w-11 py-0.5 px-1.5 bg-unity-dark border border-neutral-700 rounded text-xs text-center text-white font-mono"
            />
            <button
              id="btn_markup_insert_size"
              onClick={() => insertTagPair(`<size=${insertSize}%>`, '</size>')}
              className="py-1 px-2 bg-unity-light-gray hover:bg-neutral-700 text-[10px] text-gray-200 cursor-pointer rounded transition-all border border-neutral-700"
            >
              Apply
            </button>
          </div>

          <span className="w-px h-5 bg-neutral-700 mx-1" />

          {/* Align Helpers */}
          <div className="flex gap-1">
            {['left', 'center', 'right'].map((align) => (
              <button
                id={`btn_markup_align_${align}`}
                key={align}
                onClick={() => insertTagPair(`<align=${align}>`, '</align>')}
                className="py-1 px-2 bg-unity-light-gray hover:bg-neutral-700 text-[10px] text-gray-200 cursor-pointer rounded transition-all border border-neutral-700 font-mono"
                title={`Insert align=${align}`}
              >
                {align[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 font-medium">Markup Editor</label>
          <textarea
            id="textarea_markup_input"
            ref={textAreaRef}
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full flex-1 p-3.5 bg-unity-dark border border-neutral-700 rounded-md text-xs text-gray-200 font-mono focus:outline-none focus:border-unity-accent resize-none min-h-[30vh]"
            placeholder="Type your TMPro markup text here..."
          />
        </div>
      </div>

      {/* Visual Game Simulation Box */}
      <div className="flex flex-col gap-4">
        
        {/* Simulating TMPro in context */}
        <div className="flex-1 flex flex-col bg-unity-dark border border-unity-border rounded-lg shadow-2xl overflow-hidden max-h-[50vh]">
          <div className="flex items-center justify-between px-4 py-3 bg-unity-gray border-b border-unity-border font-sans select-none">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>C# TextMeshPro Simulation Canvas</span>
            </div>
          </div>

          {/* Display screen */}
          <div 
            id="markup_simulation_screen"
            className="flex-1 p-6 overflow-auto bg-stone-900 flex items-center justify-center relative min-h-[25vh]"
            style={{
              backgroundImage: 'radial-gradient(#292524 1px, transparent 1.2px)',
              backgroundSize: '16px 16px'
            }}
          >
            {/* Retro C# Dialogue style banner wrapper */}
            <div className="w-full max-w-md p-5 rounded-lg border-2 border-slate-700 bg-slate-950/90 shadow-2xl relative text-sm text-gray-200 font-sans tracking-wide leading-relaxed">
              <div 
                id="markup_rendered_body"
                className="break-words select-text font-sans"
                dangerouslySetInnerHTML={{ __html: parsedHtml || '<span class="text-neutral-600 italic">No text to render...</span>' }} 
              />
              
              {/* Corner RPG arrow */}
              <div className="absolute bottom-2 right-2.5 animate-bounce text-[10px] text-amber-500 font-mono">▼</div>
            </div>
          </div>
        </div>

        {/* Output Text Copy pane */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Raw TMPro String</span>
            <button
              id="btn_markup_copy_output"
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
                  <span>Copy Formatted Text</span>
                </>
              )}
            </button>
          </div>
          <div className="w-full py-2.5 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[11px] text-gray-300 overflow-x-auto select-all line-clamp-2">
            {rawText}
          </div>
        </div>
      </div>
    </div>
  );
}
