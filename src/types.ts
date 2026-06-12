/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolID = 
  | 'script-generator' 
  | 'color-converter' 
  | 'layermask-calculator' 
  | 'asmdef-builder' 
  | 'tmpro-markup' 
  | 'vector-rotation';

export interface ScriptVar {
  id: string;
  name: string;
  type: string;
  access: 'private' | 'public' | 'protected';
  isSerialized: boolean;
  hasTooltip: boolean;
  tooltipText: string;
  hasHeader: boolean;
  headerText: string;
}

export interface ScriptMethod {
  name: string;
  description: string;
  isEnabled: boolean;
  isLifecycle: boolean;
}

export interface LayerItem {
  index: number;
  name: string;
  isActive: boolean;
  isBuiltIn: boolean;
}
