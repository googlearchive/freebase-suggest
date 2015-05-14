Please see: http://www.freebase.com/view/freebase/metaweb_api_service
for an up-to-date documentation of all Freebase API services


|Name|search|
|:---|:-----|
|Description|Provides basic text search service, based on a query string and some optional constraints.|
|Accessible Via|/api/service/search|
|HTTP GET|True|
|HTTP Post|False|
|Special Headers|None|
|Login Required|False|
|Required Arguments|None|
|Optional Arguments|prefix: a prefix to do an auto-complete on (may be incomplete) - default|
|  |query: the string to do a search for|
|  |type: type of items to match for|
|  |limit: the maximum number of results to return, default is 20|
|  |start: offset from which to start returning results, default is 0|
|  |escape: how to escape results (html or false), default is html|
|Extra Arguments Ignored|True|
|Response Format|application/json|

Example result for /api/service/search?query=Casino&limit=1

```
{ "code": "/api/status/ok",
   "result": [
   {
     "guid": "#9202a8c04000641f80000000009c1234",
     "id" : "\/wikipedia\/en_id\/3191060",
     "alias" : [],
     "name": "Casino Royale",
     "article": { "id": "#9202a8c04000641f80000000009cddab" },
     "image": { "id": "#9202a8c04000641f80000000011939bd" },
     "type" : [
       {
         "id": "/common/topic",
         "name" : "Topic"
       },
       {
         "id": "/film/film",
         "name" : "Film"
       }, ...
     ]
   }, ...
  ]
 }
```