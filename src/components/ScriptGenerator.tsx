/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScriptVar, ScriptMethod } from '../types';
import { Clipboard, Check, Plus, Trash2, Code, Settings } from 'lucide-react';

const COMMON_TYPES = [
  'int', 'float', 'string', 'bool', 'Vector3', 'Vector2', 'GameObject', 
  'Transform', 'Rigidbody', 'Collider', 'AudioSource', 'Animator', 'UnityEvent'
];

export default function ScriptGenerator() {
  const [className, setClassName] = useState('GameManager');
  const [namespaceName, setNamespaceName] = useState('MyGame.Core');
  const [templateType, setTemplateType] = useState<'monobehave' | 'scriptable' | 'editor' | 'window' | 'singleton'>('monobehave');
  const [targetClassForEditor, setTargetClassForEditor] = useState('PlayerController');
  const [menuPath, setMenuPath] = useState('Tools/My Game/Game Window');
  const [assetMenuName, setAssetMenuName] = useState('New Game Configuration');
  const [assetFileName, setAssetFileName] = useState('GameConfig');
  
  const [variables, setVariables] = useState<ScriptVar[]>([
    {
      id: 'var1',
      name: 'playerSpeed',
      type: 'float',
      access: 'private',
      isSerialized: true,
      hasTooltip: true,
      tooltipText: 'Movement velocity modifier',
      hasHeader: true,
      headerText: 'Movement Settings'
    },
    {
      id: 'var2',
      name: 'onPlayerKilled',
      type: 'UnityEvent',
      access: 'public',
      isSerialized: false,
      hasTooltip: false,
      tooltipText: '',
      hasHeader: true,
      headerText: 'Events'
    }
  ]);

  const [methods, setMethods] = useState<ScriptMethod[]>([
    { name: 'Awake', description: 'Initialize components and states', isEnabled: true, isLifecycle: true },
    { name: 'Start', description: 'Run initial scene setup', isEnabled: true, isLifecycle: true },
    { name: 'Update', description: 'Frame-rate independent game-loop tick', isEnabled: true, isLifecycle: true },
    { name: 'FixedUpdate', description: 'Physics engine update rate tick', isEnabled: false, isLifecycle: true },
    { name: 'LateUpdate', description: 'Called after all standard frame updates', isEnabled: false, isLifecycle: true },
    { name: 'OnEnable', description: 'Triggered when the component gets active', isEnabled: false, isLifecycle: true },
    { name: 'OnDisable', description: 'Triggered when the component gets inactive', isEnabled: false, isLifecycle: true }
  ]);

  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto compile C# code when state changes
  useEffect(() => {
    setGeneratedCode(generateCsharp());
  }, [className, namespaceName, templateType, targetClassForEditor, menuPath, assetMenuName, assetFileName, variables, methods]);

  const addVariable = () => {
    const newId = `var_${Date.now()}`;
    setVariables([
      ...variables,
      {
        id: newId,
        name: `newVariable${variables.length + 1}`,
        type: 'float',
        access: 'private',
        isSerialized: true,
        hasTooltip: false,
        tooltipText: '',
        hasHeader: false,
        headerText: ''
      }
    ]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, updates: Partial<ScriptVar>) => {
    setVariables(variables.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const toggleMethod = (name: string) => {
    setMethods(methods.map(m => m.name === name ? { ...m, isEnabled: !m.isEnabled } : m));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCsharp = (): string => {
    let code: string[] = [];

    // Namespaces / Header
    code.push('using UnityEngine;');
    
    // Add additional namespaces conditionally based on types used or requested
    const needsEvents = variables.some(v => v.type === 'UnityEvent');
    if (needsEvents) {
      code.push('using UnityEngine.Events;');
    }
    
    if (templateType === 'editor' || templateType === 'window') {
      code.push('using UnityEditor;');
    }
    
    code.push('');

    // Optional custom outer namespace bracket
    const hasNamespace = namespaceName.trim() !== '';
    let indent = '';

    if (hasNamespace) {
      code.push(`namespace ${namespaceName.trim()}`);
      code.push('{');
      indent = '    ';
    }

    // Class header attributes
    if (templateType === 'scriptable') {
      code.push(`${indent}[CreateAssetMenu(fileName = "${assetFileName}", menuName = "Configurations/${assetMenuName}")]`);
    } else if (templateType === 'editor') {
      code.push(`${indent}[CustomEditor(typeof(${targetClassForEditor}))]`);
    }

    // Class Declaration
    let baseClass = 'MonoBehaviour';
    if (templateType === 'scriptable') baseClass = 'ScriptableObject';
    if (templateType === 'editor') baseClass = 'Editor';
    if (templateType === 'window') baseClass = 'EditorWindow';

    code.push(`${indent}public class ${className} : ${baseClass}`);
    code.push(`${indent}{`);

    // Add Singleton instance field
    if (templateType === 'singleton') {
      code.push(`${indent}    private static ${className} _instance;`);
      code.push(`${indent}    public static ${className} Instance`);
      code.push(`${indent}    {`);
      code.push(`${indent}        get`);
      code.push(`${indent}        {`);
      code.push(`${indent}            if (_instance == null)`);
      code.push(`${indent}            {`);
      code.push(`${indent}                _instance = FindFirstObjectByType<${className}>();`);
      code.push(`${indent}                if (_instance == null)`);
      code.push(`${indent}                {`);
      code.push(`${indent}                    GameObject go = new GameObject("${className} [Auto-Generated]");`);
      code.push(`${indent}                    _instance = go.AddComponent<${className}>();`);
      code.push(`${indent}                }`);
      code.push(`${indent}            }`);
      code.push(`${indent}            return _instance;`);
      code.push(`${indent}        }`);
      code.push(`${indent}    }`);
      code.push('');
    }

    // Generate variables
    if (templateType !== 'editor') {
      variables.forEach(v => {
        if (v.hasHeader && v.headerText.trim() !== '') {
          code.push(`${indent}    [Header("${v.headerText.trim()}")]`);
        }
        if (v.hasTooltip && v.tooltipText.trim() !== '') {
          code.push(`${indent}    [Tooltip("${v.tooltipText.trim()}")]`);
        }
        if (v.access === 'private' && v.isSerialized) {
          code.push(`${indent}    [SerializeField]`);
        }
        
        let typeStr = v.type;
        if (typeStr === 'UnityEvent') {
          typeStr = 'UnityEvent';
        }
        
        const visibility = v.access;
        code.push(`${indent}    ${visibility} ${typeStr} ${v.name};`);
        code.push('');
      });
    }

    // Build methods
    if (templateType === 'singleton') {
      // Automatic Awake logic to preserve singleton pattern
      code.push(`${indent}    protected virtual void Awake()`);
      code.push(`${indent}    {`);
      code.push(`${indent}        if (_instance != null && _instance != this)`);
      code.push(`${indent}        {`);
      code.push(`${indent}            Destroy(gameObject);`);
      code.push(`${indent}            return;`);
      code.push(`${indent}        }`);
      code.push(`${indent}        _instance = this;`);
      code.push(`${indent}        DontDestroyOnLoad(gameObject);`);
      code.push(`${indent}    }`);
      code.push('');
    }

    // Standard lifecycle scripts
    if (templateType === 'monobehave' || templateType === 'scriptable' || templateType === 'singleton') {
      methods.forEach(m => {
        // Skip Awake if singleton since it is already generated
        if (templateType === 'singleton' && m.name === 'Awake') return;

        if (m.isEnabled) {
          code.push(`${indent}    private void ${m.name}()`);
          code.push(`${indent}    {`);
          code.push(`${indent}        // TODO: ${m.description}`);
          code.push(`${indent}    }`);
          code.push('');
        }
      });
    }

    // Editor specific code
    if (templateType === 'editor') {
      code.push(`${indent}    public override void OnInspectorGUI()`);
      code.push(`${indent}    {`);
      code.push(`${indent}        // Draw default inspector template`);
      code.push(`${indent}        DrawDefaultInspector();`);
      code.push('');
      code.push(`${indent}        ${targetClassForEditor} myTarget = (${targetClassForEditor})target;`);
      code.push('');
      code.push(`${indent}        EditorGUILayout.Space(10);`);
      code.push(`${indent}        EditorGUILayout.LabelField("Custom Developer Controls", EditorStyles.boldLabel);`);
      code.push('');
      code.push(`${indent}        if (GUILayout.Button("Trigger Custom Controller Action", GUILayout.Height(30)))`);
      code.push(`${indent}        {`);
      code.push(`${indent}            Debug.Log($"Action executed from ${className} editor custom button.");`);
      code.push(`${indent}            // myTarget.SomeMethod();`);
      code.push(`${indent}        }`);
      code.push(`${indent}    }`);
      code.push('');
    }

    // EditorWindow specific code
    if (templateType === 'window') {
      code.push(`${indent}    [MenuItem("${menuPath}")]`);
      code.push(`${indent}    public static void ShowWindow()`);
      code.push(`${indent}    {`);
      code.push(`${indent}        GetWindow<${className}>("${className}");`);
      code.push(`${indent}    }`);
      code.push('');
      code.push(`${indent}    private void OnGUI()`);
      code.push(`${indent}    {`);
      code.push(`${indent}        GUILayout.Label("Custom Configuration Tool Window", EditorStyles.boldLabel);`);
      code.push(`${indent}        EditorGUILayout.Space();`);
      code.push('');
      code.push(`${indent}        if (GUILayout.Button("Execute Action"))`);
      code.push(`${indent}        {`);
      code.push(`${indent}            Debug.Log("Editor Window Task Running!");`);
      code.push(`${indent}        }`);
      code.push(`${indent}    }`);
      code.push('');
    }

    code.push(`${indent}}`);

    if (hasNamespace) {
      code.push('}');
    }

    return code.join('\n');
  };

  return (
    <div id="script_generator_tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Settings Panel */}
      <div className="flex flex-col gap-5 p-5 bg-unity-gray border border-unity-border rounded-lg shadow-xl overflow-y-auto max-h-[78vh]">
        <div className="flex items-center gap-2 border-b border-unity-border pb-3">
          <Settings className="w-5 h-5 text-unity-accent" />
          <h2 className="text-lg font-semibold text-white">Boilerplate Settings</h2>
        </div>

        {/* Script Type Selector */}
        <div className="flex flex-col gap-1.5" id="template_selection_group">
          <label className="text-xs text-gray-400 font-medium">Unity Script Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'monobehave', label: 'MonoBehaviour' },
              { id: 'singleton', label: 'Singleton Mono' },
              { id: 'scriptable', label: 'ScriptableObject' },
              { id: 'editor', label: 'Custom Editor' },
              { id: 'window', label: 'Editor Window' }
            ].map((type) => (
              <button
                key={type.id}
                id={`btn_template_${type.id}`}
                onClick={() => setTemplateType(type.id as any)}
                className={`py-2 px-3 rounded text-xs font-medium cursor-pointer transition-all border text-center ${
                  templateType === type.id
                    ? 'bg-unity-accent/20 border-unity-accent text-unity-accent shadow-[0_0_12px_var(--color-unity-accent-glow)]'
                    : 'bg-unity-light-gray border-neutral-700 text-gray-300 hover:border-neutral-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Class name & Namespace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Class Name</label>
            <input
              id="input_class_name"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-unity-accent transition-all"
              placeholder="GameManager"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Namespace (Optional)</label>
            <input
              id="input_namespace"
              type="text"
              value={namespaceName}
              onChange={(e) => setNamespaceName(e.target.value)}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-unity-accent transition-all"
              placeholder="MyGame.Core"
            />
          </div>
        </div>

        {/* Extra inputs depending on type */}
        {templateType === 'scriptable' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-unity-dark/40 border border-neutral-800 rounded-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Asset Menu Name</label>
              <input
                id="input_asset_menu"
                type="text"
                value={assetMenuName}
                onChange={(e) => setAssetMenuName(e.target.value)}
                className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent transition-all"
                placeholder="Game Config"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium font-mono">Default File Name</label>
              <input
                id="input_asset_file"
                type="text"
                value={assetFileName}
                onChange={(e) => setAssetFileName(e.target.value)}
                className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent transition-all"
                placeholder="GameConfig"
              />
            </div>
          </div>
        )}

        {templateType === 'editor' && (
          <div className="flex flex-col gap-1.5 p-3 bg-unity-dark/40 border border-neutral-800 rounded-md">
            <label className="text-xs text-gray-400 font-medium">Target Inspector MonoBehaviour Class</label>
            <input
              id="input_editor_target"
              type="text"
              value={targetClassForEditor}
              onChange={(e) => setTargetClassForEditor(e.target.value)}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent transition-all"
              placeholder="PlayerController"
            />
          </div>
        )}

        {templateType === 'window' && (
          <div className="flex flex-col gap-1.5 p-3 bg-unity-dark/40 border border-neutral-800 rounded-md">
            <label className="text-xs text-gray-400 font-medium">Editor Window MenuItem Path</label>
            <input
              id="input_editor_menu"
              type="text"
              value={menuPath}
              onChange={(e) => setMenuPath(e.target.value)}
              className="py-1.5 px-3 bg-unity-dark border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-unity-accent transition-all"
              placeholder="Tools/My Game/Game Tool"
            />
          </div>
        )}

        {/* Variables Section (Hidden for Editor scripts as they don't declare regular Mono variables) */}
        {templateType !== 'editor' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-t border-unity-border pt-4 pb-1">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">C# Variables / Fields</label>
              <button
                id="btn_add_variable"
                onClick={addVariable}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-unity-accent hover:bg-opacity-95 text-xs text-white cursor-pointer rounded transition-all font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Variable
              </button>
            </div>

            {variables.length === 0 ? (
              <span className="text-xs text-gray-500 italic py-4 text-center block">No variables declared yet. Add some variables above.</span>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[30vh] overflow-y-auto pr-1">
                {variables.map((variable) => (
                  <div key={variable.id} className="p-3 bg-unity-dark/60 rounded border border-neutral-800 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Name input */}
                      <input
                        id={`input_var_name_${variable.id}`}
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(variable.id, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        className="py-1 px-2 bg-unity-light-gray border border-neutral-700 rounded text-xs text-white placeholder-gray-500 w-32 focus:outline-none"
                        placeholder="varName"
                      />

                      {/* Type Selection */}
                      <select
                        id={`select_var_type_${variable.id}`}
                        value={variable.type}
                        onChange={(e) => updateVariable(variable.id, { type: e.target.value })}
                        className="py-1 px-2 bg-unity-light-gray border border-neutral-700 rounded text-xs text-white cursor-pointer w-28 focus:outline-none"
                      >
                        {COMMON_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      {/* Access Selection */}
                      <select
                        id={`select_var_access_${variable.id}`}
                        value={variable.access}
                        onChange={(e) => updateVariable(variable.id, { access: e.target.value as any })}
                        className="py-1 px-1.5 bg-unity-light-gray border border-neutral-700 rounded text-xs text-white cursor-pointer w-22 focus:outline-none"
                      >
                        <option value="private">private</option>
                        <option value="public">public</option>
                        <option value="protected">protected</option>
                      </select>

                      {/* Serialize Field (Only if private/protected) */}
                      {variable.access !== 'public' && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-300">
                          <input
                            id={`cb_var_serialized_${variable.id}`}
                            type="checkbox"
                            checked={variable.isSerialized}
                            onChange={(e) => updateVariable(variable.id, { isSerialized: e.target.checked })}
                            className="rounded border-neutral-700 bg-unity-dark text-unity-accent focus:ring-opacity-0 cursor-pointer"
                          />
                          [SerializeField]
                        </label>
                      )}

                      {/* Garbage delete button */}
                      <button
                        id={`btn_var_delete_${variable.id}`}
                        onClick={() => removeVariable(variable.id)}
                        className="ml-auto p-1 text-gray-500 hover:text-red-400 cursor-pointer rounded hover:bg-neutral-800 transition-all"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata setup: Header & Tooltips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 border-t border-neutral-800/80 pt-2 text-[11px] text-gray-400">
                      {/* Header Attribute */}
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            id={`cb_var_header_${variable.id}`}
                            type="checkbox"
                            checked={variable.hasHeader}
                            onChange={(e) => updateVariable(variable.id, { hasHeader: e.target.checked })}
                            className="rounded text-unity-accent bg-unity-dark border-neutral-700"
                          />
                          <span>Add Unity [Header] group</span>
                        </label>
                        {variable.hasHeader && (
                          <input
                            id={`input_var_header_text_${variable.id}`}
                            type="text"
                            value={variable.headerText}
                            onChange={(e) => updateVariable(variable.id, { headerText: e.target.value })}
                            className="py-0.5 px-2 bg-unity-dark border border-neutral-700 rounded text-[11px] text-white"
                            placeholder="Group category name"
                          />
                        )}
                      </div>

                      {/* Tooltip Attribute */}
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            id={`cb_var_tooltip_${variable.id}`}
                            type="checkbox"
                            checked={variable.hasTooltip}
                            onChange={(e) => updateVariable(variable.id, { hasTooltip: e.target.checked })}
                            className="rounded text-unity-accent bg-unity-dark border-neutral-700"
                          />
                          <span>Add Unity [Tooltip] explanation</span>
                        </label>
                        {variable.hasTooltip && (
                          <input
                            id={`input_var_tooltip_text_${variable.id}`}
                            type="text"
                            value={variable.tooltipText}
                            onChange={(e) => updateVariable(variable.id, { tooltipText: e.target.value })}
                            className="py-0.5 px-2 bg-unity-dark border border-neutral-700 rounded text-[11px] text-white"
                            placeholder="Hover message content"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Standard Engine Lifecycle Methods selection (No Lifecycle shown for generic windows/editors) */}
        {(templateType === 'monobehave' || templateType === 'singleton') && (
          <div className="flex flex-col gap-2 border-t border-unity-border pt-4">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Standard Lifecycle Functions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {methods.map((m) => (
                <label
                  key={m.name}
                  id={`lbl_method_toggle_${m.name}`}
                  className={`flex items-center gap-2.5 p-2 rounded text-xs select-none cursor-pointer transition-all border ${
                    m.isEnabled
                      ? 'bg-unity-dark/80 border-unity-accent/30 text-white'
                      : 'bg-unity-dark/30 border-transparent text-gray-500'
                  }`}
                >
                  <input
                    id={`cb_method_toggle_${m.name}`}
                    type="checkbox"
                    checked={m.isEnabled}
                    onChange={() => toggleMethod(m.name)}
                    className="rounded border-neutral-700 text-unity-accent focus:ring-0 bg-neutral-900 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-mono font-medium text-[11px]">{m.name}()</span>
                    <span className="text-[10px] text-gray-500 line-clamp-1">{m.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code Previewer Column */}
      <div className="flex flex-col bg-unity-dark border border-unity-border rounded-lg shadow-2xl overflow-hidden h-full max-h-[78vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-unity-gray border-b border-unity-border">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-unity-accent" />
            <span className="text-xs font-mono font-medium text-white">{className}.cs</span>
          </div>
          <button
            id="btn_copy_generated_script"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 py-1 px-3 bg-unity-light-gray hover:bg-neutral-700 text-xs text-gray-200 cursor-pointer rounded transition-all border border-neutral-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                Copy C# Code
              </>
            )}
          </button>
        </div>

        {/* Code Content Display */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-[13px] leading-relaxed select-text text-gray-200 whitespace-pre">
          {generatedCode}
        </div>
      </div>
    </div>
  );
}
