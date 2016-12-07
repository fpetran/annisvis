/*exported ANNIS_BASE, SITE_URL, initialize, settings, queries, my_map, oms*/
/*globals TextPlace, Query, Color*/
var my_map;
// overlappingmarkerspiderfier
var oms;
// polygon of all locations for map centering
var bounds = new google.maps.LatLngBounds();
// array containing all texts, texts with same place
// get one entry
var text_places = [];
var queries = {};
var settings = {
    scaling: "global"
};
// since a new InfoWindow is created every time it is opened
// we need to keep track of the open ones in case we want to
// close them all.
// because with oms, the click event goes to the global oms
// event instead of to the marker, the Marker object can't do this
var info_windows = [];
// these two are configured when the js is served via python
var ANNIS_BASE = "%(annis_service)s/";
var SITE_URL = "%(site_url)s/";

function reCenter() {
    my_map.fitBounds(bounds);
    my_map.setCenter(bounds.getCenter());
}

function openInfoWindow(marker) {
    var iw = new google.maps.InfoWindow();
    iw.setContent(marker.desc);
    iw.open(my_map, marker);
    info_windows.push(iw);
    function closeHandler() {
        return function() {
            var i = info_windows.indexOf(iw);
            info_windows.splice(i, 1);
        };
    }
    iw.addListener('closeclick', closeHandler());
    return iw;
}

function initialize() {
    var map_options = {
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    my_map = new google.maps.Map(document.getElementById("map_canvas"),
                                     map_options);

    $.getJSON(SITE_URL + "textlist.json", function(data) {
        text_places = data;
        var textlist_element = $("#textlistbox");
        // handle collapsing the marker list in locations tab
        var textListClickHandler = function(event) {
            var markerlist = $(event.target).children(".markerList")[0];
            $(markerlist).toggleClass("openedMarker");
        };
        for (var i = 0; i < text_places.length; ++i) {
            var loc = text_places[i]["location"];
            bounds.extend(new google.maps.LatLng(parseFloat(loc["lat"]),
                                                 parseFloat(loc["lng"])));
            // calculate place size for local scaling
            var place_size = 0;
            var docs = "";
            for (var j = 0; j < text_places[i]["texts"].length; ++j) {
                place_size += parseInt(text_places[i]["texts"][j]["size"]);
                docs += text_places[i]["texts"][j]["doc"] + ", ";
            }
            // remove last comma
            docs = docs.slice(0, -2);

            text_places[i] = new TextPlace(text_places[i], place_size);
            var element = $("<div/>", {
                id: "place" + i,
                class: "textListEntry",
                text: text_places[i]["address"] + " (" + docs + ")"
            }).click(textListClickHandler)
            .append($("<div/>", {
                id: "markerlist" + i,
                class: "markerList"
            }));
            textlist_element.append(element);
        }
        reCenter();
    });
    oms = new OverlappingMarkerSpiderfier(my_map, {
              nearbyDistance: 35,
              circleSpiralSwitchover: Infinity,
              markersWontMove: true
    });
    oms.addListener('click', function(marker) { openInfoWindow(marker); });
    oms.addListener('spiderfy', function(markers) {
        for (var i = 0; i < markers.length; ++i) {
            var icon_url = markers[i].icon.url;
            var new_color = icon_url.substr(icon_url.length - 6)
                                    .match(/.{1,2}/g);
            for (var c = 0; c < 3; ++c) {
                new_color[c] = parseInt("0x" + new_color[c]);
            }
            new_color = new Color(new_color);
            new_color = new_color.shade(0.25);
            var new_icon = $.extend({}, markers[i].icon);
            new_icon.url = SITE_URL + "?image=" + new_color;
            markers[i].old_icon = markers[i].icon;
            markers[i].setIcon(new_icon);
        }
    });
    oms.addListener('unspiderfy', function(markers) {
        for (var i = 0; i < markers.length; ++i) {
            markers[i].setIcon(markers[i].old_icon);
        }
    });

    // click handler for the tabs
    $(".tabs ul li").click(function() {
        $(".activeTab").removeClass("activeTab");
        $(this).addClass("activeTab");
    });
    $("#queryOk").click(function() {
        var query_id = Object.keys(queries).length;
        if (query_id === undefined)
            query_id = 0;
        var query = new Query("count", query_id);
        queries[query_id] = query;
        query.execute();
    });
    $("#reCenter").click(function() {
        reCenter();
    });
    $("#relativeScaling").click(function() {
        if (settings.scaling == "global")
            settings.scaling = "local";
        else if (settings.scaling == "local")
            settings.scaling = "global";
    });
}

