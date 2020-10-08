function have_pointer_lock() {
	return 'pointerLockElement' in document ||
		'mozPointerLockElement' in document ||
		'webkitPointerLockElement' in document
}

function activate_pointer_lock(canvas) {
	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock ||
		canvas.webkitRequestPointerLock
	canvas.requestPointerLock()
}

function is_pointer_locked(canvas) {
	return document.pointerLockElement === canvas
}

export { have_pointer_lock, activate_pointer_lock, is_pointer_locked }
