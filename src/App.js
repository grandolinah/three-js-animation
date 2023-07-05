import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect } from "react";
import Model from "./models/nick_body.glb";
import Nose from "./models/nick_nose_no_motion.glb";

export default function App() {
  let _clock = new THREE.Clock();
  let _mixers = [];
  let _skeltonHelper = null;
  let _actions = {};

  useEffect(() => {
    // Load GLTF or GLB
    // renderer
    const canvalEl = document.querySelector("#canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas: canvalEl,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x353535);
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;

    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // camera
    const camera = new THREE.PerspectiveCamera(45, 1);
    camera.near = 1;
    camera.far = 130;
    camera.fov = 60;
    const camScale = 15;
    camera.position.set(1.1 * camScale, 1.5 * camScale, 2.4 * camScale);

    // light
    const light = new THREE.DirectionalLight(0xffffff, 0.7, 100);
    light.position.set(0, 7, 2);
    light.castShadow = true;
    light.shadow.camera.near = 5;
    light.shadow.camera.far = 100;
    light.shadow.bias = -0.000222;
    const lightMapSize = 1024;
    light.shadow.mapSize.width = lightMapSize;
    light.shadow.mapSize.height = lightMapSize;
    light.shadow.radius = 2;
    const light2 = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.7);
    scene.add(light);
    scene.add(light2);

    // grid helper
    const helper = new THREE.GridHelper(20, 20); // size, step
    helper.material.opacity = 0.95;
    scene.add(helper);

    // orbit controller
    const controls = new OrbitControls(camera, canvalEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    // -------------
    // load
    let bodyClip = null;

    loadGltf(0, Model, function () {
      loadGltf(1, Nose, function () {
        console.log("complete loaded");
      });
    });

    loop();

    // ------------

    // -------------
    // load
    function loadGltf(glbIdx, url, callback) {
      const loader = new GLTFLoader();
      loader.load(
        url,
        function (gltf) {
          // if body
          let mixer = null;
          if (glbIdx === 0) {
            if (gltf.animations && gltf.animations.length) {
              mixer = new THREE.AnimationMixer(gltf.scene);
              for (let i = 0; i < gltf.animations.length; i++) {
                let clip = gltf.animations[i];

                // save clip to use nose
                bodyClip = clip;
                let action = mixer.clipAction(clip);

                if (!_actions[clip.name]) {
                  _actions[clip.name] = [];
                }
                _actions[clip.name].push(action);

                action.setLoop(THREE.LoopRepeat);
                action.clampWhenFinished = true;
                action.play();
              }
            }
          }
          // if nose
          else if (glbIdx === 1) {
            mixer = new THREE.AnimationMixer(gltf.scene);

            mixer.clipAction(bodyClip).reset().play();
          }
          _mixers.push(mixer);

          // skelton helper
          _skeltonHelper = new THREE.SkeletonHelper(gltf.scene);
          _skeltonHelper.material.linewidth = 1;
          _skeltonHelper.visible = true;
          scene.add(_skeltonHelper);

          // scene
          scene.add(gltf.scene);

          callback();
        },
        function (error) {
          console.log("GLTF Parse Error : ", error);
        }
      );
    }

    function loop() {
      controls.update();

      var delta = _clock.getDelta();

      for (var key in _mixers) {
        if (_mixers[key] != null) {
          // console.log(key, _mixers[key].time)
          _mixers[key].update(delta);
        }
      }

      renderer.render(scene, camera);

      requestAnimationFrame(loop);
    }
  });
  return (
    <div className="App">
      <canvas id="canvas"></canvas>
    </div>
  );
}
