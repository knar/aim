export function beep() {
	const audioCtx = new AudioContext()
	const osc = audioCtx.createOscillator()
	const gain = audioCtx.createGain()

	osc.frequency.setValueAtTime(500, audioCtx.currentTime)
	gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
	gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08)
	osc.connect(gain)
	gain.connect(audioCtx.destination)
	osc.start()
	setTimeout(() => osc.stop(), 80)
}
