exports.getActions = function (self) {
  const actions = {};

  const sendTCP = (cmd) => {
    if (cmd !== undefined && self.tcp !== undefined && self.tcp.isConnected) {
	  self.log("debug", `Sending command: ${cmd}`);
      self.tcp.send(`${cmd}\r\n`);
    } else {
      self.log("debug", "TCP not connected to DSP");
    }
  };

  // Flash DSP
  actions["flash_dsp"] = {
    name: "Flash DSP",
    options: [
      {
        type: "textinput",
        id: "amout_flashes",
        label: "Flashes",
        tooltip: "Amount the unit will flash (1-20), supports variables",
        default: "4",
        useVariables: true,
        required: true,
        width: 4,
      },
    ],
    callback: async (action) => {
      const flashes = parseInt(await self.parseVariablesInString(action.options.amout_flashes));
      sendTCP(`FU ${flashes}`);
    },
  };

  // Reboot DSP
  actions["reboot_dsp"] = {
    name: "Reboot DSP",
    options: [],
    callback: (action) => {
      sendTCP(`R!`);
    },
  };

  // Get latest recalled preset
  actions["get_latest_preset"] = {
    name: "Get Latest Preset",
    options: [],
    callback: (action) => {
      sendTCP("$e GPR");
    },
  };

  // Load global preset
  actions["load_global_preset"] = {
    name: "Load Global Preset",
    options: [
      {
        type: "textinput",
        id: "preset_number",
        label: "Preset number",
        tooltip: "Number of preset (1-1000), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
    ],
    callback: async (action) => {
      const preset = parseInt(await self.parseVariablesInString(action.options.preset_number));
      sendTCP(`$e LPG ${preset}`);
    },
  };

  // Load preset
  actions["load_preset"] = {
    name: "Load Preset",
    options: [
      {
        type: "textinput",
        id: "preset_number",
        label: "Preset number",
        tooltip: "Number of preset (1-1000), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
    ],
    callback: async (action) => {
      const preset = parseInt(await self.parseVariablesInString(action.options.preset_number));
      sendTCP(`$e LP ${preset}`);
    },
  };

  // Set a specific value to control number
  actions["set_value"] = {
    name: "Set Value",
    options: [
      {
        type: "textinput",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control (1-1000), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
      {
        type: "textinput",
        id: "control_value",
        label: "Control value (min: 0 / max: 65535)",
        tooltip: "Value of control (0-65535), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
    ],
    callback: async (action) => {
      const controlNumber = parseInt(await self.parseVariablesInString(action.options.control_number));
      const controlValue = parseInt(await self.parseVariablesInString(action.options.control_value));
      sendTCP(`$e CS ${controlNumber} ${controlValue}`);
    },
  };

  // Change value (increase / decrease) of a control number
  actions["change_value"] = {
    name: "Change Value",
    options: [
      {
        type: "textinput",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control (1-1000), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 2,
      },
      {
        type: "dropdown",
        id: "change_type",
        label: "Inc / Dec",
        default: "1",
        tooltip: "Increase or Decrease",
        choices: [
          { id: "1", label: "Increase" },
          { id: "0", label: "Decrease" },
        ],
        required: true,
        width: 2,
      },
      {
        type: "textinput",
        id: "control_value",
        label: "Control value (min: 0 / max: 65535)",
        tooltip: "Value of control (0-65535), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 2,
      },
    ],
    callback: async (action) => {
      const controlNumber = parseInt(await self.parseVariablesInString(action.options.control_number));
      const controlValue = parseInt(await self.parseVariablesInString(action.options.control_value));
      sendTCP(`$e CC ${controlNumber} ${action.options.change_type} ${controlValue}`);
    },
  };

  // Set value of control number to 0 or 65535
  actions["toggle_on_off"] = {
    name: "On / Off",
    options: [
      {
        type: "textinput",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control (1-1000), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
      {
        type: "textinput",
        id: "on_value",
        label: "On value (min: 1 / max: 65535)",
        tooltip: "Value to set when 'on' state is triggered (1-65535), supports variables",
        default: "1",
        useVariables: true,
        required: true,
        width: 4,
      },
    ],
    callback: async (action) => {
      const controlNumber = parseInt(await self.parseVariablesInString(action.options.control_number));
      const onValue = parseInt(await self.parseVariablesInString(action.options.on_value));
      if (self.states[`control_number_${controlNumber}`] === 0) {
        sendTCP(`CS ${controlNumber} ${onValue}`);
      } else {
        sendTCP(`CS ${controlNumber} ${0}`);
      }
    },
  };

  return actions;
};
