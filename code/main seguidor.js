var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
camera.position.set(0, 0, 20);
var renderer = new THREE.WebGLRenderer({
  antialias: true,
});
var canvas = renderer.domElement;
document.body.appendChild(canvas);

var box = new THREE.Mesh(
  new THREE.BoxBufferGeometry(),
  new THREE.MeshNormalMaterial()
);
box.geometry.translate(0, 0, 0.5);
box.scale.set(1, 1, 3);
scene.add(box);

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
  box.lookAt(pointOfIntersection);
}

renderer.setAnimationLoop(() => {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
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
