import * as THREE from './lib/threejs/build/three.module.js'
import { have_pointer_lock, activate_pointer_lock, is_pointer_locked } from './js/pointer_lock.js'

window.addEventListener('load', init)

let three_canvas
let renderer
let scene
let camera
let has_focus
let hud_canvas
let hud_context
let last_time

let aim = {
	yaw: 0,
	pitch: 0,
}

const wall_w = 60
const wall_h = 40
const wall_d = 100

const num_targets = 10
const t_box = {
	minX: -wall_w + 5,
	maxX: wall_w - 5,
	minY: 2,
	maxY: 30,
	minZ: -wall_d + 1,
	maxZ: -wall_d + 20,
}
const target_radius = 3
let targets = []

const move_speed = 0.05
const mouse_sens = 0.002

let key_states = {
	w: false,
	a: false,
	s: false,
	d: false,
	q: false,
	e: false,
}

const box = {
	minX: -wall_w,
	maxX: wall_w,
	minZ: -30,
	maxZ: 10,
}

const two_pi = Math.PI * 2

function init() {
	three_canvas = document.getElementById("three_canvas")

	// camera
	const fov = 90
	const aspect = three_canvas.width / three_canvas.height
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 300)
	camera.position.y = 5
	camera.quaternion.setFromEuler(new THREE.Euler(aim.pitch, aim.yaw, 0, 'YXZ'))

	// renderer
	renderer = new THREE.WebGLRenderer({ canvas: three_canvas })
	renderer.setSize(three_canvas.width, three_canvas.height)

	// scene setup
	scene = new THREE.Scene()
	scene.background = new THREE.Color(0x000000)

	scene.add(gen_floor_mesh())
	scene.add(gen_wall_mesh())
	
	const light = new THREE.DirectionalLight(0xffffff, 2)
	light.position.set(5, 10, 10)
	scene.add(light)

	const ambience = new THREE.AmbientLight(0xffffff, 0.9)
	scene.add(ambience)

	// hud stuff
	hud_canvas = document.getElementById("hud_canvas")
	hud_context = hud_canvas.getContext("2d")

	// start doing real stuff
	set_event_listeners()
	resize()
	render()
}

function set_event_listeners() {
	window.addEventListener('resize', resize)

	document.addEventListener('mousemove', mouse_move)

	three_canvas.addEventListener('click', (event) => {
		if (!has_focus && have_pointer_lock())
			activate_pointer_lock(three_canvas)
		
		if (has_focus && event.button == 0)
			shoot()
	})

	document.addEventListener('pointerlockchange', () => {
		has_focus = is_pointer_locked(three_canvas)
	})

	document.addEventListener('keydown', key_down_event)
	document.addEventListener('keyup', key_up_event)
}

function shoot() {
	const yaw = aim.yaw % two_pi
	const pitch = aim.pitch % two_pi

	// unit vector
	const d = {
		x: -Math.sin(yaw) * Math.cos(pitch),
		y: Math.sin(pitch),
		z: -Math.cos(yaw) * Math.cos(pitch),
	}

	// only check collision if aiming in the right area
	if (-d.z * (wall_d * 1.4) > wall_d) {
		for (let i = 0; i < targets.length; i++) {
			const t = targets[i]
			const q = dist_3d({
				x1: t.x,
				y1: t.y,
				z1: t.z
			}, {
				x2: camera.position.x,
				y2: camera.position.y,
				z2: camera.position.z,
			})
			
			// potential hit point, on same z-plane as target checked
			const p = {
				x: d.x * q + camera.position.x,
				y: d.y * q + camera.position.y,
				z: d.z * q + camera.position.z,
			}
			
			// distance between potential hit point and middle of target
			const off = dist_2d(p.x, p.y, t.x, t.y)

			if (off < target_radius) {
				scene.remove(targets[i].mesh)
				targets.splice(i, 1)
				spawnTarget()
				break
			}
		}
	}
	spawnTarget()
}

function spawnTarget() {
	if (targets.length < num_targets) {
		const x = rand(t_box.minX, t_box.maxX)
		const y = rand(t_box.minY, t_box.maxY)
		const z = rand(t_box.minZ, t_box.maxZ)
		
		const mesh = gen_target_mesh({ x, y, z })
		const t = { x, y, z, mesh }

		targets.push(t)
		scene.add(t.mesh)

		targets.sort((a, b) => b.z - a.z)
	}
}

function rand(min, max) {
	return Math.random() * (max - min) + min
}

function dist_2d(x1, y1, x2, y2) {
	const dx = Math.abs(x1 - x2)
	const dy = Math.abs(y1 - y2)

	return Math.sqrt(dx*dx + dy+dy)
}

function dist_3d({ x1, y1, z1 }, { x2, y2, z2 }) {
	const dx = Math.abs(x1 - x2)
	const dy = Math.abs(y1 - y2)
	const dz = Math.abs(z1 - z2)

	return Math.sqrt(dx*dx + dy*dy + dz*dz)
}

function render(time) {
	const dt = time - last_time
	last_time = time

	update_pos(dt)

	renderer.render(scene, camera)

	requestAnimationFrame(render)
}

function gen_target_mesh({ x, y, z }) {
	let geo = new THREE.BoxGeometry(target_radius, target_radius, target_radius)
	let mat = new THREE.MeshStandardMaterial({ color: 0x00ffff })

	let m = new THREE.Mesh(geo, mat)
	m.position.x = x
	m.position.y = y
	m.position.z = z

	return m
}

function gen_wall_mesh() {
	let geo = new THREE.Geometry()

	geo.vertices.push(
		new THREE.Vector3(-wall_w, 0, -wall_d),
		new THREE.Vector3(-wall_w, wall_h, -wall_d),
		new THREE.Vector3(-wall_w, wall_h, 0),
		new THREE.Vector3(-wall_w, 0, 0),
		new THREE.Vector3(wall_w, 0, -wall_d),
		new THREE.Vector3(wall_w, wall_h, -wall_d),
		new THREE.Vector3(wall_w, wall_h, 0),
		new THREE.Vector3(wall_w, 0, 0),
	)

	geo.faces.push(
		// left wall
		new THREE.Face3(0, 1, 2),
		new THREE.Face3(2, 3, 0),

		// right wall
		new THREE.Face3(7, 6, 5),
		new THREE.Face3(5, 4, 7),
		
		// back wall
		new THREE.Face3(0, 4, 5),
		new THREE.Face3(5, 1, 0),
	)

	geo.computeFaceNormals()

	const mat = new THREE.MeshStandardMaterial({ color: 0xff8833 })

	return new THREE.Mesh(geo, mat)
}

function gen_floor_mesh() {
	let geo = new THREE.Geometry()

	geo.vertices.push(
		new THREE.Vector3(-wall_w, 0, -wall_d),
		new THREE.Vector3(-wall_w, 0, 0),
		new THREE.Vector3(wall_w, 0, -wall_d),
		new THREE.Vector3(wall_w, 0, 0),
	)

	geo.faces.push(
		new THREE.Face3(0, 1, 2),
		new THREE.Face3(2, 1, 3),
	)

	geo.computeFaceNormals()

	const mat = new THREE.MeshStandardMaterial({ color: 0x808080 })

	return new THREE.Mesh(geo, mat)
}

function render_hud() {
	const x = hud_canvas.width / 2 + 0.5
	const y = hud_canvas.height / 2 + 0.5
	const size = 10
	hud_context.strokeStyle = '#ffff00'
	hud_context.lineWidth = 4
	
	hud_context.beginPath()
	hud_context.moveTo(x - size, y)
	hud_context.lineTo(x + size, y)
	hud_context.moveTo(x, y - size)
	hud_context.lineTo(x, y + size)
	hud_context.stroke()
}

function update_pos(dt) {
	const d = move_speed * dt
	const theta = aim.yaw % two_pi

	const dsin = Math.sin(theta) * d
	const dcos = Math.cos(theta) * d

	if (key_states.w) {
		camera.position.x -= dsin
		camera.position.z -= dcos
	}

	if (key_states.a) {
		camera.position.x -= dcos
		camera.position.z += dsin
	}

	if (key_states.s) {
		camera.position.x += dsin
		camera.position.z += dcos
	}

	if (key_states.d) {
		camera.position.x += dcos
		camera.position.z -= dsin
	}

	if (key_states.q) {
		camera.position.y += d
	}

	if (key_states.e) {
		camera.position.y -= d
	}

	// restrict movement to box
	if (camera.position.x < box.minX)
		camera.position.x = box.minX

	if (camera.position.x > box.maxX)
		camera.position.x = box.maxX

	if (camera.position.z < box.minZ)
		camera.position.z = box.minZ

	if (camera.position.z > box.maxZ)
		camera.position.z = box.maxZ
}

function resize() {
	three_canvas.width = window.innerWidth
	three_canvas.height = window.innerHeight
	hud_canvas.width = window.innerWidth
	hud_canvas.height = window.innerHeight

	camera.aspect = three_canvas.width / three_canvas.height
	camera.updateProjectionMatrix()
	renderer.setSize(three_canvas.width, three_canvas.height)
	
	renderer.render(scene, camera)
	render_hud()
}

function mouse_move(event) {
	if (!has_focus)
		return

	const dx = event.movementX || event.mozMovementX ||
		event.webkitMovementX || 0
	const dy = event.movementY || event.mozMovementY ||
		event.webkitMovementY || 0

	aim.yaw -= dx * mouse_sens
	aim.pitch -= dy * mouse_sens

	camera.quaternion.setFromEuler(new THREE.Euler(aim.pitch, aim.yaw, 0, 'YXZ'))
}

function key_down_event(event) {
	switch(event.keyCode) {
		case 87:
			key_states.w = true
			break
		case 65:
			key_states.a = true
			break
		case 83:
			key_states.s = true
			break
		case 68:
			key_states.d = true
			break
		case 81:
			key_states.q = true
			break
		case 69:
			key_states.e = true
			break
	}
}

function key_up_event(event) {
	switch(event.keyCode) {
		case 87:
			key_states.w = false
			break
		case 65:
			key_states.a = false
			break
		case 83:
			key_states.s = false
			break
		case 68:
			key_states.d = false
			break
		case 81:
			key_states.q = false
			break
		case 69:
			key_states.e = false
			break
	}
}
