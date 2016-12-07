#Layout
site/ - statically served files (js libraries and css)
cgi-bin/ - application directory
cgi-bin/js - js source files

#Config Files
* annisvis.conf - global configuration, see example file
* Predefined locations (name configured in annisvis.conf)
  Format: { "locationName" : { "lat" : "latValue", "lng" : "lngValue" } }

#Install
* download annisvis to your deployment directory (application path must be writeable to apache)
* download jquery.contextmenu and oms to the site directory
* obtain API Keys for [Google Geocoder](https://developers.google.com/maps/documentation/geocoding/get-api-key) and the
  [Google Maps JS API](https://developers.google.com/maps/documentation/javascript/get-api-key)
* copy cgi-bin/annisvis.conf.sample to annisvis.conf and fill out values.
* integrate cgi-bin/apache.conf in your apache configuration (e.g. by placing it in /etc/apache2/modules.d), making sure it loads **after** mod\_wsgi is loaded
* both these files are configured to expect the application in /srv/annisvis but you can set it to any directory
* annisvis.py will cache geocoded locations when the page is loaded for the first time, you can invoke it from the
  command line too to do that
* you can make it re-code the locations by deleting locations\_cache.json

#Sample Deployment
* [remvis](http://www.linguistics.rub.de/annisvis)

#Dependencies
##JavaScript Libraries
* [Google Maps API](https://developers.google.com/maps/)
* [jquery](https://jquery.com/)
* [jquery.contextmenu](https://github.com/joewalnes/jquery-simple-context-menu)
* [Overlapping Marker Spiderfier](https://github.com/jawj/OverlappingMarkerSpiderfier/)

##Python Libraries
* [jsmin](https://github.com/tikitu/jsmin/)
* [Pillow](https://python-pillow.github.io/)
* [GeoPy](https://github.com/geopy/geopy/)
* [lxml](http://lxml.de/)

##Other
* [ANNIS](http://corpus-tools.org)
* Apache and mod\_wsgi
* python 2
