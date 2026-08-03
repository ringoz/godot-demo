import { runGodot } from '@ringozz/godot';
import { initDebug } from '@ringozz/godot/debug';
import { Engine } from '@ringozz/godot/Engine';
import { createRoot } from '@ringozz/react-godot';
import { SceneTree } from '@ringozz/godot/SceneTree';
import { MSAA } from '@ringozz/godot/Viewport';
import { createElement } from 'react';
import { App } from './App.tsx';

import.meta.env?.DEV && initDebug();

const tree = Engine.getMainLoop() as SceneTree;
const root = tree.root;
root.msaa3d = MSAA.MSAA_4X;

const { render, unmount } = createRoot(root);
runGodot(undefined, unmount);
await render(createElement(App));
