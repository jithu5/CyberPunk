import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js";
import gsap from "gsap";
import LocomotiveScroll from "locomotive-scroll";

const locomotiveScroll = new LocomotiveScroll();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 4;
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.outputEncoding = THREE.sRGBEncoding;

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// RGB Shift Shader Pass
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.0015; // Adjust intensity of RGB shift
composer.addPass(rgbShiftPass);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Add environment light
const rgbeLoader = new RGBELoader();
rgbeLoader.load("./pond_bridge_night_1k.hdr", (texture) => {
  const emvt = pmremGenerator.fromEquirectangular(texture).texture;
  // texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = emvt; // Set the environment map
  // scene.background = emvt; // Optionally, set as background
  texture.dispose();
  pmremGenerator.dispose();
});

// Optionally add an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Soft light
scene.add(ambientLight);

// const controls = new OrbitControls(camera, canvas);
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

let model;
// Load GLTF Model
const loader = new GLTFLoader();
loader.load(
  "./DamagedHelmet.gltf", // Make sure the path is correct or try an absolute URL
  (gltf) => {
    model = gltf.scene;
    scene.add(model); // Add the loaded model to the scene

    model.scale.set(1, 1, 1); // Adjust scale if necessary
    model.position.set(0, 0, 0); // Adjust position if necessary
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded"); // Track loading progress
  },
  (error) => {
    console.error("An error occurred while loading the model:", error); // Log errors
  }
);

document.getElementById("main").addEventListener("mousemove", (event) => {
  if (model) {
    const rotationX =
      (event.clientX / window.innerWidth - 0.5) * (Math.PI * 0.12);
    const rotationY =
      (event.clientY / window.innerHeight - 0.5) * (Math.PI * 0.12);
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      ease: "power2.out",
      duration: 0.9,
    });
  }
});
document.getElementById("main").addEventListener("mouseleave", () => {
  if (model) {
    gsap.to(model.rotation, {
      x: 0,
      y: 0,
      ease: "power2.out",
      duration: 0.9,
    });
  }
});

// animation control
function animate() {
  window.requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Use composer instead of renderer to apply post-processing effects
  composer.render();
}
animate();
