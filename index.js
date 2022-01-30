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
	let foundControlNumberVariable = self.variables.some(function (variable) {
		return variable.name === `control_number_${control_number}`
	})

	// If control number has no variable yet, create one
	if (!foundControlNumberVariable) {
		// Binary
		self.variables.push({
			name: `control_number_${control_number}`,
			label: `Control Number ${control_number}`,
		})

		// dB values
		self.variables.push({
			name: `control_number_${control_number}_db`,
			label: `Control Number ${control_number} dB`,
		})

		// %
		self.variables.push({
			name: `control_number_${control_number}_perc`,
			label: `Control Number ${control_number} %`,
		})

		self.setVariableDefinitions(self.variables)
	}

	// Set binary state and variable
	self.states[`control_number_${control_number}`] = control_value
	self.setVariable(`control_number_${control_number}`, control_value)

	// Set % state and variable
	const precentage = Number(100 * (self.states[`control_number_${control_number}`] / 65535)).toFixed(1)

	self.states[`control_number_${control_number}_perc`] = precentage
	self.setVariable(`control_number_${control_number}_perc`, `${precentage}%`)

	// Set dB state and variable
	// Only works with faders set to default scale -72 and +12
	const db = Number(-72 + 84 * (self.states[`control_number_${control_number}`] / 65535))

	// Check if dB is >= 0, add +
	// Check if dB <= -72, Off
	// Shorter version could be: ${db >= 0 ? `+${db} dB` : db <= -72 ? 'Off' : `${db} dB`}
	let dbText

	if (db >= 0) dbText = `+${db.toFixed(1)} dB`
	else if (db <= -72) dbText = 'Off'
	else dbText = `${db.toFixed(1)} dB`

	self.states[`control_number_${control_number}_db`] = db
	self.setVariable(`control_number_${control_number}_db`, dbText)

	// Trigger on/off feedback
	self.checkFeedbacks('on_off_value')
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
			name: 'connected',
			label: 'Companion connected to DSP (boolean)',
		},
		{
			name: 'last_preset',
			label: 'Last recalled preset',
		},
	]

	self.setPresetDefinitions(presets.getPresets(self))
	self.setFeedbackDefinitions(feedbacks.getFeedbacks(self))

	self.setVariableDefinitions(self.variables)

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

		self.states['connected'] = self.tcp.connected
		self.setVariable('connected', self.tcp.connected)
		self.checkFeedbacks('connected')
	})

	// Catch connect
	self.tcp.on('connect', function () {
		self.status(self.STATUS_OK)

		self.debug('Connected to DSP')
		self.log('info', 'Connected to Control TCP.')

		self.states['connected'] = self.tcp.connected
		self.setVariable('connected', self.tcp.connected)
		self.checkFeedbacks('connected')

		// Get Last recalled preset (GRP)
		self.tcp.send('$e GPR\r\n')

		// Get states for all push enabled controllers (GPU)
		self.tcp.send('$e GPU\r\n')
	})

	// Catch incomming data from TCP connection
	self.tcp.on('data', function (data) {
		const message = data.toString('utf-8').trim()

		if (message === 'ACK') return

		// Check if data is from a 'push enabled' control number
		const pushdata = message.match(/#([0-9]+)=([0-9]+)/g)

		if (pushdata) {
			pushdata.forEach(function (line) {
				const command = line.match(/#([0-9]+)=([0-9]+)/)

				if (!command) return

				const controlNumber = Number(command[1])
				const controlValue = Number(command[2])

				self.setControlNumberVariable(controlNumber, controlValue)
			})
		}

		// Check if data is initial from push enabled control numbers
		const initialControlValues = message.match(/{GS(?:\s([0-9]+))}\s([0-9]+)/g)

		if (initialControlValues) {
			initialControlValues.forEach(function (matches) {
				const command = matches.match(/{GS(?:\s([0-9]+))}\s([0-9]+)/)

				if (!command) return

				const controlNumber = Number(command[1])
				const controlValue = Number(command[2])

				self.setControlNumberVariable(controlNumber, controlValue)
			})
		}

		// Check if data is from a set command used in combo with $e (LP, LPG)
		if (/{([A-Z]+)\s([0-9]+)}\sACK/.test(message)) {
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

		// Check if data is from a get command used in combo with $e (GPR, GPU)
		else if (/{([A-Z]+)(?:\s([0-9]+))?}\s([a-zA-Z0-9]+)/.test(message)) {
			const command = message.match(/{([A-Z]+)(?:\s([0-9\r]+))?}\s([a-zA-Z0-9]+)/)

			switch (command[1]) {
				case 'GPR':
					self.states['last_preset'] = Number(command[3])
					self.setVariable('last_preset', self.states['last_preset'])
					break

				case 'GPU':
					// Loop through all Push enabled controllers and get their values.
					command.input
						.slice(6)
						.split('\r')
						.forEach(function (c) {
							self.tcp.send(`$e GS ${Number(c)}\r\n`)
						})
					break

				default:
					break
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

	self.states['connected'] = self.tcp.connected
	self.setVariable('connected', self.tcp.connected)
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

	if (feedback.type === `on_off_value`) {
		if (self.states[`control_number_${feedback.options.control_number}`] > 0) {
			return true
		}
	}

	return false
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
