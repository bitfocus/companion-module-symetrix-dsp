exports.getFeedbacks = function (self) {
	const feedbacks = {}

	feedbacks['connected'] = {
		type: 'boolean',
		label: 'Connected to DSP',
		description: 'If Companion is connected to DSP, change the style of the button',
		style: {
			color: self.rgb(255, 255, 255),
			bgcolor: self.rgb(0, 204, 0),
		},
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
