Requires at least [jquery-1.2.2](http://code.google.com/p/jqueryjs/).

freebaseSuggest() provides a way to attach Freebase suggestion behavior to a
text input using the Freebase.com autocomplete service.

freebaseSuggest accepts an optional argument which is a dictionary that could overwrite one or more default settings as described below.

|width|This is the width of the suggestion list and the flyout in pixels. Default is 275.|
|:----|:---------------------------------------------------------------------------------|
|soft|Soft suggestion. If true, DO NOT auto-select first item in the suggestion list. Otherwise, select first item. Default is true.|
|suggest\_new|To enable a suggest new option, set text to a non-null string. This is the string displayed for the suggest new option (eg, "Create new topic"). Default is null.|
|flyout|To enable flyout to show additional information for the currently highlighted item including a thumbnail and blurb. Default is true.|
|service\_url|This the base url to all the api services like autocomplete, blurbs and thumbnails. Default is "http://www.freebase.com".|
|ac\_path|The path to the autcomplete service. Default is "/api/service/search".|
|ac\_param|A dictionary of query parameters to the autocomplete service. see http://code.google.com/p/freebase-suggest/wiki/FreebaseAPISearch|
|ac\_qstr|This is the parameter name to be passed to the autocomplete service for the string to autocomplete on. Default is 'prefix'. The parameter value will be what the user typed in the input. see http://code.google.com/p/freebase-suggest/wiki/FreebaseAPISearch|
|blurb\_path|The path to the blurb service for the description to be shown in the flyout. Default is "/api/trans/blurb".|
|blurb\_param|The query parameters to the blurb service. Default is { maxlength: 300 }.|
|thumbnail\_path|The path to the thumbnail service to be shown in the flyout. Default is "/api/trans/image\_thumb".|
|thumbnail\_param|The query paramters to the thumbnail service. Default is {}.|
|filter|Specify a filter function if you want to filter any of the items returned by ac\_path service. The function is called with one argument representing an item from the ac\_path result. The function should return TRUE to include the item or FALSE to exclude. Default is a function that returns TRUE. See fbs.filter|
|transform|Specify a transform function if you want to transform the default display of the suggest list item. See fbs.transform|


In addition, freebaseSuggest will trigger the following events on behalf of
the input it's attached to. They include:


|fb-select|Triggered when something is selected from the suggestion list. The data object will contain id and name fields: { id: aString, name: aString }.|
|:--------|:----------------------------------------------------------------------------------------------------------------------------------------------|
|fb-select-new|Triggered when the suggest\_new option is selected. The data object will only contain a name field: { name: aString }.|


Example 1. Attach Freebase suggestion behavior to #myInput with default options and on 'fb-select', output the selected id to the console.
```
$('#myInput')
     .freebaseSuggest()
     .bind('fb-select', function(e, data) { console.log('suggest: ', data.id); })
```

Example 2. Soft suggestion on instances of '/film/film' with a suggest new option and output the various events to the console.
```
var options = {
     soft: true,
     suggest_new: 'Create new Film',
     ac_param: {
         type: '/film/film',
     }
};
$('#myInput')
     .freebaseSuggest(options)
     .bind('fb-select', function(e, data) { console.log('suggest: ', data.id); })
     .bind('fb-select-new', function(e, data) { console.log('suggest new: ', data.name); });
```

















