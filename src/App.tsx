import { Color, Key, MouseButton, Vector3 } from '@ringozz/godot';
import { BoxMesh } from '@ringozz/godot/BoxMesh';
import { BoxShape3D } from '@ringozz/godot/BoxShape3D';
import { Camera3D } from '@ringozz/godot/Camera3D';
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
  const [showHud, setShowHud] = useState(true);

  const isDragging = useRef(false);
  const dx = useRef(0);
  const dy = useRef(0);
  const sensitivity = 0.005;
  const yaw = useRef(0.7);
  const pitch = useRef(0.3);
  const zoom = useRef(7);
  const zoomMin = 2.5;
  const zoomMax = 20;
  const UP = new Vector3(0, 1, 0);
  const TARGET = new Vector3(0, 1, 0);

  useSignal(root.windowInput, (event) => {
    if (event instanceof InputEventMouseMotion && isDragging.current) {
      dx.current += event.relative.x;
      dy.current += event.relative.y;
    } else if (event instanceof InputEventMouseButton) {
      if (event.pressed) {
        if (event.buttonIndex === MouseButton.MOUSE_BUTTON_LEFT) {
          isDragging.current = true;
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
    } else if (event instanceof InputEventKey && event.pressed && !event.echo && event.keycode === Key.KEY_SPACE) {
      setShowHud((show) => !show);
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
        <Environment attach="environment" tonemapMode={ToneMapper.TONE_MAPPER_AGX} backgroundMode={BGMode.BG_COLOR} backgroundColor={[0.05, 0.1, 0.25]} />
      </WorldEnvironment>
      <Label scale={[2, 2]}>text2d</Label>
      <Label3D position={[0, 1.2, 0]} scale={[2, 2, 2]}>text3d</Label3D>
      <DirectionalLight3D name="sun" rotation={[-0.8, 0.5, 0]} />
      <DirectionalLight3D name="fill" rotation={[0.4, -1.2, 0]} />
      <Camera3D name="Camera" ref={cameraRef} />
      <PhysBody name="Box" position={[-2.5, 3, 0]} color={[1, 0.2, 0.2]} emission={[10, 1, 1]}
        shape={<BoxShape3D attach="shape" size={[1, 1, 1]} />}>
        <BoxMesh attach="mesh" />
      </PhysBody>
      <PhysBody name="Sphere" position={[0, 3, 0]} color={[0.2, 1, 0.2]}
        shape={<SphereShape3D attach="shape" radius={0.5} />}
        material={<PhysicsMaterial attach="physicsMaterialOverride" bounce={0.8} />}>
        <SphereMesh attach="mesh" radius={0.5} height={1} />
      </PhysBody>
      <PhysBody name="Cylinder" position={[2.5, 3, 0]} color={[0.2, 0.2, 1]}
        shape={<CylinderShape3D attach="shape" radius={0.5} height={1} />}>
        <CylinderMesh attach="mesh" topRadius={0.5} bottomRadius={0.5} height={1} />
      </PhysBody>
      <PhysBody name="CubeSmallA" position={[-1.4, 3.4, 1.4]} color={[0.7, 0.3, 0.9]}
        shape={<BoxShape3D attach="shape" size={[0.5, 0.5, 0.5]} />}>
        <BoxMesh attach="mesh" size-x={0.5} size-y={0.5} size-z={0.5} />
      </PhysBody>
      <PhysBody name="CubeSmallB" position={[1.4, 3.8, -1.2]} color={[1, 0.6, 0.1]}
        shape={<BoxShape3D attach="shape" size={[0.6, 0.6, 0.6]} />}>
        <BoxMesh attach="mesh" size-x={0.6} size-y={0.6} size-z={0.6} />
      </PhysBody>
      <PhysBody name="SphereSmall" position={[0.6, 4.4, 1.2]} color={[0.2, 0.9, 0.9]}
        shape={<SphereShape3D attach="shape" radius={0.35} />}
        material={<PhysicsMaterial attach="physicsMaterialOverride" bounce={0.6} />}>
        <SphereMesh attach="mesh" radius={0.35} height={0.7} />
      </PhysBody>
      <StaticBody3D name="Ground">
        <CollisionShape3D>
          <BoxShape3D attach="shape" size={[8, 0.1, 6]} />
        </CollisionShape3D>
        <MeshInstance3D>
          <BoxMesh attach="mesh" size-x={8} size-y={0.1} size-z={6} />
          <StandardMaterial3D attach="materialOverride" albedoColor={[0.25, 0.25, 0.3]} />
        </MeshInstance3D>
        <PhysicsMaterial attach="physicsMaterialOverride" friction={1} bounce={0.3} />
      </StaticBody3D>
    </>
  )
}
