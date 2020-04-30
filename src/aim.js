import * as three from './three.module.js'
import { have_pointer_lock, activate_pointer_lock, is_pointer_locked } from './pointer_lock.js'
import { gen_target_mesh, gen_wall_mesh, gen_floor_mesh } from './mesh_generators.js'
import { default_config } from './default_config.js'

let rafID
let three_canvas
let renderer
let scene
let camera
let raycaster
let has_focus
let hud_canvas
let hud_context
let last_time

const aim = {
	yaw: 0,
	pitch: 0,
}

const key_states = {
	w: false,
	a: false,
	s: false,
	d: false,
	q: false,
	e: false,
}

const targets = []

const two_pi = Math.PI * 2
const wall_w = 100
const wall_h = 200
const wall_d = 200
const t_box = {
	minX: -wall_w + 10,
	maxX: wall_w - 10,
	minY: 10,
	maxY: wall_h - 10,
	minZ: -wall_d + 10,
	maxZ: -wall_d + 10,
}
const box = {
	minX: -wall_w,
	maxX: wall_w,
	minZ: -30,
	maxZ: 10,
}

const last_target_pos = { x: 0, y: 1/2 * wall_h, z: (t_box.minZ + t_box.maxZ) / 2 }

let start_time
let time_left
let hits
let shots_fired

let frame_times = []
let fps = 0
let last_hud_render_time = 0

let config = default_config

export function init_aim() {
	canvas_setup()
	set_event_listeners()
	resize()
	reset_game_vars()
	start_loop()
}

export function reset_aim() {
	stop_loop()
	canvas_setup()
	resize()
	reset_game_vars()
	start_loop()
}

export function update_config(new_config) {
	config = new_config	
}

function canvas_setup() {
	three_canvas = document.getElementById("three_canvas")
	three_canvas.width = window.innerWidth
	three_canvas.height = window.innerHeight

	// camera
	const aspect = three_canvas.width / three_canvas.height
	camera = new three.PerspectiveCamera(horzToVertFov(config.fov, aspect), aspect, 0.1, 3000)

	camera.position.y = wall_h / 2
	camera.position.z = -7
	camera.quaternion.setFromEuler(new three.Euler(aim.pitch, aim.yaw, 0, 'YXZ'))

	// renderer
	renderer = new three.WebGLRenderer({ canvas: three_canvas, antialias: true })
	renderer.setSize(three_canvas.width, three_canvas.height)

	renderer.gammaOutput = true;
	renderer.gammaFactor = 2;

	renderer.shadowMap.enabled = false

	// scene setup
	scene = new three.Scene()
	//scene.background = new three.Color(0x1c2227)
	scene.background = new three.Color(0x000)

	scene.add(gen_floor_mesh({wall_w, wall_h, wall_d}))
	scene.add(gen_wall_mesh({wall_w, wall_h, wall_d}))

	const ambient = new three.AmbientLight(0xffffff, 0.2);
	scene.add(ambient);

	const light = new three.SpotLight( 0xffffff, 1.0, 0, Math.PI / 8, 0.5, 2)
	light.target.position.set(0, wall_h / 2, -wall_d)
	
	light.position.set(-3/4 * wall_w , wall_h * 4, wall_d * 2)
	light.castShadow = true
	light.shadow.camera.near = 500
	light.shadow.camera.far = 1000
	light.shadow.mapSize.width = 4096
	light.shadow.mapSize.height = 4096
	scene.add(light)
	scene.add(light.target)

	// hud stuff
	hud_canvas = document.getElementById("hud_canvas")
	hud_context = hud_canvas.getContext("2d")

	// add targets
	targets = []
	for (let i = 0; i < config.num_targets; i++)
		spawn_target()

	// raycaster
	raycaster = new three.Raycaster()
}

function set_event_listeners() {
	window.addEventListener('resize', resize)

	document.addEventListener('mousemove', mouse_move)

	three_canvas.addEventListener('mousedown', (event) => {
		if (!has_focus && have_pointer_lock()) {
			reset_game_vars()
			activate_pointer_lock(three_canvas)
		}
			
		if (has_focus && event.button == 0)
			shoot()
	})

	document.addEventListener('pointerlockchange', () => {
		has_focus = is_pointer_locked(three_canvas)
	})

	document.addEventListener('keydown', key_down_event)
	document.addEventListener('keyup', key_up_event)
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

function reset_game_vars() {
	start_time = Date.now()
	hits = 0
	shots_fired = 0
}

function start_loop() {
	if (!rafID) {
		rafID = requestAnimationFrame(loop)
	}
}

function stop_loop() {
	if (rafID) {
		cancelAnimationFrame(rafID)
		rafID = undefined
	}
}

function loop(time) {
	rafID = null
	start_loop()
	
	time_left = config.duration * 1000 - (Date.now() - start_time)
	if (time_left < 0) {
		stop_loop()
		render_hud()
		document.exitPointerLock();
		return
	}

	const dt = time - last_time
	// if (dt < (1000 / config.frame_rate_limit)) {
	// 	console.log(dt)
	// 	return
	// }
	last_time = time
	
	update_pos(dt)

	raycaster.setFromCamera(new three.Vector2(0, 0), camera)

	renderer.render(scene, camera)

	const now = ~~(performance.now())
	while (frame_times.length > 0 && frame_times[0] <= now - 1000) {
		frame_times.shift()
	}
	frame_times.push(now)
	fps = frame_times.length
	
	if (now - last_hud_render_time > 100) {
		render_hud()
		last_hud_render_time = now
	}
}

function shoot() {
	const intersects = raycaster.intersectObjects(targets.map(({ mesh }) => mesh))
	shots_fired++

	if (!intersects.length)
		return
	
	for (let i = 0; i < targets.length; i++) {
		if (targets[i].mesh == intersects[0].object) {
			scene.remove(targets[i].mesh)
			targets.splice(i, 1)
			spawn_target()
			hits++
			break
		}
	}
}

function spawn_target() {
	if (targets.length >= config.num_targets)
		return

	let x, y, z
	switch (config.spawn_type) {
		case 'relative_xy_radius':
			do {
				const dist = rand(config.relative_min_distance, config.relative_max_distance)
				const theta = rand(0, two_pi)
				x = last_target_pos.x + dist * Math.cos(theta)
				y = last_target_pos.y + dist * Math.sin(theta)
				z = last_target_pos.z
			}
			while (!within_box(x, y, z, t_box.minX, t_box.minY, t_box.minZ, t_box.maxX, t_box.maxY, t_box.maxZ) || overlaps_targets(x, y, z))
			break
		default:
			do {
				x = rand(t_box.minX, t_box.maxX)
				y = rand(t_box.minY, t_box.maxY)
				z = rand(t_box.minZ, t_box.maxZ)
			}
			while (overlaps_targets(x, y, z))
	}
	const mesh = gen_target_mesh({ x, y, z })
	const t = { x, y, z, mesh }
	last_target_pos = { x: x, y: y, z: z }
	targets.push(t)
	scene.add(t.mesh)
}

function overlaps_targets(x, y, z) {
	for (const t of targets) {
		if (dist_3d(x, y, z, t.x, t.y, t.z) < 2 * config.target_radius)
			return true
	}
	return false
}

// whether or not the point {x1, y1, z1} is within the box
// formed by corners {x2, y2, z2} and {x3, y3, z3}
// edge inclusive
function within_box(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
	if (x2 > x3)
		[x2, x3] = [x3, x2]
	if (y2 > y3)
		[y2, y3] = [y3, y2]
	if (z2 > z3)
		[z2, z3] = [z3, z2]
	// TODO: swapperoo
	if (x1 < x2 || y1 < y2 || z1 < z2 || x1 > x3 || y1 > y3 || z1 > z3)
		return false
	return true
}

function render_hud() {
	// clear
	hud_context.clearRect(0, 0, hud_canvas.width, hud_canvas.height)

	// dot crosshair
	// const x = hud_canvas.width / 2
	// const y = hud_canvas.height / 2
	// const radius = 2.5
	// hud_context.fillStyle = '#ffff00'
	// hud_context.beginPath()
	// hud_context.arc(x, y, radius, 0, 2*Math.PI)
	// hud_context.fill()

	// + crosshair
	const x = hud_canvas.width / 2
	const y = hud_canvas.height / 2
	const size = 6
	hud_context.strokeStyle = '#ffff00'
	hud_context.lineWidth = 2
	
	hud_context.beginPath()
	hud_context.moveTo(x - size, y)
	hud_context.lineTo(x + size, y)
	hud_context.moveTo(x, y - size)
	hud_context.lineTo(x, y + size)
	hud_context.stroke()

	// timer and score
	hud_context.font = '30px Monospace'
	hud_context.fillStyle = '#ffffff'
	let time = (time_left / 1000).toFixed(1)
	let acc = parseFloat(hits * 100 / shots_fired).toFixed(1)
	let hits_per_second = (hits / (config.duration - time_left / 1000)).toFixed(2)
	let effective_score = (hits * acc / 100).toFixed(1)
	hud_context.fillText('Hits: ' + hits + ' | H/s: ' + hits_per_second + ' | Acc: ' + acc + '% | Eff: ' + effective_score + ' | Time: ' + time + ' | FPS: ' + fps, 10, 30)
}

function mouse_move(event) {
	if (!has_focus)
		return

	const dx = event.movementX || event.mozMovementX ||
		event.webkitMovementX || 0
	const dy = event.movementY || event.mozMovementY ||
		event.webkitMovementY || 0

	const dpr = config.cm_per_rev * (config.dpi / 2.54)
	const sens = (Math.PI*2) / dpr
	aim.yaw -= dx * sens
	aim.pitch -= dy * sens

	camera.quaternion.setFromEuler(new three.Euler(aim.pitch, aim.yaw, 0, 'YXZ'))
}

function update_pos(dt) {
	const d = config.move_speed * dt
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
	/**
	// restrict movement to box
	if (camera.position.x < box.minX)
		camera.position.x = box.minX

	if (camera.position.x > box.maxX)
		camera.position.x = box.maxX

	if (camera.position.z < box.minZ)
		camera.position.z = box.minZ

	if (camera.position.z > box.maxZ)
		camera.position.z = box.maxZ
	*/
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

// horzToVertFov(95, 16:9) -> 63.09
function horzToVertFov(fov, aspect) {
	const rad = fov * Math.PI/180
	return Math.atan(Math.tan(rad/2) / aspect) / Math.PI * 360
}
