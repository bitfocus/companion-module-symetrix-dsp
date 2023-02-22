const { combineRgb } = require("@companion-module/base");

exports.getFeedbacks = function (self) {
  const feedbacks = {};

  feedbacks["connected"] = {
    type: "boolean",
    name: "Connected to DSP",
    description:
      "If Companion is connected to DSP, change the style of the button",
    style: {
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 204, 0),
    },
    options: [],
    callback: (feedback) => {
      if (self.tcp.isConnected === true) {
        return true;
      } else {
		return false;
	  }
    },
  };

  feedbacks["on_off_value"] = {
    type: "boolean",
    name: "On / Off",
    description:
      "This will check if the value of a control number is off (0) or on (> 0)",
    style: {
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 204, 0),
    },
    options: [
      {
        type: "number",
        label: "Control Number",
        id: "control_number",
        default: 1,
        min: 1,
        max: 1000,
        range: false,
        required: true,
      },
    ],
    callback: (feedback) => {
      if (
        self.states[`control_number_${feedback.options.control_number}`] > 0
      ) {
        return true;
      } else {
		return false;
	  }
    },
  };

  return feedbacks;
};
