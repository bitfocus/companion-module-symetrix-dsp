const instance_skel = require('../../instance_skel')
const tcp = require('../../tcp')

let debug
let log

/**
 * Dynamic list of variables
 * @since 1.0.2
 */
instance.prototype.variables = [
	{
		name: 'connected',
		label: 'Companion connected to DSP (boolean)',
	},
	{
		name: 'last_preset',
		label: 'Last recalled preset',
	},
]

/**
 * Create a new instance of class ip-serial
 * @param {EventEmitter} system - event processor/scheduler
 * @param {String} id - unique identifier of this instance
 * @param {Object} config -	configuration items saved by Companion
 * @since 1.0.0
 */
function instance(system, id, config) {
	let self = this

	// super-constructor
	instance_skel.apply(this, arguments)

	self.actions()

	return self
}

instance.GetUpgradeScripts = function () {
	return [
		instance_skel.CreateConvertToBooleanFeedbackUpgradeScript({
			connected: true,
		}),
	]
}

/**
 * Called when 'Apply changes' is pressed on the module 'config' tab
 * @param {Object} config - updated user configuration items
 * @since 1.0.0
 */
instance.prototype.updateConfig = function (config) {
	let self = this

	self.config = config

	self.log('debug', 'Updating configuration.')

	if (self.tcp !== undefined) {
		self.tcp.destroy()
		delete self.tcp
	}

	self.init()
}

/**
 * Create a new instance of class ip-serial
 * @param {String} control_number - event processor/scheduler
 * @param {String} control_value - unique identifier of this instance
 * @since 1.0.2
 */
instance.prototype.setControlNumberVariable = function (control_number, control_value) {
	let self = this

	// Check if variables already has been declared for specific control number
	let foundControlNumberVariable = false

	// Loop through existing variables to find the control number
	for (let i = 0; i < self.variables.length; i++) {
		if (self.variables[i].name === `control_number_${control_number}`) {
			foundControlNumberVariable = true
			break
		}
	}

	// If control number has no variable yet, create one
	if (!foundControlNumberVariable) {
		self.variables.push({
			name: `control_number_${control_number}`,
			label: `Control Number #${control_number}`,
		})

		self.setVariableDefinitions(self.variables)
	}

	// Set state and variable
	self.states[`control_number_${control_number}`] = control_value
	self.setVariable(`control_number_${control_number}`, control_value)

	// Trigger on/off and control_value feedback
	self.checkFeedbacks('on_off_value')
	self.checkFeedbacks('control_value')
}

/**
 * Initialize the module.
 * Called once when the system is ready for the module to start.
 * @since 1.0.0
 */
instance.prototype.init = function () {
	let self = this

	self.states = {}

	self.init_presets()
	self.init_variables()
	self.init_feedbacks()

	self.disable = false

	self.status(self.STATUS_WARNING, 'Connecting')

	// Setup new TCP connection from ../../tcp by Companion core developers.
	self.tcp = new tcp(
		self.config.host !== '' ? self.config.host : '127.0.0.1',
		self.config.port !== '' ? self.config.port : '48631'
	)

	// Catch status change
	self.tcp.on('status_change', function (status, message) {
		self.status(status, message)
	})

	// Catch error
	self.tcp.on('error', function (error) {
		self.status(self.STATUS_ERROR)
		self.log('error', error)
	})

	// Catch connect
	self.tcp.on('connect', async function () {
		self.status(self.STATUS_OK)

		self.debug('Connected to DSP')
		self.log('info', 'Connected to Control TCP.')

		self.states['connected'] = true
		self.setVariable('connected', self.states['connected'])
		self.checkFeedbacks('connected')

		// Get Last recalled preset (GRP)
		self.tcp.send('$e GPR\r\n')

		// Get states for all push enabled controllers (GPU)
		self.tcp.send('$v GPU\r\n')
	})

	// Catch incomming data from TCP connection
	self.tcp.on('data', function (data) {
		const message = data.toString('utf8').trim()

		if (message === 'ACK') return

		// Check if data is from a 'push enabled' control number
		if (/\#([0-9]+)\=([0-9]+)/.test(message)) {
			const command = message.match(/\#([0-9]+)\=([0-9]+)/)

			self.setControlNumberVariable(Number(command[1]), Number(command[2]))
		}

		// Check if data is from a set command used in combo with $e (LP, LPG)
		else if (/{([A-Z]+)\s([0-9]+)}\sACK/.test(message)) {
			const command = message.match(/{([A-Z]+)\s([0-9]+)}\sACK/)

			switch (command[1]) {
				case 'LP':
					self.states['last_preset'] = Number(command[2])
					self.setVariable('last_preset', self.states['last_preset'])
					break

				case 'LPG':
					self.states['last_preset'] = Number(command[2])
					self.setVariable('last_preset', self.states['last_preset'])
					break

				default:
					break
			}
		}

		// Check if data is from a get command used in combo with $e (GPR)
		else if (/{([A-Z]+)(?:\s([0-9]+))?}\s([a-zA-Z0-9]+)/.test(message)) {
			const command = message.match(/{([A-Z]+)(?:\s([0-9]+))?}\s([a-zA-Z0-9]+)/)

			switch (command[1]) {
				case 'GPR':
					self.states['last_preset'] = Number(command[3])
					self.setVariable('last_preset', self.states['last_preset'])
					break

				case 'GS':
					self.setControlNumberVariable(Number(command[2]), Number(command[3]))
					break

				default:
					break
			}
		}

		// Check if data is from the GPU command to get all push enabled controllers
		else if (message.includes('controllers in range 1 to 10000 enabled for push')) {
			const pushEnabledControlNumbers = message
				.split('\r\n')
				.slice(1, -1)
				.map(function (number) {
					return number.trim()
				})

			// Loop through all Push enabled controllers and get their values.
			for (let i = 0; i < pushEnabledControlNumbers.length; i++) {
				// Adding a small delay between TCP commands
				setTimeout(function timer() {
					self.tcp.send(`$e GS ${pushEnabledControlNumbers[i]}\r\n`)
				}, i * 50)
			}
		}
	})

	debug = self.debug
	log = self.log
}

/**
 * Define the items that are user configurable.
 * Return them to companion.
 * @since 1.0.0
 */
instance.prototype.config_fields = function () {
	let self = this

	return [
		{
			type: 'text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: `
				<div class="alert alert-info">
					<strong>Please read and understand the following before using this module</strong><br>
					<br>
					The Symetrix DSP module is based on the very generic setup of <strong>Composer 8.0</strong>, and so is the module.<br>
					There can be some functionality missing or not working as expected. If so, please open an issue in the repo.<br>
					<br>
					Keep in mind that all actions, feedbacks and variables are subjected to change when this module is futher developed.<br>
					This could mean existing buttons in your setup won't work after an update!<br>
					</br>
					<a href="https://github.com/bitfocus/companion-module-symetrix-dsp/issues/new" target="_new" class="btn btn-success">Create a new issue</a>
					<a href="https://github.com/bitfocus/companion-module-symetrix-dsp/issues" target="_new" class="btn btn-warning mr-1">See current issues</a>
				</div>
			`,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 8,
			default: '',
			required: true,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 4,
			default: 48631,
			required: true,
			regex: self.REGEX_PORT,
		},
	]
}

/**
 * Cleanup module before being disabled or closed
 * @since 1.0.0
 */
instance.prototype.destroy = function () {
	let self = this

	self.states = {}
	self.feedbacks = {}
	self.variables = []

	if (self.tcp !== undefined) {
		self.tcp.destroy()
	}
}

/**
 * Define the actions for Companion
 * @since 1.0.0
 */
instance.prototype.actions = function () {
	let self = this

	self.setActions({
		flash_dsp: {
			label: 'Flash DSP',
			options: [
				{
					type: 'number',
					id: 'amout_flashes',
					label: 'Flashes',
					tooltip: 'Amount the unit will flash',
					default: 4,
					min: 1,
					max: 20,
					range: false,
					required: true,
					width: 4,
				},
			],
		},
		reboot_dsp: {
			label: 'Reboot DSP',
		},
		get_latest_preset: {
			label: 'Get Latest Preset',
		},
		load_global_preset: {
			label: 'Load Global Preset',
			options: [
				{
					type: 'number',
					id: 'preset_number',
					label: 'Preset number',
					tooltip: 'Number of preset',
					default: 1,
					min: 1,
					max: 1000,
					range: false,
					required: true,
					width: 4,
				},
			],
		},
		load_preset: {
			label: 'Load Preset',
			options: [
				{
					type: 'number',
					id: 'preset_number',
					label: 'Preset number',
					tooltip: 'Number of preset',
					default: 1,
					min: 1,
					max: 1000,
					range: false,
					required: true,
					width: 4,
				},
			],
		},
		set_value: {
			label: 'Set Value',
			options: [
				{
					type: 'number',
					id: 'control_number',
					label: 'Control number',
					tooltip: 'Number of control',
					default: 1,
					min: 1,
					max: 1000,
					range: false,
					required: true,
					width: 4,
				},
				{
					type: 'number',
					id: 'control_value',
					label: 'Control value (min: 0 / max: 65535)',
					tooltip: 'Value of control (min: 0 / max: 65535)',
					default: 1,
					min: 0,
					max: 65535,
					range: false,
					required: true,
					width: 4,
				},
			],
		},
		change_value: {
			label: 'Change Value',
			options: [
				{
					type: 'number',
					id: 'control_number',
					label: 'Control number',
					tooltip: 'Number of control',
					default: 1,
					min: 1,
					max: 1000,
					range: false,
					required: true,
					width: 2,
				},
				{
					type: 'dropdown',
					id: 'change_type',
					label: 'Inc / Dec',
					default: '1',
					tooltip: 'Increase or Decrease',
					choices: [
						{ id: '1', label: 'Increase' },
						{ id: '0', label: 'Decrease' },
					],
					required: true,
					width: 2,
				},
				{
					type: 'number',
					id: 'control_value',
					label: 'Control value (min: 0 / max: 65535)',
					tooltip: 'Value of control (min: 0 / max: 65535)',
					default: 1,
					min: 0,
					max: 65535,
					range: false,
					required: true,
					width: 2,
				},
			],
		},
		toggle_on_off: {
			label: 'On / Off',
			options: [
				{
					type: 'number',
					id: 'control_number',
					label: 'Control number',
					tooltip: 'Number of control',
					default: 1,
					min: 1,
					max: 1000,
					range: false,
					required: true,
					width: 4,
				},
			],
		},
	})
}

/**
 * Action function
 * @since 1.0.0
 */
instance.prototype.action = function (action) {
	let self = this

	if (action.action == 'reconnect') {
		self.log('warn', 'Reconnecting to TCP.')
		self.init()
		return
	}

	if (!self.tcp || !self.states['connected']) {
		self.log('warn', 'Unable to perform action, connection lost to TCP')
		self.init()
		return
	}

	switch (action.action) {
		case 'flash_dsp':
			self.tcp.send(`FU ${action.options.amout_flashes}\r\n`)
			break

		case 'set_value':
			self.tcp.send(`CS ${action.options.control_number} ${action.options.control_value}\r\n`)
			break

		case 'change_value':
			self.tcp.send(
				`CC ${action.options.control_number} ${action.options.change_type} ${action.options.control_value}\r\n`
			)
			break

		case 'toggle_on_off':
			if (self.states[`control_number_${action.options.control_number}`] === 0) {
				self.tcp.send(`CS ${action.options.control_number} ${65535}\r\n`)
			} else {
				self.tcp.send(`CS ${action.options.control_number} ${0}\r\n`)
				break
			}

			self.log('warn', `Could not get current value for control number ${action.options.control_number}`)
			break

		case 'load_preset':
			self.tcp.send(`$e LP ${action.options.preset_number}\r\n`)
			break

		case 'load_global_preset':
			self.tcp.send(`$e LPG ${action.options.preset_number}\r\n`)
			break

		case 'get_latest_preset':
			self.tcp.send('$e GPR\r\n')
			break

		case 'reboot_dsp':
			self.tcp.send(`R!\r\n`)
			break
	}
}

/**
 * Define the feedbacks for Companion
 * @since 1.0.0
 */
instance.prototype.init_feedbacks = function () {
	let self = this

	let feedbacks = {}

	feedbacks['connected'] = {
		type: 'boolean',
		label: 'Connected to DSP',
		description: 'If Companion is connected to DSP, change the style of the button',
		style: {
			color: self.rgb(255, 255, 255),
			bgcolor: self.rgb(0, 204, 0),
		},
	}

	feedbacks['control_value'] = {
		label: 'Dynamic Control Value',
		description: 'This will add a new rule underneath the button text with the current value of control number',
		options: [
			{
				type: 'textinput',
				id: 'button_text',
				label: 'Button text',
				width: 4,
				default: '',
			},
			{
				type: 'number',
				label: 'Control Number',
				id: 'control_number',
				default: 1,
				min: 1,
				max: 1000,
				range: false,
				required: true,
			},
			{
				type: 'dropdown',
				label: 'Unit type',
				id: 'unit_type',
				default: 'dB',
				choices: [
					{ id: 'bin', label: 'Binary' },
					{ id: '%', label: 'Percentage' },
					{ id: 'dB', label: "dB's" },
				],
			},
		],
	}

	feedbacks['on_off_value'] = {
		type: 'boolean',
		label: 'On / Off',
		description: 'This will check if the value of a control value is off (0) or on (> 0)',
		style: {
			color: self.rgb(255, 255, 255),
			bgcolor: self.rgb(0, 204, 0),
		},
		options: [
			{
				type: 'number',
				label: 'Control Number',
				id: 'control_number',
				default: 1,
				min: 1,
				max: 1000,
				range: false,
				required: true,
			},
		],
	}

	self.setFeedbackDefinitions(feedbacks)
}

/**
 * Feedback function
 * @since 1.0.0
 */
instance.prototype.feedback = function (feedback) {
	let self = this

	if (self.states === undefined) {
		return
	}

	if (feedback.type === 'connected') {
		if (self.states['connected'] === true) {
			return true
		}
	}

	if (feedback.type === 'on_off_value') {
		if (self.states[`control_number_${feedback.options.control_number}`] > 0) {
			return true
		}
	}

	if (feedback.type === 'control_value') {
		if (self.states[`control_number_${feedback.options.control_number}`] !== undefined) {
			switch (feedback.options.unit_type) {
				case 'dB':
					// Still need to add fader min and max values. Default to -72 and +12
					return {
						text: `${feedback.options.button_text ? feedback.options.button_text : ''}\\n${Number(
							Math.floor(-72 + 84 * (self.states[`control_number_${feedback.options.control_number}`] / 65535))
						)} dB`,
					}

				case '%':
					return {
						text: `${feedback.options.button_text ? feedback.options.button_text : ''}\\n${Number(
							100 * (self.states[`control_number_${feedback.options.control_number}`] / 65535)
						).toFixed(1)}%`,
					}

				case 'bin':
					return {
						text: `${feedback.options.button_text ? feedback.options.button_text : ''}\\n${Number(
							self.states[`control_number_${feedback.options.control_number}`]
						)}`,
					}

				default:
					break
			}
		}

		return {
			text: `${feedback.options.button_text ? feedback.options.button_text : ''}`,
		}
	}

	return false
}

/**
 * Define the preset buttons for Companion
 * @since 1.0.0
 */
instance.prototype.init_presets = function () {
	let self = this

	const presets = []

	presets.push(
		{
			category: 'General',
			label: 'Flash DSP',
			bank: {
				style: 'text',
				text: 'Flash\\nDSP',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'flash_dsp',
					options: {
						amout_flashes: 4,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Setup',
			label: 'Load Preset',
			bank: {
				style: 'text',
				text: 'Load\\nPreset',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'load_preset',
					options: {
						preset_number: 1,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Setup',
			label: 'Load Global Preset',
			bank: {
				style: 'text',
				text: 'Load\\nGlobal\\nPreset',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'load_global_preset',
					options: {
						preset_number: 1,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'General',
			label: 'Reboot DSP',
			bank: {
				style: 'text',
				text: 'Reboot\\nDSP',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'reboot_dsp',
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: 'PTT',
			bank: {
				style: 'text',
				text: 'PTT',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'set_value',
					options: {
						control_number: 1,
						control_value: 65535,
					},
				},
			],
			release_actions: [
				{
					action: 'set_value',
					options: {
						control_number: 1,
						control_value: 0,
					},
				},
			],
			feedbacks: [
				{
					type: 'on_off_value',
					style: {
						bgcolor: self.rgb(255, 0, 0),
						color: self.rgb(255, 255, 255),
					},
					options: {
						control_number: 1,
					},
				},
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: 'Toggle',
			bank: {
				style: 'text',
				text: 'Toggle',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'toggle_on_off',
					options: {
						control_number: 1,
					},
				},
			],
			release_actions: [],
			feedbacks: [
				{
					type: 'on_off_value',
					style: {
						bgcolor: self.rgb(255, 0, 0),
						color: self.rgb(255, 255, 255),
					},
					options: {
						control_number: 1,
					},
				},
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '0 dB',
			bank: {
				style: 'text',
				text: '0 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'set_value',
					options: {
						control_number: 1,
						control_value: 56175,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '+1 dB',
			bank: {
				style: 'text',
				text: '+1 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 1,
						control_value: 780,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '+2 dB',
			bank: {
				style: 'text',
				text: '+2 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 1,
						control_value: 1560,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '+3 dB',
			bank: {
				style: 'text',
				text: '+3 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 1,
						control_value: 2340,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '-1 dB',
			bank: {
				style: 'text',
				text: '-1 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 0,
						control_value: 780,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '-2 dB',
			bank: {
				style: 'text',
				text: '-2 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 0,
						control_value: 1560,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Change Values',
			label: '-3 dB',
			bank: {
				style: 'text',
				text: '-3 dB',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: 0,
				latch: false,
			},
			actions: [
				{
					action: 'change_value',
					options: {
						control_number: 1,
						change_type: 0,
						control_value: 2340,
					},
				},
			],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Info',
			label: 'Connected',
			bank: {
				style: 'text',
				text: 'Connected\\nto\\nDSP',
				size: '7',
				color: self.rgb(255, 255, 255),
				bgcolor: self.rgb(255, 0, 0),
				latch: false,
			},
			actions: [],
			release_actions: [],
			feedbacks: [
				{
					type: 'connected',
					style: {
						bgcolor: self.rgb(0, 204, 0),
						color: self.rgb(255, 255, 255),
					},
				},
			],
		},
		{
			category: 'Info',
			label: 'Last Preset',
			bank: {
				style: 'text',
				text: 'Last\\nPreset:\\n#$(symetrix:last_preset)',
				size: '18',
				color: self.rgb(130, 130, 130),
				bgcolor: self.rgb(30, 30, 30),
				latch: false,
			},
			actions: [],
			release_actions: [],
			feedbacks: [
				{
					type: 'connected',
					style: {
						color: self.rgb(255, 255, 255),
					},
				},
			],
		}
	)

	self.setPresetDefinitions(presets)
}

/**
 * Define the dynamic variables for Companion
 * @since 1.0.0
 */
instance.prototype.init_variables = function () {
	let self = this

	self.setVariableDefinitions(self.variables)
}

instance_skel.extendedBy(instance)

exports = module.exports = instance
