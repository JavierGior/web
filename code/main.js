var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2("black", 0.01);
var gui = new dat.GUI();
var clock = new THREE.Clock();

var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
camera.position.set(0, 0, 28);
var renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.shadowMap.enabled = false;
document.getElementById("webgl").appendChild(renderer.domElement);

var canvas = renderer.domElement;
document.body.appendChild(canvas);

var gui = false;
var background = false;
scene.background = new THREE.Color("#000101");
var floor = true;

//Particulas

var particleGeo = new THREE.Geometry();
var particleMat = new THREE.PointsMaterial({
  color: "rgb(255,255,255)",
  size: 1,
  map: new THREE.TextureLoader().load("/code/assets/textures/particle.jpg"),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

var particleCount = 1000;
var particleDistance = 100;

for (var i = 0; i < particleCount; i++) {
  var posX = (Math.random() - 0.5) * particleDistance;
  var posY = (Math.random() - 0.5) * particleDistance;
  var posZ = (Math.random() - 0.5) * particleDistance;
  var particle = new THREE.Vector3(posX, posY, posZ);

  particleGeo.vertices.push(particle);
}

var particleSystem = new THREE.Points(particleGeo, particleMat);

scene.add(particleSystem);

particleSystem.name = "particleSystem";

// initialize objects
var sphereMaterial = getMaterial("standard", "rgb(255, 255, 255)");
var sphere = getSphere(sphereMaterial, 2, 24);
sphere.position.x = 6;

var mouseSphere = getSphere(sphereMaterial, 0.001, 24);

var sphere2 = getSphere(sphereMaterial, 2, 24);
sphere2.position.x = -4;
sphere2.position.y = 2;

var planebMaterial = getMaterial("standard", "rgb(0, 0, 0)");
var planeb = getPlane(planebMaterial, 3000);
planeb.position.y = -6;

var lightLeft = getSpotLight(1, "rgb(255, 220, 180)");
var lightRight = getSpotLight(1, "rgb(255, 220, 180)");

var mouseLight = getPointLight(1, "rgb(255, 220, 180)");

/*
var box = new THREE.Mesh(
  new THREE.BoxBufferGeometry(),
  new THREE.MeshNormalMaterial()
);
box.geometry.translate(0, 0, 0.5);
box.scale.set(1, 1, 3);
scene.add(box);
*/

// manipulate objects
sphere.position.y = sphere.geometry.parameters.radius;
planeb.rotation.x = Math.PI / 2;

lightLeft.position.x = -5;
lightLeft.position.y = 2;
lightLeft.position.z = 3;

lightRight.position.x = 5;
lightRight.position.y = 2;
lightRight.position.z = 3;

// load the cube map
var path = "/code/assets/cubemap/";
var format = ".jpg";
var urls = [
  path + "px" + format,
  path + "nx" + format,
  path + "py" + format,
  path + "ny" + format,
  path + "pz" + format,
  path + "nz" + format,
];
var reflectionCube = new THREE.CubeTextureLoader().load(urls);
reflectionCube.format = THREE.RGBFormat;
if (background) {
  scene.background = reflectionCube;
}

var loader = new THREE.TextureLoader();
planebMaterial.map = loader.load("/code/assets/textures/concrete.JPG");
planebMaterial.bumpMap = loader.load("/code/assets/textures/concrete.JPG");
planebMaterial.roughnessMap = loader.load("/code/assets/textures/concrete.JPG");
planebMaterial.bumpScale = 0.01;
planebMaterial.metalness = 0.1;
planebMaterial.roughness = 0.7;
planebMaterial.envMap = reflectionCube;
sphereMaterial.roughness = 0.5;
sphereMaterial.map = loader.load("/code/assets/textures/Eyes.png");

sphereMaterial.envMap = reflectionCube;

var maps = ["map", "bumpMap", "roughnessMap"];
maps.forEach(function (mapName) {
  var texture = planebMaterial[mapName];
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(15, 15);
});

// dat.gui

if (gui) {
  var folder1 = gui.addFolder("light_1");
  folder1.add(lightLeft, "intensity", 0, 10);
  folder1.add(lightLeft.position, "x", -5, 15);
  folder1.add(lightLeft.position, "y", -5, 15);
  folder1.add(lightLeft.position, "z", -5, 15);

  var folder2 = gui.addFolder("light_2");
  folder2.add(lightRight, "intensity", 0, 10);
  folder2.add(lightRight.position, "x", -5, 15);
  folder2.add(lightRight.position, "y", -5, 15);
  folder2.add(lightRight.position, "z", -5, 15);

  var folder3 = gui.addFolder("materials");
  folder3.add(sphereMaterial, "roughness", 0, 1);
  folder3.add(planebMaterial, "roughness", 0, 1);
  folder3.add(sphereMaterial, "metalness", 0, 1);
  folder3.add(planebMaterial, "metalness", 0, 1);

  var folder4 = gui.addFolder("camara");
  folder4.add(camera.position, "x", -20, 20);
  folder4.add(camera.position, "y", -20, 20);
  folder4.add(camera.position, "z", -10, 100);
  //folder4.open();
}
// add objects to the scene
scene.add(sphere);
scene.add(sphere2);
if (floor) {
  scene.add(planeb);
}
//scene.add(lightLeft);
//scene.add(lightRight);
scene.add(mouseSphere);
scene.add(mouseLight);

mouseSphere.add(mouseLight);

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -10);
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var pointOfIntersection = new THREE.Vector3();
canvas.addEventListener("mousemove", onMouseMove, false);

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, pointOfIntersection);
  //box.lookAt(pointOfIntersection);

  mouseSphere.position.x = pointOfIntersection.x;
  mouseSphere.position.y = pointOfIntersection.y;
  mouseSphere.position.z = 4;

  sphere2.lookAt(pointOfIntersection);
  sphere.lookAt(pointOfIntersection);
}

renderer.setAnimationLoop(() => {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  var timeElapsed = clock.getElapsedTime();

  var particleSystem = scene.getObjectByName("particleSystem");

  particleSystem.geometry.vertices.forEach(function (particle) {
    particle.x += Math.sin(timeElapsed) * 0.05;
    particle.y += (Math.random() - 0.7) * 0.05;
    particle.z += (Math.random() - 0.2) * 0.01;

    if (particle.x < -50) {
      particle.x = 50;
    }

    if (particle.y < -50) {
      particle.y = 50;
    }

    if (particle.z < -50) {
      particle.z = 50;
    }

    if (particle.z > 50) {
      particle.z = -50;
    }
  });

  particleSystem.rotation.y += 0.001;
  particleSystem.geometry.verticesNeedUpdate = true;

  renderer.render(scene, camera);
});

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function getSphere(material, size, segments) {
  var geometry = new THREE.SphereGeometry(size, segments, segments);
  var obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;

  return obj;
}

function getMaterial(type, color) {
  var selectedMaterial;
  var materialOptions = {
    color: color === undefined ? "rgb(255, 255, 255)" : color,
  };

  switch (type) {
    case "basic":
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
    case "lambert":
      selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
      break;
    case "phong":
      selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
      break;
    case "standard":
      selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
      break;
    default:
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
  }

  return selectedMaterial;
}

function getSpotLight(intensity, color) {
  color = color === undefined ? "rgb(255, 255, 255)" : color;
  var light = new THREE.SpotLight(color, intensity);
  light.castShadow = true;
  light.penumbra = 0.5;

  //Set up shadow properties for the light
  light.shadow.mapSize.width = 1024; // default: 512
  light.shadow.mapSize.height = 1024; // default: 512
  light.shadow.bias = 0.001;

  return light;
}

function getPointLight(intensity, color) {
  color = color === undefined ? "rgb(255, 255, 255)" : color;
  var light = new THREE.PointLight(color, intensity);
  light.castShadow = true;
  light.penumbra = 0.5;

  //Set up shadow properties for the light
  light.shadow.mapSize.width = 1024; // default: 512
  light.shadow.mapSize.height = 1024; // default: 512
  light.shadow.bias = 0.001;

  return light;
}

function getPlane(material, size) {
  var geometry = new THREE.PlaneGeometry(size, size);
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.receiveShadow = true;

  return obj;
}
