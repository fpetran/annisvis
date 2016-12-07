/*exported Marker*/
/*globals SITE_URL, my_map, oms, text_places, openInfoWindow*/
var Marker = function(pos, color, descr, icon_size, place_index) {
    var icon = {
        url: SITE_URL + "?image=" + color,
        //size: new google.maps.Size(255, 255), // actual icon img size
        scaledSize: new google.maps.Size(icon_size, icon_size), // scaled size
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(icon_size / 2, icon_size / 2),
        opacity: 0.5
    };
    var shaded_icon = $.extend({}, icon);
    shaded_icon.url = SITE_URL + "?image=" + color.shade(0.25);

    var marker = new google.maps.Marker({
        position: pos,
        desc: descr["address"] +
              "<br/>Query: " + descr["userInput"] +
              "<br/>matches: " + descr["matches"],
        icon: icon,
        map: my_map
    });
    var my_index;
    function open() {
        openInfoWindow(marker);
    }
    function hide() {
        marker.setMap(null);
    }
    function unHide() {
        marker.setMap(my_map);
    }
    function foreground() {
        marker.setZIndex(marker.getZIndex() + 1);
    }
    function background() {
        marker.setZIndex(marker.getZIndex() - 1);
    }

    var element = $("<div/>", {
        class: "markerEntry",
    }).css("background-color", "#" + color)
      .append($.parseHTML("Query: " + descr["userInput"] +
                          "<br/> matches: " + descr["matches"]));
    function deleteHandler(element) {
        return function() {
            hide();
            text_places[place_index].removeMarker(element);
        };
    }
    element.contextPopup({
          title: "Marker Actions",
          items: [ { label: "Hide this Marker",
                     action: hide },
                   { label: "Un-Hide this Marker",
                     action: unHide },
                   { label: "Foreground this Marker",
                     action: foreground },
                   { label: "Background this Marker",
                     action: background },
                     null,
                   { label: "Delete this Marker",
                     action: deleteHandler(element) }
          ]})
       .click();//openHandler(marker));

    //google.maps.event.addListener(markerclusterer, "click", openHandler(info_window, marker));
    //google.maps.event.addListener(marker, "click", openHandler(info_window, marker));
    oms.addMarker(marker);

    return {
        mapsMarker: marker,
        index: my_index,
        element: element,
        open: open,
        desc: marker.desc,
        place_index: place_index,
        hide: hide,
        unHide: unHide,
        foreground: foreground,
        background: background
    };
};
