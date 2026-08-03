import { runGodot } from '@ringozz/godot';
import { initDebug } from '@ringozz/godot/debug';
import { Engine } from '@ringozz/godot/Engine';
import { createRoot } from '@ringozz/react-godot';
import { SceneTree } from '@ringozz/godot/SceneTree';
import { MSAA } from '@ringozz/godot/Viewport';
import { createElement } from 'react';
import { App } from './App.tsx';

const tree = Engine.getMainLoop() as SceneTree;
const root = tree.root;

// ── Viewport settings ──
root.msaa3d = MSAA.MSAA_4X;

// ── React render ──
const { render, unmount } = createRoot(root);
const runReact = () => render(createElement(App));
runReact().then(() => runGodot(undefined, unmount));

// ── Dev mode ──
initDebug();
