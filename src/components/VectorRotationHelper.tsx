/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clipboard, Check, RefreshCw, Compass, RotateCcw } from 'lucide-react';

export default function VectorRotationHelper() {
  const [pitch, setPitch] = useState(25); // X
  const [yaw, setYaw] = useState(-45);  // Y
  const [roll, setRoll] = useState(0);    // Z

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute Quaternion values from Euler angles (angles in degrees)
  // Sequence sequence used: Yaw (Y) -> Pitch (X) -> Roll (Z) which matches standard Unity Quaternion.Euler
  const [quat, setQuat] = useState({ x: 0, y: 0, z: 0, w: 1 });

  useEffect(() => {
    // Convert degrees to radians
    const pRad = (pitch * Math.PI) / 180;
    const yRad = (yaw * Math.PI) / 180;
    const rRad = (roll * Math.PI) / 180;

    // Abbreviations for the various angular functions
    const cX = Math.cos(pRad * 0.5);
    const sX = Math.sin(pRad * 0.5);
    const cY = Math.cos(yRad * 0.5);
    const sY = Math.sin(yRad * 0.5);
    const cZ = Math.cos(rRad * 0.5);
    const sZ = Math.sin(rRad * 0.5);

    // Dynamic rotation combination matching Unity's internal sequence
    const wVal = cY * cX * cZ + sY * sX * sZ;
    const xVal = cY * sX * cZ + sY * cX * sZ;
    const yVal = sY * cX * cZ - cY * sX * sZ;
    const zVal = cY * cX * sZ - sY * sX * cZ;

    setQuat({
      x: parseFloat(xVal.toFixed(4)),
      y: parseFloat(yVal.toFixed(4)),
      z: parseFloat(zVal.toFixed(4)),
      w: parseFloat(wVal.toFixed(4))
    });
  }, [pitch, yaw, roll]);

  const handleReset = () => {
    setPitch(0);
    setYaw(0);
    setRoll(0);
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeEuler = `transform.rotation = Quaternion.Euler(${pitch}f, ${yaw}f, ${roll}f);`;
  const codeQuat = `transform.rotation = new Quaternion(${quat.x}f, ${quat.y}f, ${quat.z}f, ${quat.w}f);`;
  const codeDirectVector = `Vector3 direction = Quaternion.Euler(${pitch}f, ${yaw}f, ${roll}f) * Vector3.forward;`;
  const codeSlerp = `// Slerp rotation interpolation over time
Quaternion targetRotation = Quaternion.Euler(${pitch}f, ${yaw}f, ${roll}f);
transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * 5f);`;

  return (
    <div id="vector_rotation_tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Parameters Panel (7/12 layout) */}
      <div className="lg:col-span-7 flex flex-col gap-6 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-y-auto max-h-[78vh]">
        <div className="flex items-center justify-between border-b border-unity-border pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-unity-accent" />
            <h2 className="text-lg font-semibold text-white">Spatial Orientation Lab</h2>
          </div>
          <button
            id="btn_reset_rotation"
            onClick={handleReset}
            className="flex items-center gap-1.5 py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 transition-all text-xs text-gray-300 border border-neutral-700 rounded cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Dynamic visual 3D Stage Card */}
        <div className="relative h-44 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden">
          {/* Depth / perspective wrapper */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 uppercase text-[9px] tracking-widest font-mono text-gray-600 select-none">
            3D GIMBAL PREVIEWER
          </div>

          <div
            id="gimbal_virtual_3d_stage"
            className="relative w-36 h-36 transition-transform duration-100 ease-out flex items-center justify-center select-none"
            style={{
              perspective: '600px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Standard 3D Object Model (sleek composite card) representing Unity axes */}
            <div
              className="w-20 h-20 bg-neutral-800/80 rounded-md border-2 border-unity-accent flex flex-col items-center justify-center shadow-2xl relative"
              style={{
                transform: `rotateX(${-pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out'
              }}
            >
              <div className="text-[10px] font-bold text-white text-center font-mono">
                UNITY
                <span className="block text-[8px] font-mono text-unity-accent font-normal mt-0.5">TRANSFORM</span>
              </div>

              {/* 3D axis arrows */}
              {/* X Axis Arrow (Red / Right) */}
              <div 
                className="absolute h-1 w-10 bg-red-500 origin-left"
                style={{
                  transform: 'rotateY(90deg) translateZ(10px) translateX(10px)',
                  right: -24
                }}
              >
                <span className="absolute right-[-4px] top-[-3px] text-[7px] text-red-400 font-mono">X</span>
              </div>

              {/* Y Axis Arrow (Green / Up) */}
              <div 
                className="absolute w-1 h-10 bg-green-500 origin-bottom"
                style={{
                  transform: 'rotateX(90deg) translateZ(10px) translateY(-10px)',
                  top: -24
                }}
              >
                <span className="absolute top-[-10px] left-[-2px] text-[7px] text-green-400 font-mono">Y</span>
              </div>

              {/* Z Axis Arrow (Blue / Forward) */}
              <div 
                className="absolute h-10 w-1 bg-blue-500 origin-center"
                style={{
                  transform: 'rotateX(-90deg) translateZ(40px)',
                  bottom: 10
                }}
              >
                <span className="absolute top-[-4px] left-[-2px] text-[7px] text-blue-400 font-mono">Z</span>
              </div>
            </div>
          </div>
        </div>

        {/* Euler Controls section */}
        <div className="flex flex-col gap-4 border-t border-unity-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Euler Angle Sliders (Degrees)</label>
          
          <div className="flex flex-col gap-4">
            {/* Pitch Slide (X Axis) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-400 font-medium">Pitch (X-Axis Rotation)</span>
                <span className="text-white font-bold">{pitch}°</span>
              </div>
              <input
                id="slider_pitch"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full h-1.5 rounded bg-neutral-900 border border-neutral-800 accent-red-500 cursor-pointer"
              />
            </div>

            {/* Yaw Slide (Y Axis) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-green-400 font-medium font-sans">Yaw (Y-Axis Rotation)</span>
                <span className="text-white font-bold">{yaw}°</span>
              </div>
              <input
                id="slider_yaw"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={yaw}
                onChange={(e) => setYaw(parseInt(e.target.value))}
                className="w-full h-1.5 rounded bg-neutral-900 border border-neutral-800 accent-green-500 cursor-pointer"
              />
            </div>

            {/* Roll Slide (Z Axis) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-400 font-medium">Roll (Z-Axis Rotation)</span>
                <span className="text-white font-bold">{roll}°</span>
              </div>
              <input
                id="slider_roll"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={roll}
                onChange={(e) => setRoll(parseInt(e.target.value))}
                className="w-full h-1.5 rounded bg-neutral-900 border border-neutral-800 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Real-time calculated Outputs Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-unity-border pt-4">
          <div>
            <span className="text-[10px] text-gray-500 block">EULER VECTOR</span>
            <span id="label_euler_vector_repr" className="text-sm font-mono font-bold text-unity-accent break-all">
              Vector3({pitch}, {yaw}, {roll})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block">QUATERNION REALTIME (X, Y, Z, W)</span>
            <span id="label_quat_vector_repr" className="text-sm font-mono font-bold text-white break-all">
              Quat({quat.x}, {quat.y}, {quat.z}, {quat.w})
            </span>
          </div>
        </div>
      </div>

      {/* Code Snippets Column (5/12 layout) */}
      <div className="lg:col-span-5 flex flex-col gap-4 max-h-[78vh] overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1 font-sans">C# Rotation SDK Calls</h3>

        {/* Snippet Card: Euler Quaternion Assignment */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase font-sans">Assign Quaternion.Euler</span>
            <button
              id="btn_copy_euler_rotation"
              onClick={() => handleCopy('euler', codeEuler)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'euler' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'euler' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs text-unity-accent overflow-x-auto select-all">
            {codeEuler}
          </div>
          <span className="text-[10px] text-gray-500 leading-normal">
            Converts degree angles directly. Unity performs rotations in Z, X, Y sequential hierarchy order.
          </span>
        </div>

        {/* Snippet Card: Direct Quaternion constructor */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">Direct 4D Constructor</span>
            <button
              id="btn_copy_quat_constructor"
              onClick={() => handleCopy('quat', codeQuat)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'quat' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'quat' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs text-unity-accent overflow-x-auto select-all">
            {codeQuat}
          </div>
          <span className="text-[10px] text-gray-500 leading-normal">
            Bypasses calculation and directly injects constant float vectors. Fast, optimal network representation.
          </span>
        </div>

        {/* Snippet Card: Rotate Vector multiplier */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">Rotate Forward Vector</span>
            <button
              id="btn_copy_rotated_forward"
              onClick={() => handleCopy('vectorProd', codeDirectVector)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'vectorProd' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'vectorProd' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-xs text-unity-accent overflow-x-auto select-all">
            {codeDirectVector}
          </div>
          <span className="text-[10px] text-gray-500 leading-normal">
            Multiplying a Quaternion by a Vector3 rotates that vector in 3D outer space. Yields a new rotated coordinate vector.
          </span>
        </div>

        {/* Snippet Card: Spherical Interpolation */}
        <div className="p-4 bg-unity-dark border border-unity-border rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">Quaternion.Slerp Loop</span>
            <button
              id="btn_copy_slerp_loop"
              onClick={() => handleCopy('slerp', codeSlerp)}
              className="p-1 px-2.5 rounded text-[10px] bg-unity-light-gray hover:bg-neutral-700 border border-neutral-700 cursor-pointer text-gray-300 hover:text-white transition-all flex items-center gap-1 font-mono"
            >
              {copiedKey === 'slerp' ? <Check className="w-3 h-3 text-green-400" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedKey === 'slerp' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="w-full py-2 px-3 bg-neutral-950 rounded border border-neutral-800 font-mono text-[10px] text-gray-300 overflow-x-auto whitespace-pre select-all">
            {codeSlerp}
          </pre>
          <span className="text-[10px] text-gray-500 leading-normal">
            Spherical Linear Interpolation interpolates rotations smoothly without angular speed variation. Perfect for camera tracking loops or unit turn rates.
          </span>
        </div>
      </div>
    </div>
  );
}
