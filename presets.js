exports.getPresets = function (self) {
	const presets = []

	// Flash the DSP
	presets.push({
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
	})

	// Flash the DSP
	presets.push({
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
	})

	presets.push({
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
	})

	// Reboot DSP
	presets.push({
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
	})

	// Push to talk implementation
	presets.push({
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
	})

	// Toggle between 0 or 65535
	presets.push({
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
					on_value: 65535,
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
	})

	// Set to 0 dB
	presets.push({
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
	})

	// Add +1 dB
	presets.push({
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
	})

	// Add +2 dB
	presets.push({
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
	})

	// Add +3 dB
	presets.push({
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
	})

	// Add -1 dB
	presets.push({
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
	})

	// Add -2 dB
	presets.push({
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
	})

	// Add -3 dB
	presets.push({
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
	})

	// Display if DSP is connected
	presets.push({
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
	})

	// Display info about last recalled preset
	presets.push({
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
	})

	return presets
}
