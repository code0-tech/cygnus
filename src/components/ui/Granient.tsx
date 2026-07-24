"use client"

import React, { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { Renderer, Program, Mesh, Triangle } from "ogl"

type GrainientPalette = {
    color1: string
    color2: string
    color3: string
    backgroundColor?: string
}

const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return [1, 1, 1]
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
}

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`

type GrainientUniforms = {
    iTime: { value: number }
    iResolution: { value: Float32Array }
    uTimeSpeed: { value: number }
    uColorBalance: { value: number }
    uWarpStrength: { value: number }
    uWarpFrequency: { value: number }
    uWarpSpeed: { value: number }
    uWarpAmplitude: { value: number }
    uBlendAngle: { value: number }
    uBlendSoftness: { value: number }
    uRotationAmount: { value: number }
    uNoiseScale: { value: number }
    uGrainAmount: { value: number }
    uGrainScale: { value: number }
    uGrainAnimated: { value: number }
    uContrast: { value: number }
    uGamma: { value: number }
    uSaturation: { value: number }
    uCenterOffset: { value: Float32Array }
    uZoom: { value: number }
    uColor1: { value: Float32Array }
    uColor2: { value: Float32Array }
    uColor3: { value: Float32Array }
}

type GrainientRuntime = {
    renderer: Renderer
    program: Program
    uniforms: GrainientUniforms
    mesh: Mesh
    renderFrame: (time?: number) => void
    startLoop: () => void
    stopLoop: () => void
}

const GRAINIENT_CONFIG = {
    maxDpr: 1,
    timeSpeed: 0.25,
    colorBalance: 0,
    warpStrength: 1,
    warpFrequency: 5,
    warpSpeed: 2,
    warpAmplitude: 50,
    blendAngle: 0,
    blendSoftness: 0.05,
    rotationAmount: 500,
    noiseScale: 2,
    grainAmount: 0.1,
    grainScale: 2,
    grainAnimated: false,
    contrast: 1.5,
    gamma: 1,
    saturation: 1,
    centerX: 0,
    centerY: 0,
    zoom: 0.9,
    color1: "#13102d",
    color2: "#72f896",
    color3: "#7472f8",
} as const

const Grainient: React.FC<Partial<GrainientPalette>> = ({ color1 = GRAINIENT_CONFIG.color1, color2 = GRAINIENT_CONFIG.color2, color3 = GRAINIENT_CONFIG.color3, backgroundColor = "#13102d" }) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const runtimeRef = useRef<GrainientRuntime | null>(null)
    const prefersReducedMotion = useReducedMotion()
    const prefersReducedMotionRef = useRef(prefersReducedMotion)
    prefersReducedMotionRef.current = prefersReducedMotion

    useEffect(() => {
        if (!containerRef.current) return

        let renderer: Renderer

        try {
            renderer = new Renderer({
                webgl: 2,
                alpha: true,
                antialias: false,
                dpr: Math.min(window.devicePixelRatio || 1, GRAINIENT_CONFIG.maxDpr),
            })
        } catch {
            return
        }

        const gl = renderer.gl
        if (!gl) return

        const canvas = gl.canvas as HTMLCanvasElement
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"
        canvas.style.position = "absolute"
        canvas.style.inset = "0"
        canvas.style.borderRadius = "inherit"

        const container = containerRef.current
        container.appendChild(canvas)

        const geometry = new Triangle(gl)
        const uniforms: GrainientUniforms = {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([1, 1]) },
            uTimeSpeed: { value: GRAINIENT_CONFIG.timeSpeed },
            uColorBalance: { value: GRAINIENT_CONFIG.colorBalance },
            uWarpStrength: { value: GRAINIENT_CONFIG.warpStrength },
            uWarpFrequency: { value: GRAINIENT_CONFIG.warpFrequency },
            uWarpSpeed: { value: GRAINIENT_CONFIG.warpSpeed },
            uWarpAmplitude: { value: GRAINIENT_CONFIG.warpAmplitude },
            uBlendAngle: { value: GRAINIENT_CONFIG.blendAngle },
            uBlendSoftness: { value: GRAINIENT_CONFIG.blendSoftness },
            uRotationAmount: { value: GRAINIENT_CONFIG.rotationAmount },
            uNoiseScale: { value: GRAINIENT_CONFIG.noiseScale },
            uGrainAmount: { value: GRAINIENT_CONFIG.grainAmount },
            uGrainScale: { value: GRAINIENT_CONFIG.grainScale },
            uGrainAnimated: { value: GRAINIENT_CONFIG.grainAnimated ? 1.0 : 0.0 },
            uContrast: { value: GRAINIENT_CONFIG.contrast },
            uGamma: { value: GRAINIENT_CONFIG.gamma },
            uSaturation: { value: GRAINIENT_CONFIG.saturation },
            uCenterOffset: { value: new Float32Array([GRAINIENT_CONFIG.centerX, GRAINIENT_CONFIG.centerY]) },
            uZoom: { value: GRAINIENT_CONFIG.zoom },
            uColor1: { value: new Float32Array(hexToRgb(color1)) },
            uColor2: { value: new Float32Array(hexToRgb(color2)) },
            uColor3: { value: new Float32Array(hexToRgb(color3)) },
        }

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms,
        })

        const mesh = new Mesh(gl, { geometry, program })

        let resizeFrame = 0
        let lastWidth = 0
        let lastHeight = 0
        let raf = 0
        const t0 = performance.now()
        let disposed = false
        let running = false
        let isInViewport = true
        let isPageVisible = document.visibilityState === "visible"
        let lastFrameTime = 0
        const frameInterval = 1000 / 30

        const renderFrame = (t = performance.now()) => {
            uniforms.iTime.value = (t - t0) * 0.001
            renderer.render({ scene: mesh })
        }

        const setSize = () => {
            const rect = container.getBoundingClientRect()
            const width = Math.max(1, Math.floor(rect.width))
            const height = Math.max(1, Math.floor(rect.height))

            if (width === lastWidth && height === lastHeight) {
                return
            }

            lastWidth = width
            lastHeight = height
            renderer.setSize(width, height)
            const res = uniforms.iResolution.value
            res[0] = gl.drawingBufferWidth
            res[1] = gl.drawingBufferHeight

            renderFrame()
        }

        const queueResize = () => {
            if (resizeFrame) return

            resizeFrame = requestAnimationFrame(() => {
                resizeFrame = 0
                setSize()
            })
        }

        const ro = new ResizeObserver(queueResize)
        ro.observe(container)
        setSize()

        const stopLoop = () => {
            running = false
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        const loop = (t: number) => {
            if (disposed || !running) return

            if (t - lastFrameTime >= frameInterval) {
                lastFrameTime = t
                renderFrame(t)
            }

            raf = requestAnimationFrame(loop)
        }

        const startLoop = () => {
            if (disposed || prefersReducedMotionRef.current || running || !isInViewport || !isPageVisible) return

            running = true
            lastFrameTime = 0
            raf = requestAnimationFrame(loop)
        }

        runtimeRef.current = {
            renderer,
            program,
            uniforms,
            mesh,
            renderFrame,
            startLoop,
            stopLoop,
        }

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                isInViewport = Boolean(entry?.isIntersecting)

                if (isInViewport) {
                    if (prefersReducedMotionRef.current) {
                        renderFrame(performance.now())
                    } else {
                        startLoop()
                    }
                } else {
                    stopLoop()
                }
            },
            { threshold: 0.05 }
        )

        visibilityObserver.observe(container)

        const handleVisibilityChange = () => {
            isPageVisible = document.visibilityState === "visible"

            if (!isPageVisible) {
                stopLoop()
                return
            }

            if (prefersReducedMotionRef.current) {
                renderFrame(performance.now())
            } else {
                startLoop()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        if (prefersReducedMotionRef.current) {
            renderFrame(performance.now())
        } else {
            startLoop()
        }

        return () => {
            disposed = true
            runtimeRef.current = null
            stopLoop()
            if (resizeFrame) {
                cancelAnimationFrame(resizeFrame)
            }
            ro.disconnect()
            visibilityObserver.disconnect()
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            try {
                container.removeChild(canvas)
            } catch {
                // Ignore
            }
        }
    }, [backgroundColor, color1, color2, color3])

    useEffect(() => {
        const runtime = runtimeRef.current
        if (!runtime) return

        if (prefersReducedMotion) {
            runtime.stopLoop()
            runtime.renderFrame()
            return
        }

        runtime.startLoop()

        return () => {
            runtime.stopLoop()
        }
    }, [prefersReducedMotion])

    return (
        <div
            ref={containerRef}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden rounded-[inherit]"
            aria-hidden="true"
            style={{
                backgroundColor,
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
            }}
        />
    )
}

export default Grainient
