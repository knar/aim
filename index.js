let canvas, renderer, scene, camera, cube, hasFocus, aim, hudCanvas, hudctx;

function havePointerLock() {
	return 'pointerLockElement' in document ||
		'mozPointerLockElement' in document ||
		'webkitPointerLockElement' in document;
}

function activatePointerLock(canvas) {
	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock ||
		canvas.webkitRequestPointerLock;
	canvas.requestPointerLock();
}

function isPointerLocked(canvas) {
	return document.pointerLockElement === canvas;
}

function init() {
	canvas = document.getElementById("threeCanvas");
	
	// camera
	const fov = 90;
	const aspect = canvas.width / canvas.height;
	const near = 0.1;
	const far = 25;

	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 3;

	aim = new THREE.Euler(0, 0, 0);
	camera.quaternion.setFromEuler(aim);

	renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.width, canvas.height);

	// cube
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshPhongMaterial({ color: 0xffe354 });
	cube = new THREE.Mesh(geometry, material);

	// lighting
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(-1, 2, 4);

	// the scene, with cube and light
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x9dd0fc);
	scene.add(cube);
	scene.add(light);

	hudCanvas = document.getElementById("hudCanvas");
	hudctx = hudCanvas.getContext("2d");

	drawHud();

	// resize bruh
	window.addEventListener('resize', resize);

	// capture mouse movement
	document.addEventListener('mousemove', mouseMove);

	// pointer lock shinanigans
	canvas.addEventListener('click', () => {
		if (havePointerLock() && !hasFocus) {
			activatePointerLock(canvas);
		}
	});

	document.addEventListener('pointerlockchange', () => {
		hasFocus = isPointerLocked(canvas);
	});
}

function render() {
	requestAnimationFrame(render);

	const time = Date.now() * 0.001;
	cube.rotation.x = time;
	cube.rotation.y = time;
	cube.rotation.z = time;

	renderer.render(scene, camera);
}

function drawHud() {
	const x = hudCanvas.width / 2 + 0.5;
	const y = hudCanvas.height / 2 + 0.5;
	const size = 10;
	const drawOutline = true;
	hudctx.strokeStyle = '#0000ff';
	hudctx.lineWidth = 4;
	
	hudctx.beginPath();
	hudctx.moveTo(x - size, y);
	hudctx.lineTo(x + size, y);
	hudctx.moveTo(x, y - size);
	hudctx.lineTo(x, y + size);
	hudctx.stroke();

}

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	camera.aspect = canvas.width / canvas.height;
	camera.updateProjectionMatrix();

	renderer.setSize(canvas.width, canvas.height);
	renderer.render(scene, camera);

	hudCanvas.width = window.innerWidth;
	hudCanvas.height = window.innerHeight;

	drawHud();
}

function mouseMove(event) {
	if (!hasFocus)
		return;

	const dx = event.movementX || event.mozMovementX ||
		event.webkitMovementX || 0;
	const dy = event.movementY || event.mozMovementY ||
		event.webkitMovementY || 0;

	// something about these here eulers, y=x and x=y LUL
	aim.y -= dx * 0.002;
	aim.x -= dy * 0.002;

	camera.quaternion.setFromEuler(aim);
}

window.addEventListener('load', () => {
	init();
	resize();
	render();
});

