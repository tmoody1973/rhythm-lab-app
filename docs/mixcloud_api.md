# Developers / API documentation

## Introduction

Documentation for the Widget Javascript API can be found [here](https://www.mixcloud.com/developers/widget/).

The Mixcloud API has been designed to be simple to use and familiar. This page has all of the information you need to get going.

[Create new application](https://www.mixcloud.com/developers/create/)

## Shows, Users and Tags

Objects in the Mixcloud API can be found by taking the URL where you would find them on the site and changing https://www.mixcloud.com/ to https://api.mixcloud.com/.

Take a look at the following links in a browser to see example responses:

* Show  
* [https://api.mixcloud.com/spartacus/party-time/](https://api.mixcloud.com/spartacus/party-time/)  
* User  
* [https://api.mixcloud.com/spartacus/](https://api.mixcloud.com/spartacus/)  
* Tag  
* [https://api.mixcloud.com/genres/funk/](https://api.mixcloud.com/genres/funk/)  
* City  
* [https://api.mixcloud.com/genres/city:athens/](https://api.mixcloud.com/genres/city:athens/)  
* Tag & City  
* [https://api.mixcloud.com/genres/funk+city:athens/](https://api.mixcloud.com/genres/funk+city:athens/)

For example [https://api.mixcloud.com/genres/funk/](https://api.mixcloud.com/genres/funk/)

{

    "url": "https://www.mixcloud.com/genres/funk/",  
    "name": "Funk shows",  
    "key": "/genres/funk/"  
}

[JSONP](http://en.wikipedia.org/wiki/JSON#JSONP) is supported. Adding a callback query string parameter with the name of a function wraps the response \- for example [https://api.mixcloud.com/genres/funk/?callback=callbackfn](https://api.mixcloud.com/genres/funk/?callback=callbackfn)

callback({

    "url": "https://www.mixcloud.com/genres/funk/",  
    "name": "Funk shows",  
    "key": "/genres/funk/"  
})

Each object has a key which is the URL (from the first /) to the object in the API.

## Connections and lists

To find out the available connections for an object add metadata=1 to the query string \- for example [https://api.mixcloud.com/spartacus/?metadata=1](https://api.mixcloud.com/spartacus/?metadata=1)

{

...  
    "metadata": {  
        "connections": {  
            "followers": "https://api.mixcloud.com/spartacus/followers/",  
            "favorites": "https://api.mixcloud.com/spartacus/favorites/",  
            "following": "https://api.mixcloud.com/spartacus/following/",  
            "cloudcasts": "https://api.mixcloud.com/spartacus/cloudcasts/",  
            "listens": "https://api.mixcloud.com/spartacus/listens/",  
        }  
    }  
...  
}

Most connections return lists of items. Other available lists are:

* Popular  
* [https://api.mixcloud.com/popular/](https://api.mixcloud.com/popular/)  
* Hot  
* [https://api.mixcloud.com/popular/hot/](https://api.mixcloud.com/popular/hot/)  
* New  
* [https://api.mixcloud.com/new/](https://api.mixcloud.com/new/)

### Paging

limit and offset query string parameters can be used to page lists.

Lists of items with dates (such as uploads) can be paged using since and until query string parameters. These parameters accept either Unix timestamps (the number of seconds since 1970-1-1) or UTC date times of the format YYYY-MM-DD HH:MM:SS.

When a list is returned URLs for the previous and next pages are provided in the response. If you would like the paging links to use offset rather than defaulting to dates, add offset=0 to the first request.

#### Me

The URL https://api.mixcloud.com/me/ is a shortcut to the authorized user's information and connections. /me/ URLs are only available over https with an access token (see the [Authorization](https://www.mixcloud.com/developers/#authorization) section for more information).

## Search

The /search/ URL can be used to perform searches across Uploads, Users and Tags using the following URL with a type query string parameter which is either upload, user or tag and a q parameter with the search string \- for example [https://api.mixcloud.com/search/?q=party+time\&type=cloudcast](https://api.mixcloud.com/search/?q=party+time&type=cloudcast)

## Authorization

Access tokens are required to update any data or use the /me/ shortcut and must only be provided across https connections.

Extra information is added to some objects if an access token is provided \- for example a following attribute is added to a User object to indicate whether or not the authorized user is following the requested User.

The Mixcloud API uses [OAuth2](http://tools.ietf.org/html/draft-ietf-oauth-v2-06) for authorization.

### Getting an access token

First you'll need to create and application. Then you will be assigned a client\_id and client\_secret.

Only browser based authorization is supported currently. Redirect your user to  
https://www.mixcloud.com/oauth/authorize?client\_id=*YOUR\_CLIENT\_ID*\&redirect\_uri=*YOUR\_REDIRECT\_URI*  
where they will be given the option to log in and allow or deny your application access to their data.

If the user accepts Mixcloud will redirect the user to *YOUR\_REDIRECT\_URI*?code=*OAUTH\_CODE*.

Once you have received the *OAUTH\_CODE* send a request to  
https://www.mixcloud.com/oauth/access\_token?client\_id=*YOUR\_CLIENT\_ID*\&redirect\_uri=*YOUR\_REDIRECT\_URI*\&client\_secret=*YOUR\_CLIENT\_SECRET*\&code=*OAUTH\_CODE*.

This will respond with an access token:

access\_token=YOUR\_ACCESS\_TOKEN

which can be used on future requests as an access\_token query string parameter to access protected resources.

Note it is possible for the user to revoke their access token so your application will need to handle An invalid access token was provided errors and re-authenticate the user.

## Following, Favoriting, Reposting and adding to Listen Later

The URL for following is a User API key with follow/ on the end \- for example https://api.mixcloud.com/spartacus/follow/?access\_token=*ACCESS\_TOKEN*

The URL for favoriting is an upload API key with favorite/ on the end \- for example https://api.mixcloud.com/spartacus/party-time/favorite/?access\_token=*ACCESS\_TOKEN*

The URL for reposting is an upload API key with repost/ on the end \- for example https://api.mixcloud.com/spartacus/party-time/repost/?access\_token=*ACCESS\_TOKEN*

The URL for adding to listen later is an upload API key with listen-later/ on the end \- for example https://api.mixcloud.com/spartacus/party-time/listen-later/?access\_token=*ACCESS\_TOKEN*

To follow, favorite, repost or add to listen later an access token is required. Simply send a POST request to the URL to follow/favorite/repost/add to listen later and a DELETE request to unfollow/unfavorite/unrepost/remove from listen later. It is also possible to send a POST request with a parameter of method=delete to simulate a DELETE request.

For example:

curl \-X POST "https://api.mixcloud.com/spartacus/follow/?access\_token=*ACCESS\_TOKEN*"

curl \-X DELETE "https://api.mixcloud.com/spartacus/follow/?access\_token=*ACCESS\_TOKEN*"

curl \-F "method=delete" "https://api.mixcloud.com/spartacus/follow/?access\_token=*ACCESS\_TOKEN*"

## Embedding

Embed code for the widget can be retrieved by adding embed-html/ to an Upload API key \- for example [https://api.mixcloud.com/spartacus/party-time/embed-html/](https://api.mixcloud.com/spartacus/party-time/embed-html/).

JavaScript applications (requiring JSONP for cross domain requests) can use embed-json/ instead of embed-html/ to get the HTML wrapped in JSON. width, height and color (6 digit hex code) query parameters can be used to change the widget's appearance.

Mixcloud also supports [oEmbed](http://oembed.com/) discovery. For example you can get the embed code for an upload like this:  
[https://app.mixcloud.com/oembed/?url=https%3A%2F%2Fwww.mixcloud.com%2Fspartacus%2Fparty-time%2F\&format=json](https://app.mixcloud.com/oembed/?url=https%3A%2F%2Fwww.mixcloud.com%2Fspartacus%2Fparty-time%2F&format=json)

## Uploads

Shows can be uploaded by posting to https://api.mixcloud.com/upload/ with an access token (see the [Authorization](https://www.mixcloud.com/developers/#authorization) section).

The MP3, metadata and image should all be uploaded in a single multipart/form-data POST. The same filesize and metadata restrictions apply as in the standard Mixcloud web interface so it is recommended that applications using the Mixcloud API validate the data before sending since the user will have to wait for the MP3 to be uploaded before any validation errors are returned.

The available fields and their restrictions are shown in the table below. Fields labelled REQUIRED are required \- all other fields are optional.

* mp3  
* REQUIRED. The audio file to be uploaded. The file should not be larger than 4294967296 bytes.  
* name  
* REQUIRED (if a track). The track section song title.  
* picture  
* A picture for the upload. The file should not be larger than 10485760 bytes.  
* description  
* A description for the upload. Maximum of 1000 characters.  
* tags-X-tag  
* Where X is a number 0-4, a tag name for the upload. Up to 5 tags can be provided. These are usually genres. You can find the curated genre list in the web upload flow \- these are tags we recommend to aid the discoverability of your upload, but you are free to use any tags you like.  
* unlisted  
* Make this upload private (aka unlisted). The upload will not appear under your profile page when other users visit it. Only users who know the upload's link will have access to it. If there is a scheduled publish\_date, it will be ignored, and made private immediately.  
* publish\_date  
* ONLY FOR UPLOADING TO PRO ACCOUNTS. Scheduled publish date for the upload in the format YYYY-MM-DDTHH:MM:SSZ(e.g. 2015-11-21T14:05:00Z).

  **Note:** the date MUST be UTC so you may need to convert for your local timezone first. Scheduling only applies to uploads which have not been public before.  
* disable\_comments  
* ONLY FOR UPLOADING TO PRO ACCOUNTS. Disable comments for this upload  
* hide\_stats  
* ONLY FOR UPLOADING TO PRO ACCOUNTS. Hide play, favorite and repost counts for this upload  
* hosts-X-username  
* ONLY FOR UPLOADING TO PRO ACCOUNTS. Where X is a number 0-1, the username of another Mixcloud account to tag on this upload. Up to 2 users can be tagged on an upload. Followers of those users will be notified about the upload in addition to your followers. The upload will also appear on the profiles of the tagged users, provided that they are below their upload limit (otherwise it will appear in their drafts folder).

  **Note:** the usernames you provide must belong to users who have already accepted an invitation to be associated with the uploading account, and appear in [the Hosts tab of your dashboard](https://www.mixcloud.com/dashboard/my-hosts/on-my-profile/). Any username which does not fulfil these criteria will be ignored. When editing, if ANY of the usernames are incorrect, NONE of the hosts changes in the request will be applied. When uploading, it is important to make sure all the host usernames are correct, as you can only only benefit from the additional reach of notifying their followers when the upload is first published.

  **Note:** to remove all hosts from an upload, supply an empty username field (e.g. hosts-0-username=).

Tracklist/chapter information is provided using the fields in the table below where X represents the section (track or chapter) number \- starting with 0\.

* sections-X-artist  
* REQUIRED (if a track). The track section artist name.  
* sections-X-song  
* REQUIRED (if a track). The track section song title.  
* sections-X-chapter  
* The name of a chapter section.  
* sections-X-start\_time  
* The time, in seconds (integer), at which section X starts.

An example, using curl, is shown below uploading an MP3 called "cloudcast.mp3", with a name of "API Upload", 2 tags ("Test" and "API"), 2 sections (a chapter called "Introduction" and one track) and an image called "upload.jpg".

curl \-F mp3=@upload.mp3 \\

     \-F "name=API Upload" \\  
     \-F "tags-0-tag=Test" \\  
     \-F "tags-1-tag=API" \\  
     \-F "sections-0-chapter=Introduction" \\  
     \-F "sections-0-start\_time=0" \\  
     \-F "sections-1-artist=Artist Name" \\  
     \-F "sections-1-song=Song Title" \\  
     \-F "sections-1-start\_time=10" \\  
     \-F "description=My test upload" \\  
     https://api.mixcloud.com/upload/?access\_token=INSERT\_ACCESS\_TOKEN\_HERE

## Editing uploads

Uploads can be edited by posting to https://api.mixcloud.com/upload/\[YOUR\_SHOW\_KEY\]/edit/ (e.g. https://api.mixcloud.com/upload/my-username/my-upload/edit/) with an access token (see the [Authorization](https://www.mixcloud.com/developers/#authorization) section). You can edit uploads that were not uploaded with the API.

The metadata and image should all be uploaded in a single multipart/form-data POST. All fields that are allowed in an upload except mp3 can be sent to this endpoint.

The name, description and picture fields will only be updated if they are included in the request(e.g. if the description parameter is not included the description of the upload will not be changed).

If any tag fields are posted all tags will be overwritten (if you want to just add a tag, you will have to post the tags that are already on the upload for them to remain). Also for sections if any section field is posted the entire tracklist will be overwritten.

If any hosts field are posted, all hosts will be overwritten (if you want to just add one more host, you will have to post the full list of hosts that are already on the upload for them to remain).

The following extra parameters are available when editing an existing upload. You can only supply one of unlisted, publish orunpublish.

* publish  
* Make this upload public. This applies to private (aka unlisted) uploads, or uploads which are in your drafts folder. If the upload has a scheduled publish\_date, this is implied (as it will publish at the scheduled date.)  
* unpublish  
* Move this upload to drafts. The upload will no longer be available to the public unless you publish it again.

An example, using curl, is shown below:

curl \-F picture=@mypicture.jpg \\

     \-F "name=A new name" \\  
     \-F "tags-0-tag=Test" \\  
     \-F "tags-1-tag=API" \\  
     \-F "description=My test upload" \\  
     https://api.mixcloud.com/upload/my-username/my-upload/edit/?access\_token=INSERT\_ACCESS\_TOKEN\_HERE

## Rate limits

There are rate limits on all actions in the API. We're still tweaking these so if you keep hitting them, do let us know at [here](https://help.mixcloud.com/hc/en-us/requests/new)

The response in the rate limit tells you how long you have to wait until you can try again in both the HTTP headers and the JSON/XML response.

HTTP/1.1 403 Forbidden

Retry-After: 452

{  
    "error": {  
        "message": "You have hit your rate limit. Retry after 452 seconds.",  
        "type": "RateLimitException",  
        "retry\_after": 452  
    }  
}

## Audio Streams

The audio streams are not available through the Mixcloud API. There are two reasons for this.

Firstly, we need to know what has been listened to so that we can report usage, pay royalties and provide features such as 'Suggested Shows'.Secondly, Mixcloud needs to pay the bills\! We can't give away the audio for free outside of mixcloud.com simply because it costs us to host and stream the files and pay royalties.

### Deep Linking

Both our iOS and Android apps support deep linking using web urls. Follow the instructions below for the respective platforms:

### iOS:

From within your iOS app you can use the example code snippets to link to content in our app:

#### Objective C:

\[\[UIApplication sharedApplication\] openURL:\[NSURL URLWithString:@"https://www.mixcloud.com/profile/content/"\];

#### Swift 2.3:

UIApplication.sharedApplication().openURL(NSURL(string: "https://www.mixcloud.com/profile/content/")\!)

#### Swift 3:

UIApplication.shared.openURL(URL(string: "https://www.mixcloud.com/profile/content/")\!)

### Android:

You can link to content from within your android app using the following java code:

Intent intent \= new Intent(Intent.ACTION\_VIEW);

intent.setData(Uri.parse("https://www.mixcloud.com/profile/content/"));  
context.startActivity(intent);

This will give the user the option to open the content in either a browser or the Mixcloud app if it is installed. If you want to force the content to be opened in the Mixcloud app you can also set the package on the intent:

intent.setPackage("com.mixcloud.player");

## Example

Examples of people using the the Mixcloud API can be found at:

