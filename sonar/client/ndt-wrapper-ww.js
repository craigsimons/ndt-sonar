/**
 * 
 * @package Sonar.client
 * @author Craig Simons <craigsimons@sfu.ca>
 * @module-attributes
 * @author Peter Booth <pboothe@google.com>
 * @author Aaron Brown <aaronmatthewbrown@gmail.com>
 * @author Craig Simons <craigsimons@sfu.ca> 
 * 
 * This is the worker script required to run the NDT test.
 */
importScripts('NDTWrapper.js');
importScripts('NDTjs.js');

self.addEventListener('message', function(e) {
  var msg = e.data;
  switch (msg.cmd) {
    case 'start':
      startNDT(msg.hostname, msg.port, msg.path, msg.update_interval);
      break;
    case 'stop':
      self.close();
      break;
    default:
      // self.postMessage('Unknown command: ' + data.msg);
      break;
  };
}, false);

/**
 * Resets the speed gauge with defaults and zeroes the value. Supplied element should be {@link #speedGauge}.
 * @param {string} hostname 
 * @param {integer} port 
 * @param {string} path 
 * @param {integer} updateInterval 
 * @return {null}
 */
function startNDT(hostname, port, path, updateInterval) {
  var callbacks = {
    'onstart': function(server) {
      self.postMessage({
        'cmd': 'onstart',
        'server': server
      });
    },
    'onstatechange': function(state, results) {
      self.postMessage({
        'cmd': 'onstatechange',
        'state': state,
        'results': results,
      });
    },
    'onprogress': function(state, results) {
      self.postMessage({
        'cmd': 'onprogress',
        'state': state,
        'results': results,
      });
    },
    'onfinish': function(results) {
      self.postMessage({
        'cmd': 'onfinish',
        'results': results
      });
    },
    'onerror': function(error_message) {
      self.postMessage({
        'cmd': 'onerror',
        'error_message': error_message
      });
    }
  };

  var client = new NDTjs(hostname, port, path, callbacks, updateInterval);
  client.startTest();
}