/**
* 
* @package Sonar.app
* @author Craig Simons <craigsimons@sfu.ca>
* @module-attributes
* 
* Application configuration for Sonar functions contained in {@link Sonar.app.application}. These configuration items are mostly intended to allow unique branding options for each deployment of Sonar.
* 
*/

/**
* @cfg {array(Object)} allowDebug
* The list of servers we will allow the client to connect to. The structure of the object array needs to be in the following format:
* ```
* [{
* 	name: string (human name displayed),
* 	address: string (ip or DNS address)
* }]
* ```
*/
var serverList = [{
	name: 'Calgary (M-Lab)',
	address: 'ndt.iupui.mlab1.yyc01.measurement-lab.org'
}, {
	name: 'London (M-Lab)',
	address: 'ndt.iupui.mlab1.lhr01.measurement-lab.org'
}, {
	name: 'Japan (M-Lab)',
	address: 'ndt.iupui.mlab1.hnd01.measurement-lab.org'			
}, {
	name: 'New York (M-Lab)',
	address: 'ndt.iupui.mlab1.lga04.measurement-lab.org'
}, {
	name: 'Paris (M-Lab)',
	address: 'ndt.iupui.mlab1.par01.measurement-lab.org'		
}, {
	name: 'San Fransciso (M-Lab)',
	address: 'ndt.iupui.mlab1.nuq03.measurement-lab.org'		
}, {
	name: 'Seattle (M-Lab)',
	address: 'ndt.iupui.mlab1.sea01.measurement-lab.org'
}, {
	name: 'Stockholm (M-Lab)',
	address: 'ndt.iupui.mlab1.arn01.measurement-lab.org'
}, {
	name: 'Sydney (M-Lab)',
	address: 'ndt.iupui.mlab1.syd01.measurement-lab.org'		
}, {
	name: 'Toronto (M-Lab)',
	address: 'ndt.iupui.mlab1.yyz01.measurement-lab.org'	
}];

/**
* @cfg {boolean} allowDebug
* True to overwrite the default HTML coded values **
*/
var useDynamicText = true;

/**
* @cfg {boolean} simulate
* True if we want to run a fake test that does not send any data to an NDT server.
*/
var simulate = false;

/**
* @cfg {boolean} allowDebug
* True to write more verbose data to console.log. ** Note: If using the Javascript console on your browser, the NDT results will be drastically lower. **
*/
var allowDebug = false;

/**
* @cfg {boolean} enableChart
* Enables the chart tab on the results page.
*/
var enableTabChart = true;

/**
* @cfg {boolean} enableDetails
* Enables the details tab on the results page.
*/
var enableTabDetails = true;

/**
* @cfg {boolean} enableAdvanced
* Enables the advanced tab on the results page.
*/
var enableTabAdvanced = true;

/**
* @cfg {boolean} enableAdvanced
* Enables the additional data shown on the summary page (Network latency and Jitter).
*/
var enableSummaryExtraData = true;

/**
* @cfg {boolean} reportResults
* Enables the collection of test results for later analysis. The URL called is defined by {@link #reportURL}.
*/
var reportResults = true;

/**
* @cfg {string} reportResults
* The URL to be called for reporting ability. {@link Sonar.app.application#setPhase} will create an Ajax call to this URL.
*/
var reportURL = "sonar/server/report.php";

/**
* @cfg {string} titleText
* The main title displayed on masthead
* ** Note: It is unlikely changes to this variable will be picked up by search crawlers. To ensure SEO compatability, you are required to also changes the ***#header-title*** DOM element on index.html. **
*/
var titleText = 'perfSonar';

/**
* @cfg {string} titleBlurb
* The secondary title/blurb displayed on masthead
* ** Note: It is unlikely changes to this variable will be picked up by search crawlers. To ensure SEO compatability, you are required to also changes the ***#header-blurb DOM*** element on index.html. **
*/
var titleBlurb = 'Network Diagnostics and Benchmarking';

/**
* @cfg {string} showBetaMessage
* True if HTML5 Beta message should be displayed warning users that this method of speed test is not exactly reliable.
*/
var showBetaMessage = true;

/**
* @cfg {string} betaMessageTitle
* The title of the BETA message callout. Displayed if {@link #showBetaMessage} is true. 
*/
var betaMessageTitle = "BETA Notice"

/**
* @cfg {string} betaMessageText
* The message displayed in the BETA callout. Displayed if {@link #showBetaMessage} is true. 
*/
var betaMessageText = 'This speed test uses new HTML5 <strong>Websockets</strong> and <strong>Workers</strong> technology. Due to the nature of HTML support in various web browsers, the results determined by this test will likely be lower than expected.';

/**
* @cfg {string} welcomeTitle
* The welcome page h1 title.
* ** Note: It is unlikely changes to this variable will be picked up by search crawlers. To ensure SEO compatability, you are required to also changes the ***#welcome-title DOM*** element on index.html. **
*/
var welcomeTitle = "NDT Speed Test"

/**
* @cfg {string} welcomeBlurb
* The main description on the welcome page.
* ** Note: It is unlikely changes to this variable will be picked up by search crawlers. To ensure SEO compatability, you are required to also changes the ***#welcome-blurb DOM*** element on index.html. **
*/
var welcomeBlurb = 'The Network Diagnostic Tool (NDT) provides a sophisticated speed and diagnostic test. An NDT test reports more than just the upload and download speeds - it also attempts to determine what, if any, problems limited these speeds, differentiating between computer configuration and network infrastructure problems. While the diagnostic messages are most useful for expert users, they can also help novice users by allowing them to provide detailed trouble reports to their network administrator.';

/**
* @cfg {string} resultsTitleText
* The h1 tag displayed on the Results page.
*/
var resultsTitleText = 'Your test results';

/**
* @cfg {string} loadingText
* The title displayed on the test page when waiting for the {@link Sonar.client.NDTjs} client to connect to the NDT server.
*/
var loadingText = 'Preparing speed tests...';

/**
* @cfg {string} uploadTestText
* The title displayed on the test page when conducting the upload portion of the NDT test.
*/
var uploadTestText = 'Testing upload speed...';

/**
* @cfg {string} downloadTestText
* The title displayed on the test page when conducting the download portion of the NDT test.
*/
var downloadTestText = 'Testing download speed...';

/**
* @cfg {string} footerText
* The title of the BETA message callout. Displayed if {@link #showBetaMessage} is true. 
* ** Note: It is unlikely changes to this variable will be picked up by search crawlers. To ensure SEO compatability, you are required to also changes the ***#welcome-title DOM*** element on index.html. **
*/
var footerText = "<strong>perfSonar</strong> &middot; Network Diagnostics and Benchmarking";

/**
* @cfg {integer} defaultServerIndex
* The default index of the {@link #serverList} what will be confured as the default server.
*/
var defaultServerIndex = 0;

/**
* @cfg {integer} monitorUpdateInterval
* The interval the {@link Sonar.app.application#monitorTest monitorTest} callback function will be run. A higher value **may** impact overall test results due to the extra processing load.
*/
var monitorUpdateInterval = 1000;

/**
* @cfg {integer} gaugeMaxValue
* The maximum value displayed on the {@link Sonar.app.application#speedGauge}, which should be in bits per second.
*/
var gaugeMaxValue = 1000;