/*exported Query*/
/*globals ANNIS_BASE, Color, Marker, text_places, settings, queries, info_windows*/
// query object
var Query = function(type, id) {
    // private methods & properties
    var userInput;
    var base = ANNIS_BASE + "query/search/count";
    var promises = [];
    var markers = [];
    var element = $("<div/>", {
        id: "query" + id,
        class: "queryListEntry"
    });
    var color = new Color();
    var shadedColor = color.shade(0.25);

    var filter;
    var successHandler;

    var countFilter = function(placeIndex) {
        return function(data, textStatus, jqXHR) {
            return jqXHR.then(function(data) {
                return {
                    placeIndex: placeIndex,
                    count: parseInt(data.getElementsByTagName("matchCount")[0]
                                        .textContent)
                };
            });
        };
    };
    // success handler
    var countHandler = function() {
        var results = {}, total = 0;
        // recombine the results for the same place
        // denoted by placeIndex
        for (var i = 0; i < arguments.length; i++) {
            var count = parseInt(arguments[i].count);
            var placeIndex = arguments[i].placeIndex;
            if (count !== 0) {
                if (results[placeIndex] === undefined)
                    results[placeIndex] = 0;
                results[placeIndex] += parseInt(count);
            }
            total += parseInt(count);
        }
        var num_results = Object.keys(results).length;
        var max = Math.max.apply(Math, Object.keys(results)
                                             .map(function(k) {
                                                return results[k];
                                             }));
        element.append($("<span/>", {
            class: "queryResultDescription",
            text: total + " matches in " + num_results + " places, max: " + max
        }));
        for (var pi in results) {
            var place = text_places[pi];
            var icon_size = 0;
            if (settings.scaling === "global")
                // global scaling: scale by global max
                icon_size = (results[pi] / max) * 100;
            else if (settings.scaling === "local") {
                // local scaling: scale by # of tok in text
                icon_size = (results[pi] / place.size) * 100;
            }

            var m = new Marker({ "lat" : parseFloat(place.location["lat"]),
                                 "lng" : parseFloat(place.location["lng"]) },
                               color,
                               { "address" : place.address,
                                 "userInput" : userInput,
                                 "matches" : results[pi] },
                               icon_size, pi);
            markers.push(m);
            $("#markerlist" + pi).append(m.element);
            text_places[pi].addMarker(m);
        }
    };
    var clickHandler = function(id) {
        return function() {
            queries[id].openAll();
        };
    };
    var allMarkersHandler = function(markers, fn) {
        return function() {
            for (var i = 0; i < markers.length; i++)
                fn(markers[i]);
        };
    };
    var deleteHandler = function() {
        return function() {
            element.remove();
            for (var i = 0; i < markers.length; i++) {
                markers[i].hide();
                text_places[markers[i].place_index].removeMarker(markers[i]);
            }
            delete queries[id];
        };
    };

    // ctor
    if (type === "count") {
        userInput = $("#queryInput").val();
        filter = countFilter;
        successHandler = countHandler;
    } else {
        throw("Unknown query type: " + type);
    }
    element.append($("<div/>",
                   { class: "queryColor" }).css("background-color",
                                                "#" + color.toString()));
    element.contextPopup({
        title: "Query Actions",
        items: [ { label: "Open all Popups",
                   action: allMarkersHandler(markers, function(m) {
                       m.open();
                   }) },
                 { label: "Close all Popups",
                   action: function() {
                       for (var iw in info_windows)
                           info_windows[iw].close();
                       info_windows.splice(0, info_windows.length);
                   }
                 },
                 null,
                 { label: "Hide all Markers",
                   action: allMarkersHandler(markers, function(m) {
                       m.hide();
                   }) },
                 { label: "Un-Hide all Markers",
                   action: allMarkersHandler(markers, function(m) {
                       m.unHide();
                   }) },
                 { label: "Foreground Markers",
                   action: allMarkersHandler(markers, function(m) {
                       m.foreground();
                   }) },
                 //null,
                 //{ label: "Change Colors", action: function() { /* TODO */ } },
                 null,
                 { label: "Delete this Query",
                   action: deleteHandler() }
        ]
    });
    $("#queryList").append(element);

    var executeQuery = function() {
        element.append($("<span/>", {
            class: "queryString",
            text: userInput
        }));
        for (var pi in text_places) {
            var docs = "",
                corpora = "",
                place = text_places[pi];
            for (var doc in place.documents)
                docs += place.documents[doc] + "|";
            for (var corpus in place.corpora)
                corpora += place.corpora[corpus] + ",";
            docs = docs.slice(0, -1);
            corpora = corpora.slice(0, -1);
            var request_string = base + "?q=" +
                encodeURIComponent(userInput + '&meta::annis:doc=/' +
                                   docs + '/') +
                '&corpora=' + corpora;
            promises.push($.get(request_string).then(filter(pi)));
        }
        $.when.apply($, promises).done(successHandler);
        element.click(clickHandler(id));
    };

    // public methods & properties
    return {
        id: id,
        color: color,
        shadedColor: shadedColor,
        userInput: userInput,
        element: element,
        execute: executeQuery
    };
};
