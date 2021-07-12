## TODO's: 

- Reconnect button: This allows you to manually reconnect to the DSP when connection is not established.
- Add a **NOP** (No Operation) command interval to check if connection is still healty. _(This command will make no adjustments to the DSP, but send an **ACK** if a healthy connection is active.)_

- Calculate control values in the control_value feedback in % _(Right now only binary and dB's are working)_
- Improve dB's in control_value feedback. Right now it will always assume a fader has a range of -72 and +12. This can be changed in Composer, so a input field defining the rage could do the trick?!

- On TCP connection, get the current values of all pushable contol numbers _(Right now, #N/A will be displayed until a change is made to the control number)_
- Optimization: Add an early return when received data is **ACK\r\n** _(This will prevent all the RegExes from being executed for no reason)_
