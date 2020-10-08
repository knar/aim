function rand(min, max) {
	return Math.random() * (max - min) + min
}

function dist_2d(x1, y1, x2, y2) {
	const dx = Math.abs(x1 - x2)
	const dy = Math.abs(y1 - y2)

	return Math.sqrt(dx*dx + dy+dy)
}

function dist_3d(x1, y1, z1, x2, y2, z2) {
	const dx = Math.abs(x1 - x2)
	const dy = Math.abs(y1 - y2)
	const dz = Math.abs(z1 - z2)

	return Math.sqrt(dx*dx + dy*dy + dz*dz)
}

// horzToVertFov(95, 16:9) -> 63.09
function horzToVertFov(fov, aspect) {
	const rad = fov * Math.PI/180
	return Math.atan(Math.tan(rad/2) / aspect) / Math.PI * 360
}

export { rand, dist_2d, dist_3d, horzToVertFov }