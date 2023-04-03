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
        type: "number",
        id: "amout_flashes",
        label: "Flashes",
        tooltip: "Amount the unit will flash",
        default: 4,
        min: 1,
        max: 20,
        range: false,
        required: true,
        width: 4,
      },
    ],
    callback: (action) => {
      sendTCP(`FU ${action.options.amout_flashes}`);
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
        type: "number",
        id: "preset_number",
        label: "Preset number",
        tooltip: "Number of preset",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
        required: true,
        width: 4,
      },
    ],
    callback: (action) => {
      sendTCP(`$e LPG ${action.options.preset_number}`);
    },
  };

  // Load preset
  actions["load_preset"] = {
    name: "Load Preset",
    options: [
      {
        type: "number",
        id: "preset_number",
        label: "Preset number",
        tooltip: "Number of preset",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
        required: true,
        width: 4,
      },
    ],
    callback: (action) => {
      sendTCP(`$e LP ${action.options.preset_number}`);
    },
  };

  // Set a specific value to control number
  actions["set_value"] = {
    name: "Set Value",
    options: [
      {
        type: "number",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
        required: true,
        width: 4,
      },
      {
        type: "number",
        id: "control_value",
        label: "Control value (min: 0 / max: 65535)",
        tooltip: "Value of control (min: 0 / max: 65535)",
        default: 1,
        min: 0,
        max: 65535,
        range: false,
        required: true,
        width: 4,
      },
    ],
    callback: (action) => {
      sendTCP(
        `$e CS ${action.options.control_number} ${action.options.control_value}`
      );
    },
  };

  // Change value (increase / decrease) of a control number
  actions["change_value"] = {
    name: "Change Value",
    options: [
      {
        type: "number",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
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
        type: "number",
        id: "control_value",
        label: "Control value (min: 0 / max: 65535)",
        tooltip: "Value of control (min: 0 / max: 65535)",
        default: 1,
        min: 0,
        max: 65535,
        range: false,
        required: true,
        width: 2,
      },
    ],
    callback: (action) => {
      sendTCP(
        `$e CC ${action.options.control_number} ${action.options.change_type} ${action.options.control_value}`
      );
    },
  };

  // Set value of control number to 0 or 65535
  actions["toggle_on_off"] = {
    name: "On / Off",
    options: [
      {
        type: "number",
        id: "control_number",
        label: "Control number",
        tooltip: "Number of control",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
        required: true,
        width: 4,
      },
      {
        type: "number",
        id: "on_value",
        label: "On value (min: 1 / max: 65535)",
        tooltip: `value to set when 'on' state is triggered`,
        default: 1,
        min: 1,
        max: 65535,
        range: false,
        required: true,
        width: 4,
      },
    ],
    callback: (action) => {
      if (
        self.states[`control_number_${action.options.control_number}`] === 0
      ) {
        sendTCP(
          `CS ${action.options.control_number} ${action.options.on_value}`
        );
      } else {
        sendTCP(`CS ${action.options.control_number} ${0}`);
      }
    },
  };

  return actions;
};
