# Mixcloud Widget Javascript API Documentation

## Introduction

It is possible to control an embedded widget using the Mixcloud Widget Javascript API.

Note: the widget must be visible on the page to use this API

### Getting Started

To use the Javascript API you need to add a script tag to your page:

\<script src="//widget.mixcloud.com/media/js/widgetApi.js" type="text/javascript"\>\</script\>

If you have more than one widget on the page you only need this script tag once. Now you can use the API to create an object that can be used to control the widget.

\<script src="//widget.mixcloud.com/media/js/widgetApi.js" type="text/javascript"\>\</script\>

\<iframe id="my-widget-iframe" ...  
\<script type="text/javascript"\>  
    var widget \= Mixcloud.PlayerWidget(document.getElementById("my-widget-iframe"));  
    widget.ready.then(function() {  
        // Put code that interacts with the widget here  
    });

    var widget2 \= Mixcloud.PlayerWidget(document.getElementById(... // if you have more than one widget to control  
\</script\>

The API uses Promises/A+ compliant promises for method calls and the ready callback (see [http://promisesaplus.com/](http://promisesaplus.com/) for the details).

Until the ready promise is resolved there will be no API available on the object returned by Mixcloud.PlayerWidget.

## Methods

All communication with the iframe uses window.postMessage and is, therefore, asynchronous so each method returns a promise. The available methods are:

* load(cloudcastKey, startPlaying)  
* Load a new upload by key (e.g. /spartacus/lambiance/). Pass in startPlaying=true to start playing once loaded. Returns a promise that is resolved once the new upload has loaded.  
* play()  
* Start playing if paused or not yet started.

  A new browser [policy](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes) introduced in 2018 now means that embedded Mixcloud content may no longer autoplay. The play method for the site owner to trigger playback is not guaranteed to work. You will now need to introduce a play button to trigger playback.  
* pause()  
* Pause playback if playing  
* togglePlay()  
* Pause or resume depending on the current state  
* seek(seconds)  
* Seek to a specified number of seconds into the audio (resolves the promise with true if the seek was allowed, false if not)  
* getPosition()  
* Get the current position  
* getDuration()  
* Get the current duration  
* getIsPaused()  
* Get the current playback state  
* Set one of the widget options:  
* hide\_cover, hide\_tracklist, mini, hide\_artwork, light to true or false

The return value of getPosition, getDuration and getIsPaused is passed to the promise as follows:

widget.getPosition().then(function(position) {

    // "position" is the current position  
});

## Events

The available events are:

* progress  
* buffering  
* play  
* pause  
* ended  
* error

You can listen for events as follows:

var widget \= Mixcloud.PlayerWidget(myIframe);

widget.events.pause.on(pauseListener);  
function pauseListener() {  
    // This will be called whenever the widget is paused  
}

// To stop listening for events:  
widget.events.pause.off(pauseListener);

Simply replace events.pause with events.buffering and so on to listen for different events. The listener for the progress event is passed position and durationparameters.

# **noConflict**

If you already have a variable in the global namespace (i.e. on window) you will need to use the noConflict method.

Mixcloud.noConflict(function(mixcloudApiObject) {

    mixcloudApiObject.PlayerWidget( ...  
});

window.Mixcloud will be returned to what it was before the widget API script was loaded.

## Footer Widget \[EXPERIMENTAL\]

The Footer Widget is an experimental JavaScript API that enables you to have a player across the bottom of your website like the player on www.mixcloud.com.

The API is considered experimental because it will change the way your website loads new pages. The script will cause new pages to be loaded without an entire page refresh so that the player doesn't stop playing and reload. This functionality will not work on all websites so you will need to test it on yours to make sure everything still works.

To include a footer widget on your website enter the url of your show, profile or playlist here:

https://www.mixcloud.com

Type a URL above to get the code.

And ensure that code is included on every page of your website.

If you would like buttons on your website that load in new content in to the widget you can include an attribute on an element:

\<div data-mixcloud-play-button="/my-upload/url-goes-here/"\>Click me to play my other upload\!\<div\>

Clicking the element will now load new content into the player. See below for more advanced usage.

## Footer Widget Styling \[EXPERIMENTAL\]

When you include the footer widget on the page the initial page is wrapped in a div tag with class="mixcloud-footer-widget-body-wrapper". Subsequent page loads will not be wrapped since they are loaded into a frame. If you have fixed positioning on any elements that interacts badly with the footer widget you could use a rule such as:

.mixcloud-footer-widget-body-wrapper .my-fixed-element {

    bottom: 60px;  
}

to move the bottom of the fixed element out of the way of the widget.

The widget is embedded in a fixed position element with class="mixcloud-footer-widget-container".

## Footer Widget API \[EXPERIMENTAL\]

To use the footer widget include the following script tag on your page:

\<script src="//widget.mixcloud.com/media/js/footerWidgetApi.js" type="text/javascript"\>\</script\>

Note that you do not need the widgetApi.js script as well.

To add a footer widget to your site use the following code:

\<script type="text/javascript"\>

    var promise \= Mixcloud.FooterWidget("/username/show/");  
    promise.then(function(widget) {  
        // Put code that interacts with the widget here e.g.  
        widget.events.pause.on(pauseListener);  
    });  
\</script\>

The promise resolves with a widget object from the widgetApi that is ready to use.

An optional second parameter can be passed to Mixcloud.FooterWidget \- a Javascript object that can include the following properties:

* disablePushstate  
* Set this to true if you want to handle seamless navigation yourself  
* disableHotkeys  
* Set this to true to disable hotkeys (currently just spacebar for play/pause)  
* disableUnloadWarning  
* Set this to true to disable the popup warning the user about navigating away if it will interrupt playback  
* Other general widget options:  
* hide\_artwork, light or autoplay

In browsers that do not support the Javascript History API links will open in a new tab if the player has started playing.

Currently all forms will open in a new tab. This may change in the future as we work out ways to improve the API. If you have forms on your website and are using this API get in touch at [here](https://help.mixcloud.com/hc/en-us/requests/new).

