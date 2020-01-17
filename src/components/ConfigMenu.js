import React, {useState, useEffect} from 'react'
import './configmenu.css'

function ConfigMenu({config, setConfig}) {
	const [showConfigMenu, setShowConfigMenu] = useState(false)

	useEffect(() => {
		const keyListener = (event) => {
			if (event.key == 'c') {
				setShowConfigMenu(!showConfigMenu)
			}
		}
		document.addEventListener('keydown', keyListener)
		return (() => {
			document.removeEventListener('keydown', keyListener)
		})
	})

	const handleCmPerRevChange = (event) => {
		setConfig({...config, cm_per_rev: event.target.value})
	}

	const handleDpiChange = (event) => {
		setConfig({...config, dpi: event.target.value})
	}
	
	const handleFovChange = (event) => {
		setConfig({...config, fov: event.target.value})
	}
	
	const handleNumTargetsChange = (event) => {
		setConfig({...config, num_targets: event.target.value})
	}
	const handleTargetRadiusChange = (event) => {
		setConfig({...config, target_radius: event.target.value})
	}
	const handleDurationChange = (event) => {
		setConfig({...config, duration: event.target.value})
	}

	const renderConfigMenu = () => {
		return (
			<div className="config-menu">
				<h3>Feel</h3>
				<div className="config-entry">
					<label>CM/Rev:</label>
					<input
						type="number"
						value={config.cm_per_rev}
						onChange={handleCmPerRevChange}
						step="0.01"
					/>
				</div>
				<div className="config-entry">
					<label>DPI:</label>
					<input
						type="number"
						value={config.dpi}
						onChange={handleDpiChange}
						step="1"
					/>
				</div>
				<div className="config-entry">
					<label>FOV:</label>
					<input
						type="number"
						value={config.fov}
						onChange={handleFovChange}
						step="0.01"
					/>
				</div>
				<h3>Game Setup</h3>
				<div className="config-entry">
					<label>Targets:</label>
					<input
						type="number"
						value={config.num_targets}
						onChange={handleNumTargetsChange}
						step="1"
					/>
				</div>
				<div className="config-entry">
					<label>Radius:</label>
					<input
						type="number"
						value={config.target_radius}
						onChange={handleTargetRadiusChange}
						step="1"
					/>
				</div>
				<div className="config-entry">
					<label>Time:</label>
					<input
						type="number"
						value={config.duration}
						onChange={handleDurationChange}
						step="1"
					/>
				</div>
				<h3>yayya</h3>
			</div>
		)
	}

	return (
		<>
			{showConfigMenu ? renderConfigMenu() : null}
		</>
	)
}

export default ConfigMenu
