import * as three from 'three'

function gen_target_mesh({ x, y, z }, config) {
	let geo = new three.SphereGeometry(config.target_radius, 32, 32)
	let mat = new three.MeshStandardMaterial({
		color: 0x0c6ae4, roughness: 0.8, metalness: 0.2 })
	let m = new three.Mesh(geo, mat)
	m.position.x = x
	m.position.y = y
	m.position.z = z
	m.castShadow = true
	
	return m
}

function gen_wall_mesh({wall_w, wall_h, wall_d}) {
	let geo = new three.Geometry()

	geo.vertices.push(
		new three.Vector3(-wall_w, 0, -wall_d),
		new three.Vector3(-wall_w, wall_h, -wall_d),
		new three.Vector3(-wall_w, wall_h, 0),
		new three.Vector3(-wall_w, 0, 0),
		new three.Vector3(wall_w, 0, -wall_d),
		new three.Vector3(wall_w, wall_h, -wall_d),
		new three.Vector3(wall_w, wall_h, 0),
		new three.Vector3(wall_w, 0, 0),
	)

	geo.faces.push(
		// left wall
		new three.Face3(0, 1, 2),
		new three.Face3(2, 3, 0),

		// right wall
		new three.Face3(7, 6, 5),
		new three.Face3(5, 4, 7),
		
		// back wall
		new three.Face3(0, 4, 5),
		new three.Face3(5, 1, 0),
	)

	geo.computeFaceNormals()

	const mat = new three.MeshPhongMaterial({ color: 0x101820 })

	const m = new three.Mesh(geo, mat)
	m.receiveShadow = true
	return m
}

function gen_floor_mesh({wall_w, wall_h, wall_d}) {
	let geo = new three.Geometry()

	geo.vertices.push(
		new three.Vector3(-wall_w, 0, -wall_d),
		new three.Vector3(-wall_w, 0, 0),
		new three.Vector3(wall_w, 0, -wall_d),
		new three.Vector3(wall_w, 0, 0),
	)

	geo.faces.push(
		new three.Face3(0, 1, 2),
		new three.Face3(2, 1, 3),
	)

	geo.computeFaceNormals()

	const mat = new three.MeshStandardMaterial({ color: 0x121a22 })

	const m = new three.Mesh(geo, mat)
	m.receiveShadow = true
	return m
}

export { gen_target_mesh, gen_wall_mesh, gen_floor_mesh }
