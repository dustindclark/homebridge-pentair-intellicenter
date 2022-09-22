
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

> :warning: **Version 2.x+ of this plugin only works with IntelliCenter version 1.064 and higher.**
> If you are on an older version of IntelliCenter firmware, it is recommended that you
> [upgrade your IntelliCenter firmware](https://www.pentair.com/en-us/education-support/residential/product-support/pentair-pool-and-spa-software-downloads/intellicenter-download.html).
> If you prefer to remain on older IntelliCenter firmware, you should install the latest 1.x version of this plugin. 

# Homebridge Pentair IntelliCenter Plugin
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![NPM Version](https://img.shields.io/npm/v/homebridge-pentair-intellicenter.svg)](https://www.npmjs.com/package/homebridge-rinnai-controlr)

This plugin integrates with the Pentair IntelliCenter panel to expose its features to HomeKit/Siri.
It connects directly to your IntelliCenter panel, so using a separate pool controller (i.e. nodejs-poolController)
is not required. Currently, only the "Bodies", heaters, and circuits that are marked as "Features" in IntelliCenter
will be exposed as switches in HomeKit.

Also, along with the [Homebridge Alexa plugin](https://github.com/NorthernMan54/homebridge-alexa), this plugin can be used to expose your IntelliCenter circuits to Alexa. As far as I know, this is currently the only Alexa integration as the Alexa skill for IntelliCenter is no longer available. 
