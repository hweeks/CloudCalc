$(function() {
	var modType = $("#mod-type-select");
	var batteryType = $(".battery-type");
	var modBatteryType = $(".mod-battery-type");
	var coilGauge = $("#coil-size-select");
	var coilTypeSelect = $("#coil-wire-select");
	var numCoilWraps = $("#coil-wraps-num");
	var numCoils = $("#coil-num");
	var wrapDiam = $("#wrap-diameter");
	var wrapDiamUnits = $("#diameter-units");
	var batteryAmps = $("#battery-amps");
	var chipModWatts = $("#chip-watts");

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

	var ohmOutput = $(".ohm-results span");
	var minOhmOutput = $(".min-ohm-results span");
	var wattOutput = $(".watt-results span");
	var voltOutput = $(".volt-results span");
	var ohmWarningOutput = $(".ohm-warning");

	var finalArea, finalWireType, finalLength, finalOhms, finalWatts, finalMinOhms, finalVolts, finalDiam, batNum=1; 

	//Almost classes, lol
	var mechMod = new function () {
		this.setVariables = function(inputArray, outputArray, variablesArray){
			this.inputs = inputArray;
			this.outputs = outputArray;
			this.variables = variablesArray;
		}

		this.mechInfo = function(){
			this.getWatts();
			this.getMinOhms();
			this.outputs.wattOutput.text("");
			this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100)+"&#x2126;";
			this.outputs.minOhmOutput.text("");
			this.outputs.minOhmOutput.text(Math.round(this.variables.finalMinOhms * 100) / 100)+"&#x2126;";
		}
		
		this.getWatts = function() {
			this.variables.finalWatts = this.inputs.batteryAmps.val()*3.7*parseFloat(this.variables.batNum);
		}

		this.getLength = function() {
			var coilWraps = parseFloat(this.inputs.coilGauge.val())+parseFloat(this.variables.finalDiam);
			var coilLength = (coilWraps*Math.PI)*parseFloat(this.inputs.numCoilWraps.val());
			this.finalLength = (((coilLength + 10)/1000));	
		}

		this.getArea = function() {
			var radius = parseFloat(this.inputs.coilGauge.val() / 2);
			this.variables.finalArea = (Math.PI*radius*radius);
		}

		this.getMinOhms = function() {
			this.variables.finalMinOhms = (3.7*parseFloat(this.variables.batNum))/this.inputs.batteryAmps.val();
		}

		this.getOhms = function (){
			var resistance = 1/((this.inputs.coilTypeSelect.val()*this.finalLength)/this.finalArea);
			var resRecip = resistance* this.inputs.numCoils.val();
			this.variables.finalOhms = eval(1/resRecip);
			this.checkSafety();
		}

		this.checkSafety = function() {
			if (this.variables.finalOhms < this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.text("");
				this.outputs.ohmWarningOutput.text("You will cause the battery to vent if you do this, which is bad.");
			}
			if (this.variables.finalOhms > this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.text("");
			}
		}

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

		this.getVolts = function() {
			this.variables.finalVolts = Math.sqrt(this.inputs.batteryAmps.val()*this.variables.finalOhms);
			if (this.variables.finalVolts > 4.2) {
				this.variables.finalVolts = 4.2
				this.variables.finalWatts = (4.2*4.2)/this.variables.finalOhms;
				this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100)+"&#x2126;";
			}
		}
	}

	var chipMod = new function () {
		this.setVariables = function(inputArray, outputArray, variablesArray){
			this.inputs = inputArray;
			this.outputs = outputArray;
			this.variables = variablesArray;
		}
		
		this.getWatts = function() {
			this.variables.finalWatts = this.inputs.chipModWatts.val();
			this.outputs.wattOutput.text(this.variables.finalWatts);
		}

		this.getLength = function() {
			var coilWraps = parseFloat(this.inputs.coilGauge.val())+parseFloat(this.variables.finalDiam);
			var coilLength = (coilWraps*Math.PI)*parseFloat(this.inputs.numCoilWraps.val());
			this.finalLength = (((coilLength + 10)/1000));	
		}

		this.getArea = function() {
			var radius = parseFloat(this.inputs.coilGauge.val() / 2);
			this.variables.finalArea = (Math.PI*radius*radius);
		}

		this.getMinOhms = function() {
			this.variables.finalMinOhms = (3.7*parseFloat(this.variables.batNum))/this.inputs.batteryAmps.val();
		}

		this.getOhms = function() {
			var resistance = 1/((this.inputs.coilTypeSelect.val()*this.finalLength)/this.finalArea);
			var resRecip = resistance* this.inputs.numCoils.val();
			this.variables.finalOhms = eval(1/resRecip);
			this.checkSafety();
		}

		this.checkSafety = function() {
			if (this.variables.finalOhms < this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.text("");
				this.outputs.ohmWarningOutput.text("You will cause the battery to vent if you do this, which is bad.");
			}
			if (this.variables.finalOhms > this.variables.finalMinOhms) {
				this.outputs.ohmWarningOutput.text("");
			}
		}

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

		this.getVolts = function() {
			this.variables.finalVolts = Math.sqrt(this.inputs.batteryAmps.val()*this.variables.finalOhms);
			if (this.variables.finalVolts > 4.2) {
				this.variables.finalVolts = 4.2
				this.variables.finalWatts = (4.2*4.2)/this.variables.finalOhms;
				this.outputs.wattOutput.text(Math.round(this.variables.finalWatts * 100) / 100)+"&#x2126;";
			}
		}
	}

	modType.change( function(){
		if (modType.val() === "m1" || modType.val() === "m2") {
			batteryType.removeClass("hidden");
			modBatteryType.addClass("hidden");
			batNum = 1;
			if (modType.val() === "m2") {
				batNum = 2;
			}
			if (batteryAmps.val() != null) {
				setMechInfo();
				checkSafety();
			}
			batteryType.removeClass("hidden");
			ohmWarningOutput.removeClass("hidden");
			finalVolts = 3.7;
			mechMod.setVariables(inputArray, outputArray, valueArray);
		}
		if (modType.val() === "chip") {
			modBatteryType.removeClass("hidden");
			batteryType.addClass("hidden");
			batNum = 1;
			ohmWarningOutput.addClass("hidden");
			chipMod.setVariables(inputArray, outputArray, valueArray);
		}
	});

	chipModWatts.keyup(function(){
		chipMod.getWatts();
	});

	coilGauge.change(function(){
		getArea(coilGauge.val());
	});

	batteryAmps.change(function(){
		//setMechInfo();
	});
	
	$( "button" ).click(function(e) {
		e.preventDefault();
		mechMod.setVariables(inputArray, outputArray, valueArray);
		chipMod.setVariables(inputArray, outputArray, valueArray);
		mechMod.mechInfo();
		
		getFinalDiameter();
		getLength(numCoilWraps.val(), coilGauge.val(), finalDiam);
		getOhms(coilTypeSelect.val(), finalArea, finalLength, numCoils.val());
		ohmOutput.text("");
		ohmOutput.text(Math.round(finalOhms * 100) / 100)+"&#x2126;";
		getVolts();
		voltOutput.text("");
		voltOutput.text(Math.round(finalVolts * 100) / 100)+"&#x2126;";
	});
});