const instance_skel = require('../../instance_skel')
const tcp = require('../../tcp')

const presets = require('./presets')
const actions = require('./actions')
const feedbacks = require('./feedbacks')

let debug
let log

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
 * @param {Number} control_number - number of control number
 * @param {Number} control_value - value of control number
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
	self.feedbacks = {}
	self.variables = [
		{
			name: 'last_preset',
			label: 'Last recalled preset',
		},
	]

	self.initPresets()
	self.initVariables()
	self.initFeedbacks()

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

		self.checkFeedbacks('connected')
	})

	// Catch connect
	self.tcp.on('connect', async function () {
		self.status(self.STATUS_OK)

		self.debug('Connected to DSP')
		self.log('info', 'Connected to Control TCP.')

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
					<a href="https://github.com/bitfocus/companion-module-symetrix-dsp/issues/new" target="_new" class="btn btn-success">Create a new issue</a>
					<a href="https://github.com/bitfocus/companion-module-symetrix-dsp/issues" target="_new" class="btn btn-warning mr-1">See current issues</a><br>
					<br>
					Keep in mind that all actions, feedbacks and variables are subjected to change when this module is futher developed.<br>
					This could mean existing buttons in your setup won't work after an update!<br>
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

	self.disable = true

	self.checkFeedbacks('connected')

	debug('destroy', self.id)
}

/**
 * Define the actions for Companion
 * @since 1.0.0
 */
instance.prototype.actions = function () {
	let self = this

	self.setActions(actions.getActions(self))
}

/**
 * Action function
 * @since 1.0.0
 */
instance.prototype.action = function (action) {
	let self = this

	let cmd

	if (action.action == 'reconnect') {
		self.log('warn', 'Reconnecting to TCP.')
		self.init()
		return
	}

	if (!self.tcp || !self.tcp.connected) {
		self.log('warn', 'Unable to perform action, connection lost to TCP')
		self.init()
		return
	}

	switch (action.action) {
		case 'flash_dsp':
			cmd = `FU ${action.options.amout_flashes}`
			break

		case 'set_value':
			cmd = `CS ${action.options.control_number} ${action.options.control_value}`
			break

		case 'change_value':
			cmd = `CC ${action.options.control_number} ${action.options.change_type} ${action.options.control_value}`
			break

		case 'toggle_on_off':
			if (self.states[`control_number_${action.options.control_number}`] === 0) {
				cmd = `CS ${action.options.control_number} ${action.options.on_value}`
				break
			} else {
				cmd = `CS ${action.options.control_number} ${0}`
				break
			}

		case 'load_preset':
			cmd = `$e LP ${action.options.preset_number}`
			break

		case 'load_global_preset':
			cmd = `$e LPG ${action.options.preset_number}`
			break

		case 'get_latest_preset':
			cmd = '$e GPR'
			break

		case 'reboot_dsp':
			cmd = `R!`
			break
	}

	if (cmd !== undefined && self.tcp !== undefined && self.tcp.connected) {
		self.tcp.send(`${cmd}\r\n`)
	} else {
		debug('TCP not connected to DSP')
	}
}

/**
 * Define the feedbacks for Companion
 * @since 1.0.0
 */
instance.prototype.initFeedbacks = function () {
	let self = this

	self.setFeedbackDefinitions(feedbacks.getFeedbacks(self))
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
		if (self.tcp.connected === true) {
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

					const db = Number(-72 + 84 * (self.states[`control_number_${feedback.options.control_number}`] / 65535))

					// Check if dB is >= 0, add +
					// Check if dB <= -72, Off
					// Shorter version could be: ${db >= 0 ? `+${db} dB` : db <= -72 ? 'Off' : `${db} dB`}
					let dbText

					if (db >= 0) dbText = `+${db.toFixed(1)} dB`
					else if (db <= -72) dbText = 'Off'
					else dbText = `${db.toFixed(1)} dB`

					return {
						text: `${feedback.options.button_text ? `${feedback.options.button_text}\\n` : ''}${dbText}`,
					}

				case '%':
					const precentage = Number(
						100 * (self.states[`control_number_${feedback.options.control_number}`] / 65535)
					).toFixed(1)

					return {
						text: `${feedback.options.button_text ? feedback.options.button_text : ''}\\n${precentage}%`,
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
 * Define the dynamic variables for Companion
 * @since 1.0.0
 */
instance.prototype.initVariables = function () {
	let self = this

	self.setVariableDefinitions(self.variables)
}

/**
 * Define the preset buttons for Companion
 * @since 1.0.0
 */
instance.prototype.initPresets = function () {
	let self = this

	self.setPresetDefinitions(presets.getPresets(self))
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
