/**
* 
* @package Sonar.app
* @module-attributes
* @author Peter Booth <pboothe@google.com>
* @author Aaron Brown <aaronmatthewbrown@gmail.com>
* @author Craig Simons <craigsimons@sfu.ca> 
* 
* Sonar wraps the HTML5/Javascript [NDT](https://code.google.com/p/ndt/wiki/NDTProtocol) client originally developed by [M-Lab](http://www.measurementlab.net) into a more consistent and branded interface.
* 
* This application uses the following libraries:
* - [Twitter Bootstrap](http://getbootstrap.com/)
* - [jQuery](https://jquery.com/)
* - [canv-guage](https://github.com/Mikhus/canv-gauge)
* - [Raphael](http://raphaeljs.com/)
* - [morris.js](http://morrisjs.github.io/morris.js/)
* 
* Configuration and branding options can be found in the {@link Sonar.app.config} file. Module level parameters in this file should be left alone unless you really know what you are doing.
*/

/**
* @cfg {integer} PHASE_LOADING
* @constant
* The loading phase, which is the initial phase set in the global variables.
*/
var PHASE_LOADING = 0;

/**
* @cfg {integer} PHASE_WELCOME
* @constant
* Constant for when the user is on the welcome page.
*/
var PHASE_WELCOME = 1;

/**
* @cfg {integer} PHASE_PREPARING
* @constant
* Constant for when the user has begun the test, but the {@link Sonar.client.NDTjs} object is waiting for the server to begin the test.
*/
var PHASE_PREPARING = 2;

/**
* @cfg {integer} PHASE_UPLOAD
* @constant
* Constant for when the {@link Sonar.client.NDTjs} is conducting the upload portion of the test.
*/
var PHASE_UPLOAD = 3;

/**
* @cfg {integer} PHASE_UPLOAD
* @constant
* Constant for when the {@link Sonar.client.NDTjs} is conducting the download portion of the test.
*/
var PHASE_DOWNLOAD = 4;

/**
* @cfg {integer} PHASE_RESULTS
* @constant
* Constant for when the {@link Sonar.client.NDTjs} is finished testing and the results page is being show to the user.
*/
var PHASE_RESULTS = 5;

/**
* @cfg {Object} ndtClient
* The currently instantiated {@link Sonar.client.NDTjs} object, which is global to the application.
*/
var ndtClient = null;

/**
* @cfg {integer} currentPhase
* The current phase the application is in. This variable is referenced as a global variable in functions like {@link #startTest} and {@link #monitorTest}. 
* Valid states are defined as global constants (see {@link #PHASE_LOADING}, {@link #PHASE_WELCOME}, {@link #PHASE_PREPARING}, {@link #PHASE_UPLOAD}, {@link #PHASE_DOWNLOAD}, {@link #PHASE_RESULTS}).
*/
var currentPhase = PHASE_LOADING;

/**
* @cfg {string} currentServer
* The IP address/DNS name of the sonar server. This is selected by the user in the welcome page dropdown box and is taken from the address property of the {@link Sonar.app.config#serverList} item.
*/
var currentServer;

/**
* @cfg {string} speedGauge
* The initialized [HTML5 Canvas Speed Gauge component](https://github.com/Mikhus/canv-gauge).
*/
var speedGauge;

/**
* @cfg {string} resultsChart
* The initialized [morris.js](http://morrisjs.github.io/morris.js) chart component, which is used on the results page to show speed trending.
*/
var resultsChart;

/**
* @cfg {integer} gaugeUpdateInterval
* The id returned from the javascript setInterval function for gauge value updates.
*/
var gaugeUpdateInterval;

/**
* @cfg {array(float)} uploadData
* An array of upload test measurements. On each {@link #monitorTest} callback, the current reported value of the upload speed is pushed to this array. Later, in the results, this array can be analyzed for average/max/min speed as desired. This differs from the {@link Sonar.client.NDTjs} reported speed, which appears to simply be the last reported speed and not necessarily the one we wish to report.
*/
var uploadData = [];

/**
* @cfg {array(float)} downloadData
* An array of download test measurements. On each {@link #monitorTest} callback, the current reported value of the download speed is pushed to this array. Later, in the results, this array can be analyzed for average/max/min speed as desired. This differs from the {@link Sonar.client.NDTjs} reported speed, which appears to simply be the last reported speed and not necessarily the one we wish to report.
*/
var downloadData = [];

/**
 * The good ol' jQuery document.ready handler. This runs once all page elements and scripts have loaded.
 * @return {null}
 */
$(document).ready(function() {
	init();
});

/**
 * Initialize the application for one or more speed tests. This should be run in the jQuery document.ready function.
 * @return {null}
 */
function init() {
	//: Test for IE 9 or lower and bounce right away as even the gauge won't initialize.
	if (isIELessThan10()) {
		showErrorWindow('Incompatible Browser', 'You are running a version of Internet Explorer that is not supported. Please upgrade your browser or consider an alternative such as Chrome or Firefox.');
		return null;
	}

	//: Write text titles and captions as per config
	if (useDynamicText) {
		$('#header-title').html(titleText);
		$('#header-blurb').html(titleBlurb);
		$('#welcome-title').html(welcomeTitle);
		$('#welcome-blurb').html(welcomeBlurb);
		$('#footer-text').html(footerText);	
	}

	$('#resultsTitleText').html(resultsTitleText);

	//: show the BETA message if configured
	if (showBetaMessage) {
		$('#beta-message h4').html(betaMessageTitle);
		$('#beta-message p').html(betaMessageText);
		$('#beta-message').removeClass('hide');
	}

	//: Hide tabs if they shouldn't be displayed.
	if (!enableTabChart) {
		$('#tab-chart').addClass('hide');
	}
	if (!enableTabDetails) {
		$('#tab-details').addClass('hide');
	}
	if (!enableTabAdvanced) {
		$('#tab-advanced').addClass('hide');
	}

	//: Hide the summary data if it shouldn't be displayed
	if (!enableSummaryExtraData) {
		$('#summary-latency').addClass('hide');
		$('#summary-jitter').addClass('hide');
	}

	//: populate the server select box based on data from {@link Sonar.app.config#serverList}.
	populateServers('#serverList', serverList);
	currentServer = serverList[defaultServerIndex].address;

	//: Create the gauge and chart
	speedGauge = createGauge('Throughput', 'speedGauge', 0, gaugeMaxValue);
	resultsChart = createChart(uploadData, downloadData);
	resetGauge(speedGauge);

	//: Register click events for buttons and tabs
	$('#start').click(startTest);
	$('#testAgain').on('click', function() { showPage('welcome'); });
	$('a[aria-controls="chart"]').on('shown.bs.tab', function (e) {	resultsChart.redraw(); });
	$('#serverList').on('change', function() { currentServer = this.value; });

	//: Create a new instance of the NDT Client
	setTestStatus(loadingText);
	ndtClient = new NDTWrapper(currentServer, monitorUpdateInterval);

	return null;
}

/**
 * Via Jquery Ajax call, report the test results for later analysis. See {@link Sonar.server.report} for for details.
 * @return {null}
 */
function reportResults() {

	var data = {
		"serverAddress": currentServer,
		"download": getPeakSpeed(downloadData),
		"upload": getPeakSpeed(uploadData),
		"latency": Math.round(getNDTAverageRoundTrip()),
		"jitter": getNDTJitter()
	};

	$.ajax({
		type: 'POST',
		url: reportURL,
		data: data,
		dataType: "JSON"
	});
}

/**
 * Determines if the current user is using Internet Explorer for a browser, and if so, whether the version is less than version 10.
 * Anything less than version 10 won't event initialize the test far enough to instantiate the {@link Sonar.client.NDTjs} object, which has it's own {@link Sonar.client.NDTjs#checkBrowserSupport} function to alert users about unsupported browsers.
 * @return {boolean}
 */
function isIELessThan10() {
	var div = document.createElement("div");
	div.innerHTML = "<!--[if lt IE 10]><i></i><![endif]-->";
	var isIELessThan10 = (div.getElementsByTagName("i").length == 1);
	if (isIELessThan10) {
		return true;
	} else {
		return false;
	}
}

/**
 * Writes HTML select options for the server dropdown box on the welcome page. 
 * It is expected the **servers** parameter is the {@link Sonar.app.config#serverList} array. Otherwise, the expected format should be:
 * ```
 * [{
 * 	name: 'Server Name',
 * 	address: 'ip address/dns address'
 * }]
 * ```
 * @param {string} domId The element ID of the select element.
 * @param {array(Object)} servers An array of server objects.
 * @return {null}
 */
function populateServers(domId, servers) {
	var options = $(domId);
	$.each(servers, function() {
		options.append($("<option />").val(this.address).text(this.name));
	});
	return null;
}

/**
 * Creates a [morris.js](http://morrisjs.github.io/morris.js) chart component, which should be referenced globally via {@link #resultsChart}.
 * Series data should have the following format:
 * ```
 * [{
 * 	sample: integer,
 * 	upload: float,
 * 	download: float
 * }]
 * ```
 * @return {Morris.Line}
 */
function createChart() {
	var data = [{sample: 1, upload: 10, download: 10}];

	var chart = new Morris.Line({
		element: 'results-chart',
		xkey: 'sample',
		ykeys: ['upload', 'download'],
		labels: ['Upload Speed', 'Download Speed'],
		ymin: 'auto 0',
		smooth: true,
		data: data,
		parseTime: false,
		resize: true,
		hoverCallback: function (index, options, content, row) {
			var markup = '<div class="morris-hover-point" style="color: #0b62a4">';
			markup += '  Upload Speed: <span style="color: black;">' + (isNaN(parseFloat(row.upload)) ? '-' : parseFloat(row.upload).toFixed(1) + ' Mbps') + '</span>';
			markup += '</div><div class="morris-hover-point" style="color: #7A92A">';
			markup += '  Download Speed: <span style="color: black;">' + (isNaN(parseFloat(row.download)) ? '-' : parseFloat(row.download).toFixed(1) + ' Mbps') + '</span>';
			markup += '</div>';
			return markup;
		}
	});

	return chart;
}

/**
 * Updates the supplied [morris.js line chart](http://morrisjs.github.io/morris.js/) (which should be {@link #resultsChart} with {@link #uploadData upload} and {@link #downloadData download} data.
 * @param {Morris.Line} chart The morris.js line chart object.
 * @param {array(float)} uploadData
 * @param {array(float)} downloadData
 * @return {null}
 */
function updateChartData(chart, uploadData, downloadData) {
	var data = [];
	for (var i = 0; i < uploadData.length; i++) {
		data.push({sample: i + 1, upload: uploadData[i], download: null});
	}

	for (i = 0; i < downloadData.length; i++) {
		data[i].download = downloadData[i];
	}

	chart.setData(data);
}

/**
 * Creates a [canv-guage](https://github.com/Mikhus/canv-gauge) instance, which is used as visual flare for users.
 * Default values:
 * - min: 0
 * - max: 100
 * - ticks: 10
 * - units: Mb/s
 * @param {string} title Title displayed inside gauge element
 * @param {string} renderTo The DOM element target the gauge will render in.
 * @param {integer} min (The minimum guage number) - likely to be 0.
 * @param {integer} max The maximum gauge number (the fastest it can go)
 * @param {integer} ticks The number of major gauge lines
 * @param {integer} units The units used in the test
 * @return {Gauge}
 */
function createGauge(title, renderTo, min, max, ticks, units) {
	// default values
	min = (typeof min === 'undefined') ? 0 : min;
	max = (typeof max === 'undefined') ? 100 : max;
	ticks = (typeof ticks === 'undefined') ? 10 : ticks;
	units = (typeof units === 'undefined') ? 'Mb/s' : units;	

	var gaugeValues = [];
	for (var i = 0; i <= ticks; i++) {
		gaugeValues.push(0.1 * max * i);
	}

	var gauge = new Gauge({
		renderTo	: renderTo,
		width       : 350,
		height      : 350,
		units       : units,
		title       : title,
		minValue    : min,
		maxValue    : max,
		majorTicks  : gaugeValues,
		highlights  : [{ from: 0, to: max, color: 'rgb(0, 255, 0)' }]
	});

	return gauge;
}

/**
 * Updates the supplied [canv-guage](https://github.com/Mikhus/canv-gauge) object (which should correspond to {@link #speedGuage}) with the latest data. 
 * This function also adds the last reported {@link #uploadData upload} {@link #downloadData download} to their respective global arrays.
 * @param {Gauge} gaugeElement 
 * @param {float} uploadData
 * @param {float} downloadData
 * @return {null}
 */
function updateTestValue(gaugeElement, uploadData, downloadData) {
	if (currentPhase == PHASE_UPLOAD) {
		var speed = getNDTUploadSpeed(true);
		gaugeElement.setValue(speed);
		uploadData.push(speed);
	} else if (currentPhase == PHASE_DOWNLOAD) {
		var speed = getNDTDownloadSpeed(true);
		gaugeElement.setValue(speed);
		downloadData.push(speed);
	} else {
		clearInterval(gaugeUpdateInterval);  
	}
	return null;
}

/**
 * Resets the speed gauge with defaults and zeroes the value. Supplied element should be {@link #speedGauge}.
 * @param {Gauge} element 
 * @return {null}
 */
function resetGauge(element) {
	var gaugeConfig = [];

	element.setValue(0);
	gaugeConfig.push({
		from: 0, to: gaugeMaxValue, color: 'rgb(0, 255, 0)'
	});
	element.updateConfig({
		highlights: gaugeConfig
	});
	return null;
}

/**
 * Resets the results chart and zeroes the values. Supplied element should be {@link #resultsChart}.
 * @param {Gauge} element 
 * @return {null}
 */
function resetChart(element) {
	downloadData = [];
	uploadData = [];
	return null;
}

/**
 * Resets any existing data/objects and executes an NDT test as defined in {@Sonar.client.NDTWrapper}.
 * @param {jQuery} e Event element
 * @return {null}
 */
function startTest(e) {
	//: Stop event propagation
	e.stopPropagation();
	e.preventDefault();

	//: Create a new instance of NDTjs and reset any counters.
	ndtClient = new NDTWrapper(currentServer, monitorUpdateInterval);
	resetGauge(speedGauge);	
	resetChart(resultsChart);

	//: Use the NDTjs function for browser compatibility and bounce if needed.
	if (!checkBrowserSupport()) {
		showErrorWindow('Incompatible Browser', 'Your browser does not appear have full HTML5 support for Websockets and/or Workers. Please try again with a different browser (Chrome 4+, Safari 4+, IE 10+, Firefox 38+.');
		return null;
	}

	//: Set the current phase and some initial variables
	currentPhase = PHASE_WELCOME;
	$("#currentServer").text(currentServer);
	showPage('test');

	//: Run the simulation if configured in {@link Sonar.app.config}.
	if (simulate) {
		simulateTest();
	}

	//: Run the test and setup monitoring callback.
	ndtClient.run_test();
	monitorTest();

	return null;
}

/**
 * Using the {@Sonar.client.NDTjs#checkBrowserSupport} function, returns the best guess on whether the user's browser will support the required HTML5 technologies.
 * @return {boolean}
 */
function checkBrowserSupport() {
	var result = false;
	try {
		var ndt = new NDTjs();
		result = ndt.checkBrowserSupport();
	} catch (e) {
		return false;
	}
	return true;	
}

/**
 * Quick and dirty method for simulating an actual test with actually sending any data. More for testing UI components, but may be considered obsolete.
 * The configuration attribute {@link Sonar.app.config#simulate} can be changed to force simulated tests.
 * @deprecated
 * @return {null}
 */	
function simulateTest() {
	setPhase(PHASE_PREPARING);
	setTimeout(function(){ setPhase(PHASE_UPLOAD) }, 2000);
	setTimeout(function(){ setPhase(PHASE_DOWNLOAD) }, 4000);
	setTimeout(function(){ setPhase(PHASE_RESULTS) }, 6000);
	return null;
}

/**
 * The callback function run according to the configured {@link Sonar.app.config#monitorUpdateInterval monitorUpdateInterval}. How the test proceeds (via {@link #setPhase}) is determined by the returned {@link #getNDTError} and {@link #getNDTStatus} results.
 * @return {null}
 */	
function monitorTest() {
	var message = getNDTError();
	var currentStatus = getNDTStatus();

	if (message.match(/not run/) && currentPhase != PHASE_LOADING) {
		setPhase(PHASE_WELCOME);
		return false;
	}
	if (message.match(/completed/) && currentPhase < PHASE_RESULTS) {
		setPhase(PHASE_RESULTS);
		return true;
	}
	if (message.match(/failed/) && currentPhase < PHASE_RESULTS) {
		setPhase(PHASE_RESULTS);
		return false;
	}
		if (currentStatus.match(/Outbound/) && currentPhase < PHASE_UPLOAD) {
		setPhase(PHASE_UPLOAD);
	}
		if (currentStatus.match(/Inbound/) && currentPhase < PHASE_DOWNLOAD) {
		setPhase(PHASE_DOWNLOAD);
	}

	if (!currentStatus.match(/Middleboxes/) && !currentStatus.match(/notStarted/) && !getNDTRemoteServer().match(/ndt/) && currentPhase == PHASE_PREPARING) {
		debug("Remote server is " + getNDTRemoteServer());
		setPhase(PHASE_UPLOAD);
	}

	if (getNDTRemoteServer() !== 'unknown' && currentPhase < PHASE_PREPARING) {
		setPhase(PHASE_PREPARING);
	}

	setTimeout(monitorTest, monitorUpdateInterval);

	return null;
}

/**
 * Sets the application current page, which is actually just a hidden Bootstrap tab.
 * @param {string} tab The name/id of the page. Don't prefix with '#'
 * @return {null}
 */	
function showPage(tab) {
	$('#pages a[href="#' + tab + '"]').tab('show');
	return null;
}

/**
 * Updates the test page header with an indication of whats currently happening. The actual message displayed can be configured by {@link Sonar.app.config#loadingText loadingText}, {@link Sonar.app.config#uploadTestText uploadTestText}, and {@link Sonar.app.config#downloadTestText downloadTestText}.
 * ** Note: A DOM element matching ***#test-status h2*** must be present for any message to be written. **
 * @param {string} message The message/title to be displayed.
 * @return {null}
 */	
function setTestStatus(message) {
	$("#test-status h2").text(message);
	return null;
}

/**
 * Shows a Bootstrap modal window notifying the user that an error has occurred. 
 * ** Note: Requires the presences of an '#errorWindow' element that is constructed as per [Bootstrap examples](http://getbootstrap.com/javascript/#modals).
 * @param {string} title The title of the dialog box.
 * @param {string} message The dialog box main message.
 * @return {null}
 */	
function showErrorWindow(title, message) {
	$("#errorWindow .modal-title").text(title);
	$("#errorWindow .modal-body").text(message);
	$("#errorWindow").modal();
}

/**
 * Get the current status of the {@link Sonar.client.NDTjs} server connection.
 * @return {string}
 */	
function getNDTStatus() {
	return ndtClient.get_status();
}

/**
 * Get the current error condition of the {@link Sonar.client.NDTjs} server connection.
 * @return {string}
 */	
function getNDTError() {
	return ndtClient.get_errmsg();
}

/**
 * Get the current server host address through the {@link Sonar.client.NDTjs} object.
 * @return {string}
 */	
function getNDTRemoteServer() {
	if (simulate) { 
		return '0.0.0.0';
	}
	return ndtClient.get_host();
}

/**
 * Get the theoretical speed limit (pcBuffSpdLimit).
 * @return {float}
 */	
function getNDTSpeedLimit() {
	if (simulate) { 
		return 0;
	}
	return parseFloat(ndtClient.get_PcBuffSpdLimit());
}

/**
 * Get the average round trip time.
 * @return {float}
 */	
function getNDTAverageRoundTrip() {
	if (simulate) { 
		return 0;
	}
	return parseFloat(ndtClient.getNDTvar("avgrtt"));
}

/**
 * Get last reported upload speed.
 * @param {boolean} raw True to return the uncast speed value (aka not parsed as a float).
 * @return {float}
 */	
function getNDTUploadSpeed(raw) {
	if (simulate) { 
		return 0;
	}
	var speed = ndtClient.getNDTvar("ClientToServerSpeed");
	return raw ? speed : parseFloat(speed);
}

/**
 * Get last reported download speed.
 * @return {float}
 */	
function getNDTDownloadSpeed() {
	if (simulate) { 
		return 0;
	}
	return parseFloat(ndtClient.getNDTvar("ServerToClientSpeed"));
}

/**
 * Returns the maximum value in the supplied array.
 * @param array(float) data An array of float values
 * @return {float}
 */	
function getPeakSpeed(data) {
	return Math.max.apply(Math, data);
}

/**
 * Returns the computed jitter as per the {@link Sonar.client.NDTjs} object.
 * @return {float}
 */	
function getNDTJitter() {
	if (simulate) { 
		return 0;
	}
	return ndtClient.getNDTvar("Jitter");
}

/**
 * Returns the requested NDT test server variable {@link Sonar.client.NDTjs} object.
 * @param {string} variable Property name
 * @return {mixed}
 */	
function getNDTVar(variable) {
	var ret = ndtClient.getNDTvar(variable);
	return !ret ? "-" : ret; 
}

/**
 * Shortcut function to return a '-' if the supplied value is not a number.
 * @param {string} value 
 * @return {mixed}
 */
function printNumberValue(value) {
	return isNaN(value) ? "-" : value;
}

/**
 * Returns the calculated jitter with an appropriate time suffix (msec or sec);
 * @return {string}
 */
function getFormattedJitterValue() {
	var jitter = getNDTJitter();
	return (jitter >= 1000) ? printNumberValue(jitter/1000) + ' sec' : printNumberValue(jitter/1000) + ' msec';
}

/**
 * Returns the calculated packet loss as a percentage to 2 decimal places.
 * @return {float}
 */
function getFormattedPacketLossValue() {
	var packetLoss = parseFloat(ndtClient.getNDTvar("loss"));
	packetLoss = (packetLoss*100).toFixed(2);
	return packetLoss;
}

/**
 * The main decision function of the application. Depending on the supplied phase, a switch case will apply and logic will happen. Very deep stuff.
 * @todo Move each decision point in the switch tree to it's own function.
 * @param {string} phase The current phase constant. Supplied value will become the {@link #currentPhase}.
 * @return {null}
 */
function setPhase(phase) {
	switch (phase) {
		//: Handle PHASE_WELCOME
		case PHASE_WELCOME:
			debug("WELCOME");
			showPage('welcome');
			break;

		//: Handle PHASE_PREPARING
		case PHASE_PREPARING:
			speedGauge.setValue(0);
			//downloadGauge.setValue(0);
			debug("PREPARING TEST");
			setTestStatus(loadingText);
			break;

		//: Handle PHASE_UPLOAD
		case PHASE_UPLOAD:	
			debug("UPLOAD TEST");
			var pcBuffSpdLimit = getNDTSpeedLimit();
			var rtt = getNDTAverageRoundTrip();
			var gaugeConfig = [];

			if (isNaN(rtt)) {
				$("#rttValue").text("n/a");
			} else {
				$("#rttValue").text(printNumberValue(Math.round(rtt)) + " ms");
			}

			if (!isNaN(pcBuffSpdLimit)) {
				if (pcBuffSpdLimit > gaugeMaxValue) {
				  pcBuffSpdLimit = gaugeMaxValue; 
				}
				gaugeConfig.push({
					from: 0,   
					to: pcBuffSpdLimit, 
					color: 'rgb(0, 255, 0)'
				});

				gaugeConfig.push({
					from: pcBuffSpdLimit, 
					to: gaugeMaxValue, 
					color: 'rgb(255, 0, 0)'
				});

				uploadGauge.updateConfig({ 
					highlights: gaugeConfig
				});

				downloadGauge.updateConfig({ 
					highlights: gaugeConfig
				});
			}

			setTestStatus(uploadTestText);
			resetGauge(speedGauge);

			gaugeUpdateInterval = setInterval(function() {
					updateTestValue(speedGauge, uploadData, downloadData);
				},monitorUpdateInterval);

			//: Set the remote server text
			$('#remoteAddress').text(getNDTRemoteServer());
			break;

		//: Handle PHASE_DOWNLOAD
		case PHASE_DOWNLOAD:
			debug('DOWNLOAD TEST');
			setTestStatus(downloadTestText);
			break;

		//: Handle PHASE_RESULTS
		case PHASE_RESULTS:
			debug('SHOW RESULTS');
			debug('Testing complete');

			//: Get download speed
			var downloadSpeed = getPeakSpeed(downloadData);
			if (downloadSpeed >= 1000) {
				$('#download-speed').text(parseFloat(downloadSpeed/1000).toFixed(2));
				$('#download-speed-units').text('Gb/s');
			} else {
				$('#download-speed').text(parseFloat(downloadSpeed).toFixed(2));
				$('#download-speed-units').text('Mb/s');
			}

			//: Get upload speed
			var uploadSpeed = getPeakSpeed(uploadData);
			if (uploadSpeed >= 1000) {
				$('#upload-speed').text(parseFloat(uploadSpeed/1000).toFixed(2));
				$('#upload-speed-units').text('Gb/s');
			} else {
				$('#upload-speed').text(parseFloat(uploadSpeed).toFixed(2));
				$('#upload-speed-units').text('Mb/s');
			}

			//: get Jitter
			var jitter = getNDTJitter();
			jitterValue = (jitter >= 1000) ? printNumberValue(jitter/1000) + ' sec' : printNumberValue(jitter/1000) + ' msec';
			$('#jitter').text(jitterValue);

			//: Other stats
			$('#latency').text(printNumberValue(Math.round(getNDTAverageRoundTrip()))); 
			writeTestDetails();
			writeTestDiagnosis();

			updateChartData(resultsChart, uploadData, downloadData);

			showPage('results');

			//: call the reports URL if required.
			if (reportResults) {
				reportResults();
			}

			break;

		default:
			return null;
	}

	//: Set the {@link #currentPhase} to the supplied phase variable.
	currentPhase = phase;
	return null;
}

/**
 * Writes the test details via jQuery .text() function. This method of creating results is perhaps not very elegant as it relies on precise DOM element ids, but at least its independent of the ui as given in index.html.
 * @return {null}
 */
function writeTestDetails() {
	//: Return nothing if we're only simluating a test.
	if (simulate) {
		return false;
	}

	//: write test results to dom elements.
	$('#detailsOperatingSystem').text(getNDTVar('OperatingSystem'));
	$('#detailsPluginVersion').text(getNDTVar('PluginVersion') + ' (' + getNDTVar('OsArchitecture') + ')');
	$('#detailsCurRwinRcvd').text(getNDTVar('CurRwinRcvd'));
	$('#detailsMaxRwinRcvd').text(getNDTVar('MaxRwinRcvd'));
	$('#detailsCurRTO').text(getNDTVar('CurRTO'));
	$('#detailsPacketLoss').text(getFormattedPacketLossValue());
	$('#detailsMinRTT').text(getNDTVar('MinRTT'));
	$('#detailsMaxRTT').text(getNDTVar('MaxRTT'));
	$('#detailsAvgRTT').text(printNumberValue(Math.round(getNDTAverageRoundTrip())));
	$('#detailsJitter').text(getFormattedJitterValue());
	$('#detailsSACKsRcvd').text(getNDTVar('SACKsRcvd'));
	$('#detailsWaitSec').text(getNDTVar('waitsec'));

	// diagnosis
	var mismatchTest = (getNDTVar("mismatch") == "yes") ? '<div class="alert alert-success" role="alert">A duplex mismatch condition was detected.</div>' : '<span class="text-success">No duplex mismatch condition was detected.</span>';
	$('#detailsMismatch').html(mismatchTest);

	var cableFaultTest = (getNDTVar("bad_cable") == "yes") ? '<div class="alert alert-success" role="alert">The test detected a cable fault.</div>' : '<span class="text-success">The test did not detect a cable fault.</span>';
	$('#detailsCableFault').html(cableFaultTest);

	var congestionTest = (getNDTVar("congestion") == "yes") ? '<div class="alert alert-success" role="alert">Network congestion may be limiting the connection.</div>' : '<span class="text-success">No network congestion was detected.</span>';
	$('#detailsCongestion').html(congestionTest);

	$('#detailsCwndtime').text(printNumberValue(getNDTVar('cwndtime')));
	$('#detailsRwndtime').text(printNumberValue(getNDTVar('rwintime')));
	$('#detailsOptimalRcvrBuffer').text(printNumberValue(getNDTVar('optimalRcvrBuffer')));
	$('#detailsBottleneck').text(getNDTVar('accessTech'));
	$('#detailsDupAcksIn').text(getNDTVar('DupAcksIn'));
}

/**
 * Unlike {@link #writeTestDetails}, this function creates markup directly (a bootstrap themed table). Strictly speaking, Bootstrap isn't required in the UI, but its designed for it.
 * @return {null}
 */
function writeTestDiagnosis() {
	if (simulate) {
		return '';
	}

	var fullResults = jQuery.parseJSON(ndtClient.get_diagnosis());
	var markup = '<table class="table table-striped table-condensed"><tbody>';

	for (var key in fullResults) {
		if (fullResults.hasOwnProperty(key)) {
			markup += '<tr><td class="details-property">' + key + '</td><td class="details-value">' + fullResults[key] + "</td></tr>\n";
		}
	}
	markup += "</tbody><table>";

	$('#advanced').html(markup);
}

/**
 * Writes to console.log if {@link Sonar.app.config#allowDebug} is true.
 * @param {string} message The debug message.
 * @return {null}
 */
function debug(message) {
	if (allowDebug && window.console) {
		console.debug(message);
	}
}