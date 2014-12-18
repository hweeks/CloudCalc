$(function() {
	var inputArray ={
		 modType : $("#mod-type-select"),
		 batteryType : $(".battery-type"),
		 modBatteryType : $(".mod-battery-type"),
		 coilGauge : $("#coil-size-select"),
		 coilTypeSelect : $("#coil-wire-select"),
		 numCoilWraps : $("#coil-wraps-num"),
		 numCoils : $("#coil-num"),
		 wrapDiam : $("#wrap-diameter"),
		 wrapDiamUnits : $("#diameter-units"),
		 batteryAmps : $("#battery-amps"),
		 chipModWatts : $("#chip-watts")
	};

	var outputArray = {
		ohmOutput : $(".ohm-results span"),
		minOhmOutput : $(".min-ohm-results span"),
		wattOutput : $(".watt-results span"),
		voltOutput : $(".volt-results span"),
		ohmWarningOutput : $(".ohm-warning")
	};

	var valueArray = {
		finalArea : 0,
		finalWireType : 0,
		finalLength : 0,
		finalOhms : 0,
		finalWatts : 0,
		finalMinOhms : 0,
		finalVolts : 0,
		finalDiam : 0,
		batNum : 1
	};

	//Almost classes, lol
	var mechMod = new function () {
		// This pulls in all set variables
		this.setVariables = function(inputArray, outputArray, variablesArray){
			this.inputs = inputArray;
			this.outputs = outputArray;
			this.variables = variablesArray;
		}

		// This adds the information about maximum potential for the batteries output
		this.mechInfo = function(){
			this.getWatts();
			this.getMinOhms();
			this.outputs.wattOutput.text("");
			this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100);
			this.outputs.minOhmOutput.text("");
			this.outputs.minOhmOutput.text(Math.round(this.variables.finalMinOhms * 100) / 100);
		}

		// This calculates the wattage of the battery based around it's max Amps
		// Output is in watts		
		this.getWatts = function() {
			this.variables.finalWatts = this.inputs.batteryAmps.val()*3.7*parseFloat(this.variables.batNum);
		}
		
		// This bit parses the wrap diameter input, allowing fractions, decimals, or integers.
		// The output is in millimeters.
		this.getFinalDiameter = function() {
			if (this.inputs.wrapDiamUnits.val() === "mm") {
				this.variables.finalDiam = this.inputs.wrapDiam.val();
			}
			if (this.inputs.wrapDiamUnits.val() === "in") {
				var inches = this.inputs.wrapDiam.val();
				if(inches.match(".*[/\\\\].*") != null){
					var inchesFrac = inches.match(/\d+/g);
					this.variables.finalDiam = (inchesFrac[0]/inchesFrac[1])*25.4;
				}
				if(inches.match(".*[/\\\\].*") === null){
					this.variables.finalDiam = inches*25.4;
				}
			}
		}
		
		// This accounts for the width of the wire around your wrapping diameter to calculate the legth.
		// We then add 10mm to account for the wire connecting to the actual pole in your atomizer.
		// The output is in meters.
		this.getLength = function() {
			this.getFinalDiameter();
			var coilWraps = parseFloat(this.inputs.coilGauge.val())+parseFloat(this.variables.finalDiam);
			var coilLength = (coilWraps*Math.PI)*parseFloat(this.inputs.numCoilWraps.val());
			this.variables.finalLength = (((coilLength + 10)/1000));	
		}
	
		// This gets the cross-sectional area of the wire only.
		// The output is in mm.
		this.getArea = function() {
			var radius = parseFloat(this.inputs.coilGauge.val() / 2);
			this.variables.finalArea = (Math.PI*radius*radius);
		}
		
		// This calculates the minimum ohm that won't cause a battery to vent
		// The output is in Ohms
		this.getMinOhms = function() {
			this.variables.finalMinOhms = (3.7*parseFloat(this.variables.batNum))/this.inputs.batteryAmps.val();
		}

		// This calculates the actual resistance of the wire. 
		// Units for coilType are mm^2 / m
		// As you add coils, resistance is calculated by 1/R = 1/R1 + 1/R2 + ...
		// The output is in Ohms
		this.getOhms = function (){
			this.getArea();
			this.getLength();
			var resistance = 1/((this.inputs.coilTypeSelect.val()*this.variables.finalLength)/this.variables.finalArea);
			var resRecip = resistance* this.inputs.numCoils.val();
			this.variables.finalOhms = 1/resRecip;
			this.checkSafety();
		}

		// This calulates the volts based on watts and ohms
		// If the volts go over 4.2 it recalculates to stay within battery limits
		// The output is in volts
		this.getVolts = function() {
			this.getOhms();
			this.variables.finalVolts = Math.sqrt(this.inputs.batteryAmps.val()*this.variables.finalOhms);
			if (this.variables.finalVolts > 4.2) {
				this.variables.finalWatts = (4.2*4.2)/this.variables.finalOhms;
				this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100);
				this.wattRecalc();
			}
		}

		// This calculates wattage based on volts and ohms
		// The output is in watts
		this.wattRecalc = function() {
			this.variables.finalWatts = (this.variables.finalVolts*this.variables.finalVolts)/this.variables.finalOhms;
		}

		// This calculates the lowest Ohm coil that battery can take and errors out if that is violated
		// There is no output
		this.checkSafety = function() {
			if (this.variables.finalOhms < this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.removeClass("hidden");
			}
			if (this.variables.finalOhms > this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.addClass("hidden");
			}
		}

		// This forces calculation of the entire variable/class then sets values
		// There is no output.
		this.setValues = function() {
			this.getVolts();
			this.outputs.ohmOutput.text("");
			this.outputs.voltOutput.text("");
			this.outputs.wattOutput.text("");
			this.outputs.ohmOutput.text(Math.round(this.variables.finalOhms * 100) / 100);
			this.outputs.voltOutput.text(Math.round(this.variables.finalVolts * 100) / 100);
			this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100);
			this.outputs.minOhmOutput.text(Math.round(this.variables.finalMinOhms * 100) / 100);
		}
	}

	var chipMod = new function () {

		// This sets the variables for this function. It's fed by the modType.val()
		this.setVariables = function(inputArray, outputArray, variablesArray){
			this.inputs = inputArray;
			this.outputs = outputArray;
			this.variables = variablesArray;
		}
		
		// With a CHIP mod the Wattage is set by the user, so it's just a atraight copy over
		this.getWatts = function() {
			this.variables.finalWatts = this.inputs.chipModWatts.val();
			this.outputs.wattOutput.text(this.variables.finalWatts);
		}
		
		// This bit parses the wrap diameter input, allowing fractions, decimals, or integers.
		// The output is in millimeters.
		this.getFinalDiameter = function() {
			if (this.inputs.wrapDiamUnits.val() === "mm") {
				this.variables.finalDiam = wrapDiam.val();
			}
			if (this.inputs.wrapDiamUnits.val() === "in") {
				var inches = this.inputs.wrapDiam.val();
				if(inches.match(".*[/\\\\].*") != null){
					var inchesFrac = inches.match(/\d+/g);
					this.variables.finalDiam = (inchesFrac[0]/inchesFrac[1])*25.4;
				}
				if(inches.match(".*[/\\\\].*") === null){
					this.variables.finalDiam = inches*25.4;
				}
			}
		}

		// This accounts for the width of the wire around your wrapping diameter to calculate the legth.
		// We then add 10mm to account for the wire connecting to the actual pole in your atomizer.
		// The output is in meters.
		this.getLength = function() {
			this.getFinalDiameter();
			var coilWraps = parseFloat(this.inputs.coilGauge.val())+parseFloat(this.variables.finalDiam);
			var coilLength = (coilWraps*Math.PI)*parseFloat(this.inputs.numCoilWraps.val());
			this.variables.finalLength = (((coilLength + 10)/1000));	
		}
		
		// This gets the cross-sectional area of the wire only.
		// The output is in mm.
		this.getArea = function() {
			var radius = parseFloat(this.inputs.coilGauge.val() / 2);
			this.variables.finalArea = (Math.PI*radius*radius);
		}

		// This calculates the actual resistance of the wire. 
		// Units for coilType are mm^2 / m
		// As you add coils, resistance is calculated by 1/R = 1/R1 + 1/R2 + ...
		// The output is in Ohms
		this.getOhms = function() {
			this.getArea();
			this.getLength();
			var resistance = 1/((this.inputs.coilTypeSelect.val()*this.variables.finalLength)/this.variables.finalArea);
			var resRecip = resistance* this.inputs.numCoils.val();
			this.variables.finalOhms = 1/resRecip;
		}		

		// This calulates the volts based on watts and ohms
		// The output is in volts
		this.getVolts = function() {
			this.getOhms();
			this.variables.finalVolts = Math.sqrt(this.variables.finalWatts *this.variables.finalOhms);
		}

		// This forces calculation of the entire variable/class then sets values
		// There is no output.
		this.setValues = function() {
			this.getVolts();
			this.outputs.ohmOutput.text("");
			this.outputs.voltOutput.text("");
			this.outputs.wattOutput.text("");
			this.outputs.ohmWarningOutput.text("");
			this.outputs.ohmOutput.text(Math.round(this.variables.finalOhms * 100) / 100);
			this.outputs.voltOutput.text(Math.round(this.variables.finalVolts * 100) / 100);
			this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100);
			this.outputs.minOhmOutput.text("Any");
		}
	}

	inputArray.modType.change( function(){
		if (inputArray.modType.val() === "m1" || inputArray.modType.val() === "m2") {
			inputArray.batteryType.removeClass("hidden");
			inputArray.modBatteryType.addClass("hidden");
			valueArray.batNum = 1;
			if (inputArray.modType.val() === "m2") {
				valueArray.batNum = 2;
			}
			inputArray.batteryType.removeClass("hidden");
			valueArray.finalVolts = 3.7;
			mechMod.setVariables(inputArray, outputArray, valueArray);
		}
		if (inputArray.modType.val() === "chip") {
			inputArray.modBatteryType.removeClass("hidden");
			inputArray.batteryType.addClass("hidden");
			valueArray.batNum = 1;
			chipMod.setVariables(inputArray, outputArray, valueArray);
		}
	});

	inputArray.batteryType.change(function() {
		mechMod.mechInfo();
	});

	inputArray.chipModWatts.keyup(function(){
		chipMod.getWatts();
	});
	
	$( "button" ).click(function(e) {
		e.preventDefault();
		if (inputArray.modType.val() === "m1" || inputArray.modType.val() === "m2") {
			mechMod.setValues();
		}
		if (inputArray.modType.val() === "chip") {
			chipMod.setValues();
		}

	});
});