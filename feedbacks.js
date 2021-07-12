exports.getFeedbacks = function (self) {
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
		description: 'This will check if the value of a control number is off (0) or on (> 0)',
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

	return feedbacks
}
