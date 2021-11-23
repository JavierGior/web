function init() {
  var scene = new THREE.Scene();
  var gui = new dat.GUI();

  // initialize objects
  var sphereMaterial = getMaterial("standard", "rgb(255, 255, 255)");
  var sphere = getSphere(sphereMaterial, 1, 24);

  var planebMaterial = getMaterial("standard", "rgb(255, 255, 255)");
  var planeb = getPlane(planebMaterial, 300);

  var lightLeft = getSpotLight(1, "rgb(255, 220, 180)");
  var lightRight = getSpotLight(1, "rgb(255, 220, 180)");

  // manipulate objects
  sphere.position.y = sphere.geometry.parameters.radius;
  planeb.rotation.x = Math.PI / 2;

  lightLeft.position.x = -5;
  lightLeft.position.y = 2;
  lightLeft.position.z = 2;

  lightRight.position.x = 5;
  lightRight.position.y = 2;
  lightRight.position.z = 2;

  // manipulate materials
  // load the cube map
  var path = "/assets/cubemap/";
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

  scene.background = reflectionCube;

  var loader = new THREE.TextureLoader();
  planebMaterial.map = loader.load("/assets/textures/concrete.jpg");
  planebMaterial.bumpMap = loader.load("/assets/textures/concrete.jpg");
  planebMaterial.roughnessMap = loader.load("/assets/textures/concrete.jpg");
  planebMaterial.bumpScale = 0.01;
  planebMaterial.metalness = 0.1;
  planebMaterial.roughness = 0.7;
  planebMaterial.envMap = reflectionCube;
  sphereMaterial.roughnessMap = loader.load(
    "/assets/textures/fingerprints.jpg"
  );
  sphereMaterial.envMap = reflectionCube;

  var maps = ["map", "bumpMap", "roughnessMap"];
  maps.forEach(function (mapName) {
    var texture = planebMaterial[mapName];
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(15, 15);
  });

  // camera
  var camera = new THREE.PerspectiveCamera(
    45, // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    1, // near clipping plane
    1000 // far clipping plane
  );
  camera.position.z = 10;
  camera.position.x = 0;
  camera.position.y = 3;
  camera.lookAt(new THREE.Vector3(0, 2, 0));

  // dat.gui
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
  folder4.open();

  // add objects to the scene
  scene.add(sphere);
  scene.add(planeb);
  scene.add(lightLeft);
  scene.add(lightRight);

  // renderer
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById("webgl").appendChild(renderer.domElement);

  //var controls = new THREE.OrbitControls(camera, renderer.domElement);

  update(renderer, scene, camera);

  return scene;
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

function getPlane(material, size) {
  var geometry = new THREE.PlaneGeometry(size, size);
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.receiveShadow = true;

  return obj;
}

function update(renderer, scene, camera) {
  // controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(function () {
    update(renderer, scene, camera);
  });
}

var scene = init();
