/*exported TextPlace*/
// a simple-ish wrapper object that keeps track of all the markers
// for a text
var TextPlace = function(jsonData, size) {
    var markers = [],
        openMarker = null,
        documents = [],
        corpora = [],
        _size = size,
        _location = jsonData["location"],
        _address = jsonData["address"];
    var removeMarker = function(marker) {
        // can be called with marker or marker element
        // this is necessary because Marker object
        // can't pass itself
        try {
            marker.element.remove();
            markers = markers.filter(function(e) { return e !== marker; });
        } catch(err) {
            marker.remove();
            markers = markers.filter(function(e) { return e.element !== marker; });
        }

    };
    var addMarker = function(marker) {
        markers.push(marker);
        return this;
    };
    var openNextMarker = function() {
        if (markers.length === 0) {
            return;
        }
        if (openMarker !== null) {
            markers[openMarker].background();
            markers[openMarker].close();
            openMarker++;
        } else {
            openMarker = 0;
        }
        if (openMarker === markers.length) {
            openMarker = 0;
        }
        markers[openMarker].open();
        markers[openMarker].foreground();
    };

    for (var i = 0; i < jsonData["texts"].length; ++i) {
        var doc = jsonData["texts"][i]["doc"],
            corpus = jsonData["texts"][i]["corpus"];
        if (documents.indexOf(doc) === -1)
            documents.push(doc);
        if (corpora.indexOf(corpus) === -1)
            corpora.push(corpus);
    }

    return {
        size: _size,
        location: _location,
        address: _address,
        documents: documents,
        corpora: corpora,
        openNextMarker: openNextMarker,
        removeMarker: removeMarker,
        addMarker: addMarker,
        markers : markers
    };
};
