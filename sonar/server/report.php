<?php

/**
* Simple reporting script to log NDT Sonar results.
* 
* This script is intended to be called via Ajax after an NDT test is finished. It's not meant to be a fully featured reporting script (ie log to a database), just a quick and dirty tool that will allow later log analysis.
*
* **Note: As syslog is limited to 1KB, it isn't possible to stick the full {@link Sonar.client.NDTWrapper#get_diagnosis() NDTWrapper#get_diagnosis} result into the message. Therefore, only a subset of info is logged. Perhaps in the future, this script may log to a database directly. **
*
* Expects a form post with the following values:
* - "serverAddress": string,
* - "download": float,
* - "upload": float,
* - "latency": float,
* - "jitter": float
*
* @package Sonar.server
* @author Craig Simons <craigsimons@sfu.ca>
*
*/

######################################
#		Start of Configuration		 #
######################################

/**
* The identity used in the syslog message.
* @var string
*/
$syslogID = "NDT-Sonar";

/**
* The facility to which these results are logged to. Can be one of the following:
* -**LOG_AUTH**: security/authorization messages (use LOG_AUTHPRIV instead in systems where that constant is defined)
* -**LOG_AUTHPRIV**: security/authorization messages (private)
* -**LOG_CRON**: clock daemon (cron and at)
* -**LOG_DAEMON**: other system daemons
* -**LOG_KERN**: kernel messages
* -**LOG_LOCAL0** ... LOG_LOCAL7: reserved for local use, these are not available in Windows
* -**LOG_LPR**: line printer subsystem
* -**LOG_MAIL**: mail subsystem
* -**LOG_NEWS**: USENET news subsystem
* -**LOG_SYSLOG**:	messages generated internally by syslogd
* -**LOG_USER**: generic user-level messages
* -**LOG_UUCP**: UUCP subsystem
* @var string
*/
$syslogFacility = LOG_USER;

######################################
#		End of Configuration		 #
#	(Don't modify below this line)   #
######################################

/**
* The IP address of the NDT server used in the test.
* @var string
*/
$serverAddress = isset($_POST["serverAddress"]) ? $_POST["serverAddress"] : "unknown";

/**
* The maximum download speed acheived in the test.
* @var float
*/
$downloadResult = isset($_POST["download"]) ? (float)$_POST["download"] : 0;

/**
* The maximum upload speed acheived in the test.
* @var float
*/
$uploadResult = isset($_POST["upload"]) ? (float)$_POST["upload"] : 0;

/**
* The maximum upload speed acheived in the test.
* @var float
*/
$latency = isset($_POST["latency"]) ? (float)$_POST["latency"] : 0;

/**
* The maximum upload speed acheived in the test.
* @var float
*/
$jitter = isset($_POST["jitter"]) ? (float)$_POST["jitter"] : 0;

/**
* The maximum upload speed acheived in the test.
* @var float
*/
$packetLoss = isset($_POST["packetLoss"]) ? (float)$_POST["packetLoss"] : 0;

/**
* A multidimensional array (hash) of the results. This array will be JSON serialized into the syslog message.
* @var array
*/
$result = array(
	"id" => genUUID(),
	"clientAddress" => getRealIpAddr(),
	"serverAddress" => $serverAddress,
	"userAgent" => $_SERVER["HTTP_USER_AGENT"],
	"download" => $downloadResult,
	"upload" => $uploadResult,
	"latency" => $latency,
	"jitter" => $jitter,
	"packetLoss" => $packetLoss
);

writeToSyslog($syslogID, $syslogFacility, json_encode($result));

/**
 * Writes to the system logger. ** Note: This should be OS-agnostic, although Windows servers can't handle {@link #syslogFacility} values of LOG_LOCAL0 .. LOG_LOCAL7.**
 * @param string $syslogID The syslog identifier used.
 * @param integer $syslogFacility The syslog facility as defined by {@link @syslogFacility}.
 * @param string $message The actual message to be logged.
 * @return null
 */
function writeToSyslog($syslogID, $syslogFacility, $message) {
	openlog($syslogID, LOG_ODELAY, $syslogFacility);
	syslog(LOG_NOTICE, $message);
	closelog();
}

/**
 * Generates a valid RFC 4211 compliant v3 UUID. See [example](http://php.net/manual/en/function.uniqid.php#94959) for more detail.
 * @return string
 */
function genUUID() {
	return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
		mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
		mt_rand( 0, 0xffff ),
		mt_rand( 0, 0x0fff ) | 0x4000,
		mt_rand( 0, 0x3fff ) | 0x8000,
		mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
	);
}

/**
 * Get the IP Address of the current user. This function takes into account proxied HTTP requests (at least those with an [http://en.wikipedia.org/wiki/X-Forwarded-For](X-Forwarded-For)) header field.
 * ** Note: It is entirely possible for an end user to spoof an IP through proxying methods. Do not rely on the results of this function to provide any measure of security. **
 * @todo Investigate performance of this function under non-Apache implementations such as nginx.
 * @return string
 */
function getRealIpAddr() {
	if (!empty($_SERVER["HTTP_CLIENT_IP"])) {
		$ip = $_SERVER["HTTP_CLIENT_IP"];
	} elseif (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
		$ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
	} else {
		$ip = $_SERVER["REMOTE_ADDR"];
	}
	return $ip;
}

?>