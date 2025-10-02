"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Html, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

import { Progress } from "@/components/ui/progress"
import { ClientOnlyWrapper } from "./client-only-wrapper"

type Vector3Tuple = [number, number, number]

type OperationStatus = "pending" | "in-progress" | "completed" | "waiting-materials"

export interface RepairOperation {
  id: string
  satelliteName: string
  operation: "repair" | "replace" | "upgrade"
  component: string
  materialsNeeded?: { material: string; amount: number }[]
  duration: number
  progress: number
  status: OperationStatus
}

function isEmissiveMaterial(
  material: THREE.Material,
): material is THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  return material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial
}

function applyEmissiveIntensity(mesh: THREE.Mesh | null, intensity: number) {
  if (!mesh) return
  const { material } = mesh

  if (Array.isArray(material)) {
    material.forEach((childMaterial) => {
      if (isEmissiveMaterial(childMaterial)) {
        childMaterial.emissiveIntensity = intensity
      }
    })
  } else if (isEmissiveMaterial(material)) {
    material.emissiveIntensity = intensity
  }
}

function RoboticArm({
  position,
  rotation,
  isActive,
}: {
  position: Vector3Tuple
  rotation: Vector3Tuple
  isActive: boolean
}) {
  const armRef = useRef<THREE.Group>(null)
  const joint1Ref = useRef<THREE.Mesh>(null)
  const joint2Ref = useRef<THREE.Mesh>(null)
  const effectorRef = useRef<THREE.Mesh>(null)
  const animationPhaseRef = useRef(Math.random() * Math.PI * 2)
  const [activityProgress, setActivityProgress] = useState(0)
  const lastHudProgressRef = useRef(0)

  useFrame((state) => {
    const phase = animationPhaseRef.current
    const time = state.clock.getElapsedTime()

    if (!isActive) {
      if (lastHudProgressRef.current !== 0) {
        lastHudProgressRef.current = 0
        setActivityProgress(0)
      }
      return
    }

    if (armRef.current) {
      armRef.current.rotation.y = Math.sin(time * 0.4 + phase) * 0.5
    }

    if (joint1Ref.current) {
      joint1Ref.current.rotation.z = Math.cos(time * 0.6 + phase) * 0.3
    }

    if (joint2Ref.current) {
      joint2Ref.current.rotation.x = Math.sin(time * 0.8 + phase) * 0.4
    }

    if (effectorRef.current) {
      effectorRef.current.scale.x = 1 + Math.sin(time * 2 + phase) * 0.2
      applyEmissiveIntensity(effectorRef.current, 0.3 + Math.sin(time * 3 + phase) * 0.2)
    }

    const hudProgress = Math.floor((Math.sin(time * 0.6 + phase) + 1) * 50)
    if (hudProgress !== lastHudProgressRef.current) {
      lastHudProgressRef.current = hudProgress
      setActivityProgress(hudProgress)
    }
  })

  return (
    <group ref={armRef} position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.1]} />
        <meshStandardMaterial color="#2563EB" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 16]} />
        <meshStandardMaterial
          color={isActive ? "#10B981" : "#6B7280"}
          emissive={isActive ? "#10B981" : "#000000"}
          emissiveIntensity={isActive ? 0.2 : 0}
        />
      </mesh>

      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5]} />
        <meshStandardMaterial color="#1E40AF" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh ref={joint1Ref} position={[0.15, 0.55, 0]}>
        <sphereGeometry args={[0.09]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.85} roughness={0.2} />
      </mesh>

      <mesh ref={joint2Ref} position={[0.32, 0.95, 0]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial color="#3B82F6" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh ref={effectorRef} position={[0.35, 1.0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.08]} />
        <meshStandardMaterial
          color={isActive ? "#10B981" : "#6B7280"}
          emissive={isActive ? "#10B981" : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0.42, 1.0, 0.03]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
        <meshStandardMaterial color="#10B981" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.42, 1.0, -0.03]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
        <meshStandardMaterial color="#10B981" metalness={0.8} roughness={0.2} />
      </mesh>

      {isActive && (
        <Html position={[0.5, 1.3, 0]} center>
          <div className="bg-green-500/30 backdrop-blur-sm border border-green-500/70 rounded-lg px-3 py-2 text-xs text-green-300 font-mono animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              MANIPULATING
            </div>
            <div className="text-xs text-green-400/70">Progress: {activityProgress}%</div>
            <Progress
              value={activityProgress}
              className="w-20 h-1 bg-green-900 rounded-full mt-1 border border-green-500/40 [&_[data-slot=progress-indicator]]:bg-green-400"
            />
          </div>
        </Html>
      )}
    </group>
  )
}

function Furnace({ position, isActive }: { position: Vector3Tuple; isActive: boolean }) {
  const furnaceRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const processingRef = useRef<THREE.Mesh>(null)
  const outputRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (glowRef.current && isActive) {
      applyEmissiveIntensity(glowRef.current, 0.6 + Math.sin(time * 3) * 0.3)
      glowRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05)
    }

    if (processingRef.current && isActive) {
      processingRef.current.rotation.y += 0.03
      applyEmissiveIntensity(processingRef.current, 0.3 + Math.sin(time * 4) * 0.2)
    }

    if (outputRef.current && isActive) {
      outputRef.current.position.y = 0.1 + Math.sin(time * 1.5) * 0.02
    }
  })

  return (
    <group ref={furnaceRef} position={position}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.4, 0.7]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.25, 0.28, 0.4]} />
        <meshStandardMaterial color="#1F2937" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.35]} />
        <meshStandardMaterial
          color={isActive ? "#F97316" : "#374151"}
          emissive={isActive ? "#FBBF24" : "#000000"}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>

      <mesh ref={glowRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.32]} />
        <meshStandardMaterial color="#F59E0B" emissive="#FFD580" emissiveIntensity={0.6} transparent opacity={0.6} />
      </mesh>

      <mesh ref={processingRef} position={[0, 0.5, 0]}>
        <torusGeometry args={[0.2, 0.04, 16, 32]} />
        <meshStandardMaterial color="#FBBF24" metalness={0.5} roughness={0.4} />
      </mesh>

      <mesh ref={outputRef} position={[0, 0.65, 0]}>
        <boxGeometry args={[0.18, 0.05, 0.18]} />
        <meshStandardMaterial color="#FCD34D" metalness={0.4} roughness={0.4} />
      </mesh>

      {isActive && (
        <Html position={[0, 0.9, 0]} center>
          <div className="bg-red-900/70 backdrop-blur-sm border border-red-500/70 rounded-lg px-3 py-2 text-xs text-red-300 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              PROCESSING
            </div>
            <div className="text-xs text-red-400/70">Temp: {1650 + Math.floor(Math.sin(Date.now() * 0.01) * 50)}°C</div>
            <div className="text-xs text-red-400/70">Output: {Math.floor(Math.random() * 50) + 25}kg/h</div>
            <div className="text-xs text-green-400/70">Materials: Al, Ti, Fe</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function Printer3D({ position, isActive }: { position: Vector3Tuple; isActive: boolean }) {
  const printerRef = useRef<THREE.Group>(null)
  const extruderRef = useRef<THREE.Mesh>(null)
  const printObjectRef = useRef<THREE.Mesh>(null)
  const [printProgress, setPrintProgress] = useState(0)
  const lastProgressRef = useRef(0)
  const framePositions: Vector3Tuple[] = [
    [-0.25, 0.2, -0.25],
    [0.25, 0.2, -0.25],
    [-0.25, 0.2, 0.25],
    [0.25, 0.2, 0.25],
  ]

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (extruderRef.current && isActive) {
      const layer = Math.floor(time * 0.5) % 10
      extruderRef.current.position.x = Math.sin(time * 2) * 0.15
      extruderRef.current.position.z = Math.cos(time * 1.8) * 0.15
      extruderRef.current.position.y = 0.3 - layer * 0.02
    }

    if (printObjectRef.current && isActive) {
      const progress = (Math.sin(time * 0.3) + 1) * 0.5
      const normalizedProgress = Math.floor(progress * 100)
      if (normalizedProgress !== lastProgressRef.current) {
        lastProgressRef.current = normalizedProgress
        setPrintProgress(normalizedProgress)
      }
      printObjectRef.current.scale.y = progress
      printObjectRef.current.position.y = -0.05 + progress * 0.05
    }
  })

  return (
    <group ref={printerRef} position={position}>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </mesh>

      {framePositions.map((framePosition, index) => (
        <mesh key={index} position={framePosition}>
          <boxGeometry args={[0.03, 0.8, 0.03]} />
          <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      <mesh position={[0, 0.6, -0.25]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0.25]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#6B7280" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.4]} />
        <meshStandardMaterial color="#1F2937" metalness={0.3} roughness={0.7} />
      </mesh>

      {isActive && (
        <mesh ref={printObjectRef} position={[0, -0.05, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshStandardMaterial color="#8B5CF6" metalness={0.2} roughness={0.8} transparent opacity={0.8} />
        </mesh>
      )}

      <mesh ref={extruderRef} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial
          color={isActive ? "#8B5CF6" : "#4B5563"}
          metalness={0.8}
          roughness={0.2}
          emissive={isActive ? "#8B5CF6" : "#000000"}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>

      <mesh position={[0, 0.25, 0]}>
        <coneGeometry args={[0.02, 0.04, 8]} />
        <meshStandardMaterial
          color={isActive ? "#FF4500" : "#6B7280"}
          emissive={isActive ? "#FF2200" : "#000000"}
          emissiveIntensity={isActive ? 0.6 : 0}
        />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.1} roughness={0.9} />
      </mesh>

      {isActive && (
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-purple-900/70 backdrop-blur-sm border border-purple-500/70 rounded-lg px-4 py-3 text-sm text-purple-300 font-mono">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>PRINTING ACTIVE</span>
            </div>
            <div className="text-xs text-purple-400/70">Progress: {printProgress}%</div>
            <Progress
              value={printProgress}
              className="w-20 h-1 bg-purple-900 rounded-full mt-1 border border-purple-500/40 [&_[data-slot=progress-indicator]]:bg-purple-400"
            />
          </div>
        </Html>
      )}
    </group>
  )
}

function DebrisCollectionArm({
  position,
  rotation,
  isActive,
}: {
  position: Vector3Tuple
  rotation: Vector3Tuple
  isActive: boolean
}) {
  const armRef = useRef<THREE.Group>(null)
  const scannerRef = useRef<THREE.Mesh>(null)
  const magnetRef = useRef<THREE.Mesh>(null)
  const debrisRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!armRef.current || !isActive) {
      return
    }

    const time = state.clock.getElapsedTime()

    armRef.current.rotation.y = Math.sin(time * 0.3) * 1.2

    if (scannerRef.current) {
      scannerRef.current.rotation.z += 0.05
      applyEmissiveIntensity(scannerRef.current, 0.5 + Math.sin(time * 4) * 0.3)
    }

    if (magnetRef.current) {
      applyEmissiveIntensity(magnetRef.current, 0.3 + Math.sin(time * 2) * 0.2)
    }

    if (debrisRef.current) {
      debrisRef.current.position.y = -0.2 + Math.sin(time * 0.8) * 0.1
      debrisRef.current.rotation.x += 0.02
      debrisRef.current.rotation.y += 0.01
    }
  })

  return (
    <group ref={armRef} position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.15]} />
        <meshStandardMaterial color="#059669" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.22, 0.03, 8, 16]} />
        <meshStandardMaterial
          color={isActive ? "#10B981" : "#6B7280"}
          emissive={isActive ? "#10B981" : "#000000"}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>

      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6]} />
        <meshStandardMaterial color="#047857" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh ref={scannerRef} position={[0, 0.8, 0]}>
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshStandardMaterial
          color={isActive ? "#10B981" : "#374151"}
          emissive={isActive ? "#10B981" : "#000000"}
          emissiveIntensity={isActive ? 0.6 : 0}
        />
      </mesh>

      <mesh ref={magnetRef} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.08]} />
        <meshStandardMaterial
          color="#DC2626"
          emissive={isActive ? "#DC2626" : "#000000"}
          emissiveIntensity={isActive ? 0.4 : 0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {isActive && (
        <mesh ref={debrisRef} position={[0, 1.1, 0]}>
          <dodecahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.4} />
        </mesh>
      )}

      {isActive && (
        <Html position={[0.3, 1.2, 0]} center>
          <div className="bg-green-900/70 backdrop-blur-sm border border-green-500/70 rounded-lg px-3 py-2 text-xs text-green-300 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              DEBRIS SCAN
            </div>
            <div className="text-xs text-green-400/70">Objects: {Math.floor(Math.random() * 15) + 5}</div>
            <div className="text-xs text-green-400/70">Range: 2.5km</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function RepairStation({
  position,
  isActive,
  currentOperation,
}: {
  position: Vector3Tuple
  isActive: boolean
  currentOperation?: RepairOperation
}) {
  const stationRef = useRef<THREE.Group>(null)
  const toolRef = useRef<THREE.Mesh>(null)
  const diagnosticRef = useRef<THREE.Mesh>(null)
  const repairArmRef = useRef<THREE.Mesh>(null)
  const sparksRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (toolRef.current && isActive && currentOperation?.status === "in-progress") {
      toolRef.current.rotation.z = Math.sin(time * 3) * 0.2
      toolRef.current.position.y = 0.2 + Math.sin(time * 2) * 0.03
    }

    if (repairArmRef.current && isActive && currentOperation?.status === "in-progress") {
      repairArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.3
      repairArmRef.current.position.z = Math.cos(time * 1.2) * 0.05
    }

    if (diagnosticRef.current && isActive) {
      applyEmissiveIntensity(diagnosticRef.current, 0.4 + Math.sin(time * 3) * 0.2)
    }

    if (sparksRef.current && currentOperation?.status === "in-progress") {
      sparksRef.current.children.forEach((spark) => {
        spark.position.y += Math.random() * 0.02
        spark.position.x += (Math.random() - 0.5) * 0.01
        spark.position.z += (Math.random() - 0.5) * 0.01

        if (spark.position.y > 0.5) {
          spark.position.y = 0.2
          spark.position.x = (Math.random() - 0.5) * 0.1
          spark.position.z = (Math.random() - 0.5) * 0.1
        }
      })
    }
  })

  return (
    <group ref={stationRef} position={position}>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#1E40AF" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[-0.2, 0.1, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.08]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh ref={toolRef} position={[-0.2, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial
          color={isActive ? "#F59E0B" : "#6B7280"}
          emissive={isActive ? "#F59E0B" : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>

      <mesh ref={repairArmRef} position={[0.2, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.25, 0.06]} />
        <meshStandardMaterial
          color={currentOperation?.status === "in-progress" ? "#10B981" : "#4B5563"}
          emissive={currentOperation?.status === "in-progress" ? "#10B981" : "#000000"}
          emissiveIntensity={currentOperation?.status === "in-progress" ? 0.4 : 0}
        />
      </mesh>

      <mesh ref={diagnosticRef} position={[0.2, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.06]} />
        <meshStandardMaterial
          color={isActive ? "#8B5CF6" : "#4B5563"}
          emissive={isActive ? "#8B5CF6" : "#000000"}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>

      {currentOperation?.status === "in-progress" && (
        <group ref={sparksRef}>
          {Array.from({ length: 8 }).map((_, index) => (
            <mesh key={index} position={[Math.random() * 0.1 - 0.05, 0.2, Math.random() * 0.1 - 0.05]}>
              <sphereGeometry args={[0.005]} />
              <meshBasicMaterial color="#FFD700" />
            </mesh>
          ))}
        </group>
      )}

      {isActive && (
        <mesh position={[0, 0.4, 0]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {isActive && (
        <Html position={[0, 0.6, 0]} center>
          <div className="bg-blue-900/70 backdrop-blur-sm border border-blue-500/70 rounded-lg px-3 py-2 text-xs text-blue-300 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              HERMES REPAIR STATION
            </div>
            {currentOperation ? (
              <>
                <div className="text-xs text-blue-400/70">Target: {currentOperation.satelliteName}</div>
                <div className="text-xs text-blue-400/70">Operation: {currentOperation.operation.toUpperCase()}</div>
                <div className="text-xs text-blue-400/70">Component: {currentOperation.component}</div>
                <div className="text-xs text-blue-400/70">Progress: {Math.round(currentOperation.progress)}%</div>
                <Progress
                  value={currentOperation.progress}
                  className="w-20 h-1 bg-blue-900 rounded-full mt-1 border border-blue-500/40 [&_[data-slot=progress-indicator]]:bg-blue-400"
                />
              </>
            ) : (
              <div className="text-xs text-blue-400/70">
                STANDBY MODE
                <br />
                Awaiting assignment...
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

interface SatelliteInteriorSceneProps {
  activeSystem: string | null
  currentOperation?: RepairOperation
}

export default function SatelliteInteriorScene({
  activeSystem,
  currentOperation,
}: SatelliteInteriorSceneProps) {
  return (
    <ClientOnlyWrapper>
      <Canvas camera={{ position: [3, 2.5, 3], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 2, 2]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-2, 1, -1]} intensity={0.8} color="#3B82F6" />
        <spotLight position={[0, 3, 0]} intensity={1} angle={0.6} penumbra={0.5} />
        <pointLight position={[0, 1, 2]} intensity={0.6} color="#10B981" />

        <Environment preset="warehouse" />

        <mesh position={[0, 0, -2]}>
          <boxGeometry args={[4, 3, 0.1]} />
          <meshStandardMaterial color="#1E293B" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[-2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[4, 3, 0.1]} />
          <meshStandardMaterial color="#1E293B" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[4, 3, 0.1]} />
          <meshStandardMaterial color="#1E293B" metalness={0.3} roughness={0.7} />
        </mesh>

        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[4, 4, 0.1]} />
          <meshStandardMaterial color="#0F172A" metalness={0.5} roughness={0.5} />
        </mesh>

        <DebrisCollectionArm
          position={[-1.2, -0.5, 1]}
          rotation={[0, -Math.PI / 4, 0]}
          isActive={activeSystem === "debris-collector"}
        />
        <RepairStation
          position={[1.2, -0.8, 1]}
          isActive={activeSystem === "repair-station"}
          currentOperation={currentOperation}
        />
        <Furnace position={[0, -0.5, -1.2]} isActive={activeSystem === "furnace"} />
        <Printer3D position={[1.2, -0.5, -1.2]} isActive={activeSystem === "printer"} />
        <RoboticArm position={[-1.2, -0.5, -0.2]} rotation={[0, Math.PI / 6, 0]} isActive={activeSystem === "arm1"} />
        <RoboticArm position={[0.8, -0.5, 0.2]} rotation={[0, -Math.PI / 3, 0]} isActive={activeSystem === "arm2"} />

        <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={10} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </ClientOnlyWrapper>
  )
}
