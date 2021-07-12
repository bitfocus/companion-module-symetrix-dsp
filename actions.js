exports.getActions = function (self) {
	const actions = {}

	// Flash DSP
	actions['flash_dsp'] = {
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
	}

	// Reboot DSP
	actions['reboot_dsp'] = {
		label: 'Reboot DSP',
	}

	// Get latest recalled preset
	actions['get_latest_preset'] = {
		label: 'Get Latest Preset',
	}

	// Load global preset
	actions['load_global_preset'] = {
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
	}

	// Load preset
	actions['load_preset'] = {
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
	}

	// Set a specific value to control number
	actions['set_value'] = {
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
	}

	// Change value (increase / decrease) of a control number
	actions['change_value'] = {
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
	}

	// Set value of control number to 0 or 65535
	actions['toggle_on_off'] = {
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
			{
				type: 'number',
				id: 'on_value',
				label: 'On value (min: 1 / max: 65535)',
				tooltip: `value to set when 'on' state is triggered`,
				default: 1,
				min: 1,
				max: 65535,
				range: false,
				required: true,
				width: 4,
			},
		],
	}

	return actions
}
