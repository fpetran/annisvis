/// a color object
/// initializes to a uniform random rgb color without parms
/// copy by passing [ R, G, B ] as first parameter
var Color = function() {
    var _rgb = [];
    function tint(factor) {
        var rgb = [];
        for (var i = 0; i < 3; ++i)
            rgb.push(Math.floor((255 - _rgb[i]) * factor));
        return new Color(rgb);
    }
    function shade(factor) {
        var rgb = [];
        for (var i = 0; i < 3; ++i)
            rgb.push(Math.floor(_rgb[i] * (1 - factor)));
        return new Color(rgb);
    }

    // ctor
    if (arguments.length === 0) {
        for (var i = 0; i < 3; ++i)
            _rgb.push(Math.floor(Math.random() * 255));
    } else {
        //if (arguments[0] instanceof Array)
            _rgb = arguments[0];
        //else
            //_rgb = arguments[0].match(/.{1,2}/);
    }

    return {
        rgb: _rgb,
        tint: tint,
        shade: shade,
        toString: function() {
            var strval = "";
            for (var i = 0; i < 3; ++i) {
                strval += ("00" + _rgb[i].toString(16)).substr(-2);
            }
            return strval;
        }
    };
};

