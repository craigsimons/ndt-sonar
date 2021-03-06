# Sonar

Sonar is an HTML5-only network diagnostic tool that utilizes the [perfSonar](http://www.perfsonar.net/) platform as well as NDT Javascript libraries developed by [M-Lab](http://www.measurementlab.net/). The test determines upload and download bandwidth and can also determine some network faults such as congestion.

#### Demo
An online demo of an unmodified Sonar instance can be found at [www.craigsimons.com/ndt-sonar/](http://craigsimons.com/ndt-sonar/).

#### Documentation
A link to the developer documentation can be found at [www.craigsimons.com/ndt-sonar/documentation/Sonar/](http://craigsimons.com/ndt-sonar/documentation/Sonar/). **Work in progress!**

#### Some of the strengths of Sonar:
- No Java required
- Runs on modern mobile devices
- Responsive design for all screen sizes
- No server-side scripting (PHP, etc) required
- Apache licensed
- Optimized for easy branding

#### Some of the weaknesses of Sonar:
- HTML5 capable browser required
- Web server required (no testing on local file system)
- Questionable accuracy at high bit rates (100 MBit+)

#### Supported Browsers:
- IE 10+
- Firefox 38+
- Chrome 31+
- Safari 7+
- Android Browser 4.4+
- iOS Safari 7.1+

## Change Log
#### Version 1.2
- Simple reporting: A small PHP script (*/sonar/server/report.php*) put AJAX supplied test results into the webserver syslog. 

#### Version 1.1
- Added ability to disable results tabs (chart, details and advanced) using config.js file settings
- Added ability	to disable Jitter and Network Latency results from summary page

#### Version 1.0
- Initial release

## Installation

Simply copy the contents into a web readable directory and [customize](#customization) to suit. No use of server-side scripting languages (PHP, etc) is required.

By default, Sonar is configured with a subset of [M-Lab](http://www.measurementlab.net/) nodes which are good for testing. However, it's expected that you will want to run your own install of the [perfSonar](http://www.perfsonar.net/) suite. If so, change the **serverList** attribute in the *sonar/app/config.js* file.

For all other configuration items, see the code documentation (*documentation/Sonar/index.html*). 

**Note:** The documentation is readable on the local file sytem without having to upload it to a file server.

## Customization

Several customization options are available that can be tailored to your environment. Titles, text and logos can be edited directly through the */index.html* file or the */sonar/app/config.js* file.

A typical procedure for branding this app might be as follows:

1. Replace the */images/logo.png* graphic with a more suitable logo. An example Photoshop file is located at */images/logo.psd*.
2. Modify the colors provided in */css/main.css*. Likely this would just be a masthead color change (**.bs-docs-header**). [ColorZilla](http://www.colorzilla.com/gradient-editor/) is a great resource.
3. Customize the text. This can be done by directly editing the */index.html* file or by enabling **useDynamicText** in */Sonar/app/config.js* and editing the required configuration attributes.
4. ???
5. Profit.

## Documentation

Full developer-level documentation can be found in the [documentation/Sonar](documentation/Sonar) directory. 

## Reporting

A simple reporting PHP script is included (*/sonar/server/report.php*) that pushes test results to the local syslog server (or Event log for Windows). The data is supplied via a client-side AJAX call after the test is complete. This Ajax call is enabled by default, but can be turned of by changing the **reportResults** variable to *false* in the */sonar/app/config.js* file.

## Authors
* NDT Server support for websockets and original Node.js client was written by [Peter Boothe](mailto:pboothe@google.com).
* Further development of a full web client was done by [Aaron Brown](mailto:aaronmatthewbrown@gmail.com).
* Responsive design and further polish by [Craig Simons](mailto:craigsimons@sfu.ca).

## License
This application was originally Copyright (c) 2003 University of Chicago. The full license can be seen in the *LICENSE* file.

## Special Thanks
Special thanks to the M-Lab team for developing a Websockets/Web Workers client. While this project exists to improve the presentability of the "Speed Test" experience, I doubt I would have been able to develop the NDTjs classes myself :)