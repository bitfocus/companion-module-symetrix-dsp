const { combineRgb } = require("@companion-module/base");

exports.getPresets = function (self) {
  const presets = {};

  // Flash the DSP
  presets["flash_dsp"] = {
    type: "button",
    category: "General",
    name: "Flash DSP",
    style: {
      text: "Flash\\nDSP",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "flash_dsp",
            options: {
              amout_flashes: 4,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Flash the DSP
  presets["load_preset"] = {
    type: "button",
    category: "Setup",
    name: "Load Preset",
    style: {
      text: "Load\\nPreset",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "load_preset",
            options: {
              preset_number: 1,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  presets["load_global_preset"] = {
    type: "button",
    category: "Setup",
    name: "Load Global Preset",
    style: {
      text: "Load\\nGlobal\\nPreset",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "load_global_preset",
            options: {
              preset_number: 1,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Reboot DSP
  presets["reboot_dsp"] = {
    type: "button",
    category: "General",
    name: "Reboot DSP",
    style: {
      text: "Reboot\\nDSP",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "reboot_dsp",
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Push to talk implementation
  presets["push_to_talk"] = {
    type: "button",
    category: "Change Values",
    name: "PTT",
    style: {
      text: "PTT",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "set_value",
            options: {
              control_number: 1,
              control_value: 65535,
            },
          },
        ],
        up: [
          {
            actionId: "set_value",
            delay: 100,
            options: {
              control_number: 1,
              control_value: 0,
            },
          },
        ],
      },
    ],
    feedbacks: [
      {
        feedbackId: "on_off_value",
        style: {
          bgcolor: combineRgb(255, 0, 0),
          color: combineRgb(255, 255, 255),
        },
        options: {
          control_number: 1,
        },
      },
      {
        type: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Toggle between 0 or 65535
  presets["toggle_on_off"] = {
    type: "button",
    category: "Change Values",
    name: "Toggle",
    style: {
      text: "Toggle",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "toggle_on_off",
            options: {
              control_number: 1,
              on_value: 65535,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "on_off_value",
        style: {
          bgcolor: combineRgb(255, 0, 0),
          color: combineRgb(255, 255, 255),
        },
        options: {
          control_number: 1,
        },
      },
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Set to 0 dB
  presets["set_0db"] = {
    type: "button",
    category: "Change Values",
    name: "0 dB",
    style: {
      text: "0 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "set_value",
            options: {
              control_number: 1,
              control_value: 56175,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add +1 dB
  presets["add_1db"] = {
    type: "button",
    category: "Change Values",
    name: "+1 dB",
    style: {
      text: "+1 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 1,
              control_value: 780,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add +2 dB
  presets["add_2db"] = {
    type: "button",
    category: "Change Values",
    name: "+2 dB",
    style: {
      text: "+2 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    actions: [
      {
        action: "change_value",
        options: {
          control_number: 1,
          change_type: 1,
          control_value: 1560,
        },
      },
    ],
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 1,
              control_value: 1560,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add +3 dB
  presets["add_3db"] = {
    type: "button",
    category: "Change Values",
    name: "+3 dB",
    style: {
      text: "+3 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 1,
              control_value: 2340,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add -1 dB
  presets["sub_1db"] = {
    type: "button",
    category: "Change Values",
    name: "-1 dB",
    style: {
      text: "-1 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 0,
              control_value: 780,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add -2 dB
  presets["sub_2db"] = {
    type: "button",
    category: "Change Values",
    name: "-2 dB",
    style: {
      text: "-2 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 0,
              control_value: 1560,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Add -3 dB
  presets["sub_3db"] = {
    type: "button",
    category: "Change Values",
    name: "-3 dB",
    style: {
      text: "-3 dB",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: 0,
    },
    steps: [
      {
        down: [
          {
            actionId: "change_value",
            options: {
              control_number: 1,
              change_type: 0,
              control_value: 2340,
            },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Display if DSP is connected
  presets["connected"] = {
    type: "button",
    category: "Info",
    name: "Connected",
    style: {
      text: "Connected\\nto DSP",
      size: "7",
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(255, 0, 0),
    },
    steps: [],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          bgcolor: combineRgb(0, 204, 0),
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  // Display info about last recalled preset
  presets["last_preset"] = {
    type: "button",
    category: "Info",
    name: "Last Preset",
    style: {
      text: "Last\\nPreset:\\n#$(symetrix:last_preset)",
      size: "18",
      color: combineRgb(130, 130, 130),
      bgcolor: combineRgb(30, 30, 30),
    },
    steps: [],
    feedbacks: [
      {
        feedbackId: "connected",
        style: {
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  };

  return presets;
};
