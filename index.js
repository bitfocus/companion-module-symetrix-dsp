const {
  InstanceBase,
  Regex,
  runEntrypoint,
  TCPHelper,
} = require("@companion-module/base");

const presets = require("./presets");
const actions = require("./actions");
const feedbacks = require("./feedbacks");

class SymetrixDSPInstance extends InstanceBase {
  constructor(internal) {
    super(internal);
  }

  /**
   * Initialize the module.
   * Called once when the system is ready for the module to start.
   * @param {Object} config - user configuration items
   * @since 1.0.0
   */
  async init(config) {
    let self = this;

    self.config = config;

    self.states = {};
    self.feedbacks = {};

    self.variables = [
      {
        variableId: "connected",
        name: "Companion connected to DSP (boolean)",
      },
      {
        variableId: "last_preset",
        name: "Last recalled preset",
      },
    ];

    self.setPresetDefinitions(presets.getPresets(self));
    self.setFeedbackDefinitions(feedbacks.getFeedbacks(self));
    self.setActionDefinitions(actions.getActions(self));

    self.setVariableDefinitions(self.variables);

    self.disable = false;

    self.updateStatus("connecting");

	self.log("info", `Connecting to Control TCP. Host: ${self.config.host} Port: ${self.config.port}`);
    // Setup new TCP connection from ../../tcp by Companion core developers.
    self.tcp = new TCPHelper(
      self.config.host ? self.config.host : "127.0.0.1",
      self.config.port ? self.config.port : "48631"
    );

    // Catch status change
    self.tcp.on("status_change", function (status, message) {
      self.updateStatus(status, message);
    });

    // Catch error
    self.tcp.on("error", function (error) {
      self.updateStatus("error", error);

      self.states["connected"] = self.tcp.isConnected;
      self.setVariableValues({ connected: self.tcp.isConnected });
      self.checkFeedbacks("connected");
    });

    // Catch connect
    self.tcp.on("connect", function () {
      self.updateStatus("ok");

      self.log("info", "Connected to Control TCP.");

      self.states["connected"] = self.tcp.isConnected;
      self.setVariableValues({ connected: self.tcp.isConnected });
      self.checkFeedbacks("connected");

      // Get Last recalled preset (GRP)
      self.tcp.send("$e GPR\r\n");

      // Get states for all push enabled controllers (GPU)
      self.tcp.send("$e GPU\r\n");
    });

    // Catch incomming data from TCP connection
    self.tcp.on("data", function (data) {
      const message = data.toString("utf-8").trim();
	  self.log("info", `Received data: ${message}`);
      if (message === "ACK") return;

      // Check if data is from a 'push enabled' control number
      const pushdata = message.match(/#([0-9]+)=([0-9]+)/g);

      if (pushdata) {
        pushdata.forEach(function (line) {
          const command = line.match(/#([0-9]+)=([0-9]+)/);

          if (!command) return;

          const controlNumber = Number(command[1]);
          const controlValue = Number(command[2]);

          self.setControlNumberVariable(controlNumber, controlValue);
        });
      }

      // Check if data is initial from push enabled control numbers
      const initialControlValues = message.match(
        /{GS(?:\s([0-9]+))}\s([0-9]+)/g
      );

      if (initialControlValues) {
        initialControlValues.forEach(function (matches) {
          const command = matches.match(/{GS(?:\s([0-9]+))}\s([0-9]+)/);

          if (!command) return;

          const controlNumber = Number(command[1]);
          const controlValue = Number(command[2]);

          self.setControlNumberVariable(controlNumber, controlValue);
        });
      }

      // Check if data is from a set command used in combo with $e (LP, LPG)
      if (/{([A-Z]+)\s([0-9]+)}\sACK/.test(message)) {
        const command = message.match(/{([A-Z]+)\s([0-9]+)}\sACK/);

        switch (command[1]) {
          case "LP":
            self.states["last_preset"] = Number(command[2]);
            self.setVariableValues({ last_preset: self.states["last_preset"] });
            break;

          case "LPG":
            self.states["last_preset"] = Number(command[2]);
            self.setVariableValues({ last_preset: self.states["last_preset"] });
            break;

          default:
            break;
        }
      }

      // Check if data is from a get command used in combo with $e (GPR, GPU)
      else if (/{([A-Z]+)(?:\s([0-9]+))?}\s([a-zA-Z0-9]+)/.test(message)) {
        const command = message.match(
          /{([A-Z]+)(?:\s([0-9\r]+))?}\s([a-zA-Z0-9]+)/
        );

        switch (command[1]) {
          case "GPR":
            self.states["last_preset"] = Number(command[3]);
            self.setVariableValues({ last_preset: self.states["last_preset"] });
            break;

          case "GPU":
            // Loop through all Push enabled controllers and get their values.
            command.input
              .slice(6)
              .split("\r")
              .forEach(function (c) {
                self.tcp.send(`$e GS ${Number(c)}\r\n`);
              });
            break;

          default:
            break;
        }
      }
    });
  }

  /**
   * Cleanup module before being disabled or closed
   * @since 1.0.0
   */
  async destroy() {
    let self = this;

    self.states = {};
    self.feedbacks = {};
    self.variables = [];

    if (self.tcp !== undefined) {
      self.tcp.destroy();
    }

    self.disable = true;

    self.states["connected"] = self.tcp.isConnected;
    self.setVariableValues({ connected: self.tcp.isConnected });
    self.checkFeedbacks("connected");

    log("debug", `destroy ${self.id}`);
  }

  /**
   * Called when 'Apply changes' is pressed on the module 'config' tab
   * @param {Object} config - updated user configuration items
   * @since 1.0.0
   */
  async configUpdated(config) {
    let self = this;

    self.config = config;

    self.log("debug", "Updating configuration.");

    if (self.tcp !== undefined) {
      self.tcp.destroy();
      delete self.tcp;
    }

    self.init();
  }

  /**
   * Define the items that are user configurable.
   * Return them to companion.
   * @since 1.0.0
   */
  getConfigFields() {
    let self = this;

    return [
      {
        type: "static-text",
        id: "info",
        label: "Information",
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
        type: "textinput",
        id: "host",
        label: "Target IP",
        width: 8,
        default: "",
        required: true,
        regex: Regex.IP,
      },
      {
        type: "textinput",
        id: "port",
        label: "Target Port",
        width: 4,
        default: 48631,
        required: true,
        regex: Regex.PORT,
      },
    ];
  }

  /**
   * Create a new instance of class ip-serial
   * @param {Number} control_number - number of control number
   * @param {Number} control_value - value of control number
   * @since 1.0.2
   */
  setControlNumberVariable(control_number, control_value) {
    let self = this;

    // Check if variables already has been declared for specific control number
    let foundControlNumberVariable = self.variables.some(function (variable) {
      return variable.name === `control_number_${control_number}`;
    });

    // If control number has no variable yet, create one
    if (!foundControlNumberVariable) {
      // Binary
      self.variables.push({
        variableId: `control_number_${control_number}`,
        name: `Control Number ${control_number}`,
      });

      // dB values
      self.variables.push({
        variableId: `control_number_${control_number}_db`,
        name: `Control Number ${control_number} dB`,
      });

      // %
      self.variables.push({
        variableId: `control_number_${control_number}_perc`,
        name: `Control Number ${control_number} %`,
      });

      self.setVariableDefinitions(self.variables);
    }

    // Set binary state and variable
    self.states[`control_number_${control_number}`] = control_value;

    // Set % state and variable
    const percentage = Number(
      100 * (self.states[`control_number_${control_number}`] / 65535)
    ).toFixed(1);

    self.states[`control_number_${control_number}_perc`] = percentage;

    // Set dB state and variable
    // Only works with faders set to default scale -72 and +12
    const db = Number(
      -72 + 84 * (self.states[`control_number_${control_number}`] / 65535)
    );

    // Check if dB is >= 0, add +
    // Check if dB <= -72, Off
    // Shorter version could be: ${db >= 0 ? `+${db} dB` : db <= -72 ? 'Off' : `${db} dB`}
    let dbText;

    if (db >= 0) dbText = `+${db.toFixed(1)} dB`;
    else if (db <= -72) dbText = "Off";
    else dbText = `${db.toFixed(1)} dB`;

    self.states[`control_number_${control_number}_db`] = db;
    self.setVariableValues({
      [`control_number_${control_number}`]: control_value,
      [`control_number_${control_number}_perc`]: `${percentage}%`,
      [`control_number_${control_number}_db`]: dbText,
    });

    // Trigger on/off feedback
    self.checkFeedbacks("on_off_value");
  }
}

runEntrypoint(SymetrixDSPInstance, []);
