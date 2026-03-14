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
        type: "textinput",
        label: "Control Number",
        id: "control_number",
        default: "1",
        useVariables: true,
        required: true,
      },
    ],
    callback: async (feedback) => {
      const controlNumber = parseInt(await self.parseVariablesInString(feedback.options.control_number));
      if (self.states[`control_number_${controlNumber}`] > 0) {
        return true;
      } else {
	    return false;
	  }
    },
  };

  return feedbacks;
};
