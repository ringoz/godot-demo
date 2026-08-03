import { Color, Key, MouseButton, Vector3 } from '@ringozz/godot';
import { BoxMesh } from '@ringozz/godot/BoxMesh';
import { BoxShape3D } from '@ringozz/godot/BoxShape3D';
import { Camera3D } from '@ringozz/godot/Camera3D';
import { CapsuleMesh } from '@ringozz/godot/CapsuleMesh';
import { CapsuleShape3D } from '@ringozz/godot/CapsuleShape3D';
import { CollisionShape3D } from '@ringozz/godot/CollisionShape3D';
import { CylinderMesh } from '@ringozz/godot/CylinderMesh';
import { CylinderShape3D } from '@ringozz/godot/CylinderShape3D';
import { DirectionalLight3D } from '@ringozz/godot/DirectionalLight3D';
import { Engine } from '@ringozz/godot/Engine';
import { BGMode, Environment, ToneMapper } from '@ringozz/godot/Environment';
import { InputEventKey } from '@ringozz/godot/InputEventKey';
import { InputEventMouseButton } from '@ringozz/godot/InputEventMouseButton';
import { InputEventMouseMotion } from '@ringozz/godot/InputEventMouseMotion';
import { Label } from '@ringozz/godot/Label';
import { Label3D } from '@ringozz/godot/Label3D';
import { MeshInstance3D } from '@ringozz/godot/MeshInstance3D';
import { PhysicsMaterial } from '@ringozz/godot/PhysicsMaterial';
import { RigidBody3D } from '@ringozz/godot/RigidBody3D';
import { SceneTree } from '@ringozz/godot/SceneTree';
import { SphereMesh } from '@ringozz/godot/SphereMesh';
import { SphereShape3D } from '@ringozz/godot/SphereShape3D';
import { StandardMaterial3D } from '@ringozz/godot/StandardMaterial3D';
import { StaticBody3D } from '@ringozz/godot/StaticBody3D';
import { WorldEnvironment } from '@ringozz/godot/WorldEnvironment';
import { useSignal, type ComponentProps } from '@ringozz/react-godot';
import { useRef, useState, type ReactElement } from 'react';

const tree = Engine.getMainLoop() as SceneTree;
const root = tree.root;

interface SpawnedObject {
  id: string;
  type: 'box' | 'sphere' | 'cylinder' | 'capsule';
  position: [number, number, number];
  color: [number, number, number];
  emission?: [number, number, number];
  bounce: number;
}

const THEMES = [
  {
    name: 'Deep Space Nebula',
    bgColor: [0.04, 0.08, 0.2] as [number, number, number],
    sunColor: [0.2, 0.8, 1.0] as [number, number, number],
    sunRot: [-0.8, 0.5, 0] as [number, number, number],
  },
  {
    name: 'Sunset Gold',
    bgColor: [0.22, 0.1, 0.05] as [number, number, number],
    sunColor: [1.0, 0.6, 0.2] as [number, number, number],
    sunRot: [-0.5, 1.2, 0] as [number, number, number],
  },
  {
    name: 'Cyberpunk Neon',
    bgColor: [0.12, 0.02, 0.18] as [number, number, number],
    sunColor: [1.0, 0.2, 0.8] as [number, number, number],
    sunRot: [-1.0, -0.4, 0] as [number, number, number],
  },
  {
    name: 'Studio Clean',
    bgColor: [0.35, 0.38, 0.42] as [number, number, number],
    sunColor: [0.95, 0.95, 0.9] as [number, number, number],
    sunRot: [-0.9, 0.3, 0] as [number, number, number],
  },
];

function PhysBody({ color, emission, shape, material, children, ...rest }: {
  color: Color | number[];
  emission?: Color | number[];
  shape: ReactElement;
  material?: ReactElement;
} & ComponentProps<typeof RigidBody3D>) {
  return (
    <RigidBody3D {...rest}>
      <MeshInstance3D>
        {children}
        <StandardMaterial3D
          attach="materialOverride"
          albedoColor={color}
          {...(emission ? { emissionEnabled: true, emission } : {})}
        />
      </MeshInstance3D>
      <CollisionShape3D>{shape}</CollisionShape3D>
      {material}
    </RigidBody3D>
  );
}

export function App() {
  const cameraRef = useRef<Camera3D>(null);
  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObject[]>([]);
  const [themeIdx, setThemeIdx] = useState(0);
  const [showHud, setShowHud] = useState(true);

  const currentTheme = THEMES[themeIdx];

  const isDragging = useRef(false);
  const dx = useRef(0);
  const dy = useRef(0);
  const sensitivity = 0.005;
  const yaw = useRef(0.7);
  const pitch = useRef(0.3);
  const zoom = useRef(8);
  const zoomMin = 2.5;
  const zoomMax = 22;
  const UP = new Vector3(0, 1, 0);
  const TARGET = new Vector3(0, 1, 0);

  const spawnObject = (type: 'box' | 'sphere' | 'cylinder' | 'capsule') => {
    const rx = (Math.random() - 0.5) * 3;
    const rz = (Math.random() - 0.5) * 3;
    const ry = 4 + Math.random() * 2;
    const randomColor: [number, number, number] = [
      0.3 + Math.random() * 0.7,
      0.3 + Math.random() * 0.7,
      0.3 + Math.random() * 0.7,
    ];
    const isGlowing = Math.random() > 0.6;

    const newObj: SpawnedObject = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      position: [rx, ry, rz],
      color: randomColor,
      emission: isGlowing ? [randomColor[0] * 3, randomColor[1] * 3, randomColor[2] * 3] : undefined,
      bounce: 0.5 + Math.random() * 0.4,
    };

    setSpawnedObjects((prev) => [...prev.slice(-40), newObj]);
  };

  const clearObjects = () => {
    setSpawnedObjects([]);
  };

  const cycleTheme = () => {
    setThemeIdx((prev) => (prev + 1) % THEMES.length);
  };

  useSignal(root.windowInput, (event) => {
    if (event instanceof InputEventMouseMotion && isDragging.current) {
      dx.current += event.relative.x;
      dy.current += event.relative.y;
    } else if (event instanceof InputEventMouseButton) {
      if (event.pressed) {
        if (event.buttonIndex === MouseButton.MOUSE_BUTTON_LEFT) {
          isDragging.current = true;
        } else if (event.buttonIndex === MouseButton.MOUSE_BUTTON_RIGHT) {
          const types: ('box' | 'sphere' | 'cylinder' | 'capsule')[] = ['box', 'sphere', 'cylinder', 'capsule'];
          spawnObject(types[Math.floor(Math.random() * types.length)]);
        } else if (event.buttonIndex === MouseButton.MOUSE_BUTTON_WHEEL_DOWN) {
          zoom.current = Math.min(zoomMax, zoom.current * 1.08);
        } else if (event.buttonIndex === MouseButton.MOUSE_BUTTON_WHEEL_UP) {
          zoom.current = Math.max(zoomMin, zoom.current * 0.92);
        }
      } else if (event.buttonIndex === MouseButton.MOUSE_BUTTON_LEFT) {
        isDragging.current = false;
        dx.current = 0;
        dy.current = 0;
      }
    } else if (event instanceof InputEventKey && event.pressed && !event.echo) {
      if (event.keycode === Key.KEY_1) spawnObject('box');
      else if (event.keycode === Key.KEY_2) spawnObject('sphere');
      else if (event.keycode === Key.KEY_3) spawnObject('cylinder');
      else if (event.keycode === Key.KEY_4) spawnObject('capsule');
      else if (event.keycode === Key.KEY_E || event.keycode === Key.KEY_SPACE) {
        const types: ('box' | 'sphere' | 'cylinder' | 'capsule')[] = ['box', 'sphere', 'cylinder', 'capsule'];
        spawnObject(types[Math.floor(Math.random() * types.length)]);
      } else if (event.keycode === Key.KEY_C || event.keycode === Key.KEY_R) {
        clearObjects();
      } else if (event.keycode === Key.KEY_L || event.keycode === Key.KEY_TAB) {
        cycleTheme();
      } else if (event.keycode === Key.KEY_H) {
        setShowHud((show) => !show);
      }
    }
    event.free();
  });

  useSignal(tree.processFrame, () => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (isDragging.current) {
      yaw.current -= dx.current * sensitivity;
      pitch.current += dy.current * sensitivity;
      pitch.current = Math.max(-1.4, Math.min(1.4, pitch.current));
      dx.current = 0;
      dy.current = 0;
    }
    const cx = zoom.current * Math.cos(pitch.current) * Math.sin(yaw.current);
    const cy = zoom.current * Math.sin(pitch.current) + 1;
    const cz = zoom.current * Math.cos(pitch.current) * Math.cos(yaw.current);
    camera.position = new Vector3(cx, cy, cz);
    camera.lookAt(TARGET, UP);
  });

  return (
    <>
      <WorldEnvironment>
        <Environment
          attach="environment"
          tonemapMode={ToneMapper.TONE_MAPPER_AGX}
          backgroundMode={BGMode.BG_COLOR}
          backgroundColor={currentTheme.bgColor}
        />
      </WorldEnvironment>

      {/* 2D HUD Info Labels */}
      {showHud && (
        <>
          <Label position={[16, 16]} scale={[1.8, 1.8]}>
            REACT GODOT DEMO
          </Label>
          <Label position={[16, 64]}>
            Theme: {currentTheme.name} | Active Dynamic Objects: {6 + spawnedObjects.length}
          </Label>
          <Label position={[16, 90]}>
            Controls: [1] Cube | [2] Sphere | [3] Cylinder | [4] Capsule | [R-Click/E] Drop Shape | [C] Clear | [L] Theme | [H] HUD
          </Label>
        </>
      )}

      {/* 3D Floating Stage Title */}
      <Label3D position={[0, 4.5, -2.5]} scale={[1.5, 1.5, 1.5]}>
        Interactive Stage
      </Label3D>

      {/* Lighting */}
      <DirectionalLight3D name="sun" rotation={currentTheme.sunRot} />
      <DirectionalLight3D name="fill" rotation={[0.4, -1.2, 0]} />

      <Camera3D name="Camera" ref={cameraRef} />

      {/* Central Kinetic Tower / Stack of Bricks */}
      <PhysBody
        name="TowerBase"
        position={[0, 0.42, 0]}
        color={[0.9, 0.3, 0.2]}
        shape={<BoxShape3D attach="shape" size={[1.2, 0.6, 1.2]} />}
      >
        <BoxMesh attach="mesh" size-x={1.2} size-y={0.6} size-z={1.2} />
      </PhysBody>

      <PhysBody
        name="TowerMid1"
        position={[-0.2, 1.02, 0]}
        color={[0.2, 0.8, 0.4]}
        shape={<BoxShape3D attach="shape" size={[0.9, 0.5, 0.9]} />}
      >
        <BoxMesh attach="mesh" size-x={0.9} size-y={0.5} size-z={0.9} />
      </PhysBody>

      <PhysBody
        name="TowerMid2"
        position={[0.2, 1.54, 0.1]}
        color={[0.2, 0.5, 0.9]}
        shape={<BoxShape3D attach="shape" size={[0.7, 0.5, 0.7]} />}
      >
        <BoxMesh attach="mesh" size-x={0.7} size-y={0.5} size-z={0.7} />
      </PhysBody>

      {/* Glowing Sphere On Top */}
      <PhysBody
        name="TowerTopSphere"
        position={[0, 2.25, 0]}
        color={[1, 0.9, 0.2]}
        emission={[5, 4.5, 1]}
        shape={<SphereShape3D attach="shape" radius={0.4} />}
        material={<PhysicsMaterial attach="physicsMaterialOverride" bounce={0.85} />}
      >
        <SphereMesh attach="mesh" radius={0.4} height={0.8} />
      </PhysBody>

      {/* Side Kinetic Bouncy Obstacles */}
      <PhysBody
        name="BouncyCylinderLeft"
        position={[-2.2, 2.0, -1]}
        color={[0.9, 0.2, 0.8]}
        shape={<CylinderShape3D attach="shape" radius={0.4} height={0.8} />}
        material={<PhysicsMaterial attach="physicsMaterialOverride" bounce={0.9} />}
      >
        <CylinderMesh attach="mesh" topRadius={0.4} bottomRadius={0.4} height={0.8} />
      </PhysBody>

      <PhysBody
        name="CapsuleRight"
        position={[2.2, 2.2, 1]}
        color={[0.1, 0.9, 0.9]}
        shape={<CapsuleShape3D attach="shape" radius={0.35} height={0.9} />}
      >
        <CapsuleMesh attach="mesh" radius={0.35} height={0.9} />
      </PhysBody>

      {/* User Spawned Objects */}
      {spawnedObjects.map((obj) => (
        <PhysBody
          key={obj.id}
          name={`Spawned_${obj.id}`}
          position={obj.position}
          color={obj.color}
          emission={obj.emission}
          material={<PhysicsMaterial attach="physicsMaterialOverride" bounce={obj.bounce} />}
          shape={
            obj.type === 'box' ? (
              <BoxShape3D attach="shape" size={[0.6, 0.6, 0.6]} />
            ) : obj.type === 'sphere' ? (
              <SphereShape3D attach="shape" radius={0.35} />
            ) : obj.type === 'cylinder' ? (
              <CylinderShape3D attach="shape" radius={0.35} height={0.7} />
            ) : (
              <CapsuleShape3D attach="shape" radius={0.3} height={0.7} />
            )
          }
        >
          {obj.type === 'box' ? (
            <BoxMesh attach="mesh" size-x={0.6} size-y={0.6} size-z={0.6} />
          ) : obj.type === 'sphere' ? (
            <SphereMesh attach="mesh" radius={0.35} height={0.7} />
          ) : obj.type === 'cylinder' ? (
            <CylinderMesh attach="mesh" topRadius={0.35} bottomRadius={0.35} height={0.7} />
          ) : (
            <CapsuleMesh attach="mesh" radius={0.3} height={0.7} />
          )}
        </PhysBody>
      ))}

      {/* Decorative Ramp Static Body */}
      <StaticBody3D name="Ramp" position={[-2.5, 0.3, 1.5]} rotation={[0.3, 0.4, -0.2]}>
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[2.2, 0.1, 1.5]} />
        </CollisionShape3D>
        <MeshInstance3D>
          <BoxMesh attach="mesh" size-x={2.2} size-y={0.1} size-z={1.5} />
          <StandardMaterial3D attach="materialOverride" albedoColor={[0.4, 0.4, 0.5]} />
        </MeshInstance3D>
      </StaticBody3D>

      {/* Main Ground Stage */}
      <StaticBody3D name="Ground">
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[10, 0.2, 10]} />
        </CollisionShape3D>
        <MeshInstance3D>
          <BoxMesh attach="mesh" size-x={10} size-y={0.2} size-z={10} />
          <StandardMaterial3D attach="materialOverride" albedoColor={[0.2, 0.22, 0.28]} />
        </MeshInstance3D>
        <PhysicsMaterial attach="physicsMaterialOverride" friction={0.8} bounce={0.4} />
      </StaticBody3D>

      {/* Safety Boundary Walls */}
      <StaticBody3D name="WallBack" position={[0, 1.5, -5]}>
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[10, 3, 0.2]} />
        </CollisionShape3D>
      </StaticBody3D>
      <StaticBody3D name="WallFront" position={[0, 1.5, 5]}>
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[10, 3, 0.2]} />
        </CollisionShape3D>
      </StaticBody3D>
      <StaticBody3D name="WallLeft" position={[-5, 1.5, 0]}>
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[0.2, 3, 10]} />
        </CollisionShape3D>
      </StaticBody3D>
      <StaticBody3D name="WallRight" position={[5, 1.5, 0]}>
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[0.2, 3, 10]} />
        </CollisionShape3D>
      </StaticBody3D>
    </>
  );
}
