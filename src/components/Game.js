import React, { useState, useEffect } from 'react'
import './game.css'
import ConfigMenu from './ConfigMenu'
import { init_aim, update_config, reset_aim } from '../aim.js'
import { default_config } from '../default_config.js'

function Game() {
	const [config, setConfig] = useState(default_config)
	
	useEffect(() => {
		init_aim()
	}, [])

	useEffect(() => {
	 	update_config(config)
	}, [config])
	
	useEffect(() => {
		const keyListener = (event) => {
			if (event.key == 'r') {
				reset_aim()
			}
		}
		document.addEventListener('keydown', keyListener)
		return (() => {
			document.removeEventListener('keydown', keyListener)
		})
	})

	return (
		<>
			<canvas id="three_canvas"></canvas>
			<canvas id="hud_canvas"></canvas>
			<ConfigMenu 
				config={ config }
				setConfig={ setConfig }
			/>
		</>
	)
}

export default Game
