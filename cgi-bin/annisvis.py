# Copyright 2016 Florian Petran
#
# server component of ANNISVis
#

import os
from lxml import etree, objectify
import json
from PIL import Image, ImageDraw, ImageColor
from geopy.geocoders import GoogleV3
from jsmin import jsmin
import sys
# python 2
reload(sys)
sys.setdefaultencoding("utf-8")
import cStringIO
import ConfigParser
from urllib import urlopen
from urlparse import parse_qs
# python 3 equivalents
#from io import BytesIO
#import configparser
#from urllib.request import urlopen
#from urllib.parse import parse_qs

# generate circle in rgb color
def generate_circle(color):
    img = Image.new("RGBA", (255, 255), (255, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([5, 5, 250, 250],
                 fill=ImageColor.getrgb(color),
                 outline=(0,0,0))

    f = cStringIO.StringIO()
    img.save(f, "PNG")
    f.seek(0)
    return f.read()

# read locations from predefined file or geocode otherwise
# also write a locations cache if geocoder was queried
def get_locations(cfg, texts):
    locations = {}
    locations_file = os.path.join(cfg.get("Application", "app_path"),
                                  cfg.get("Application", "locations_file"))
    locations_cache_file = os.path.join(cfg.get("Application", "app_path"),
                                        "locations_cache.json")
    # if the cache already exists it will not be regenerated
    if not os.path.isfile(locations_cache_file):
        if os.path.isfile(locations_file):
            lfile = open(locations_file).read().decode()
            locations = json.loads(lfile)
        locator = GoogleV3(api_key = cfg.get("API_keys", "geocoder"))
        for sigle in texts:
            address = texts[sigle]["address"]
            if not address in locations:
                loc = locator.geocode(address)
                if not loc == None:
                    locations[address] = { "lat": loc.latitude,
                                           "lng": loc.longitude }
                else:
                    locations[address] = "NONE"
        with open("locations_cache.json", "w") as locations_cache:
            json.dump(locations, locations_cache)
    else:
        lfile = open(locations_cache_file).read().decode()
        locations = json.loads(lfile)
    return locations

# return the list of texts and corpora
def get_texts(cfg):
    annis_service = cfg.get("Server", "annis_service")
    corpora = []
    xml = urlopen(annis_service + "/query/corpora").read()
    xml = objectify.fromstring(xml)
    for elem in xml.annisCorpus:
        corpora.append(elem.name)

    texts = {}
    for corpus in corpora:
        xml = urlopen(annis_service +
                      "/meta/corpus/" +
                      corpus + "/closure").read()
        xml = objectify.fromstring(xml)
        for anno in xml.annotation:
            if anno.value == "-" or anno.value == "":
                continue
            if anno.name == cfg.get("Annotations", "location_key"):
                location = str(anno.value)
                # this is a bit hacky and somewhat project specific:
                # question marks are filtered out, it marked where annotators
                # where unsure
                location = location.replace("(?)", "").replace("?", "").strip()
                texts[str(anno.corpusName)] = { "corpus" : str(corpus),
                                                "address" : location.decode() }
                break
            if anno.name == cfg.get("Annotations", "location_key_fallback"):
                location = str(anno.value).strip()
                texts[anno.corpusName] = { "corpus" : str(corpus),
                                            "address" : location.decode() }
    return texts

# text size is number of tok
def get_text_size(cfg, doc, corpus):
    annis_service = cfg.get("Server", "annis_service")
    # the url below is hardcoded, but that's okay because the doc
    # name is always meta::annis:doc
    req_url = (annis_service +
          '/query/search/count?q=tok%26%20meta%3A%3Aannis%3Adoc%3D"' +
          doc + '"&corpora=' + corpus)
    xml = urlopen(req_url).read()
    xml = objectify.fromstring(xml)
    size = int(xml[0].matchCount)
    return size

# serve corpora list as json
def serve_corpora(cfg, start_response):
    texts = get_texts(cfg)
    locations = get_locations(cfg, texts)
    text_places = {}
    # update locations for texts
    for sigle in texts:
        address = texts[sigle]["address"]
        try:
            texts[sigle]["location"] = locations[address]
        except KeyError:
            print("Location not found in cache/list: " + address)
            print("Skipping text " + sigle)
            continue
        loc_str = str(locations[address])
        if not loc_str in text_places:
            text_places[loc_str] = {
                    "address" : address,
                    "location" : locations[address],
                    "texts" : []
            }
        text_places[loc_str]["texts"].append({
            "doc" : str(sigle),
            "corpus" : texts[sigle]["corpus"],
            "size" : get_text_size(cfg, sigle, texts[sigle]["corpus"])
        })
    # remove texts w/o location
    del text_places["NONE"]
    # at this point we don't need the keys any more so
    # we can convert to a list
    text_places = [ p for p in text_places.values() ]
    text_places = json.dumps(text_places)

    response_headers = [
            ('Content-Type', 'application/json'),
            ('Content-Length', str(len(text_places)))
            ]
    start_response('200 OK', response_headers)
    return [ text_places ]

def serve_image(color, start_response):
    img = generate_circle("#" + color)
    start_response('200 OK', [ ('Content-Type', 'image/png'),
                               ('Content-Length', str(len(img))) ] )
    return [ img ]

def serve_html(cfg, start_response):
    html = open(os.path.join(cfg.get("Application", "app_path"),
                "frontend.html")).read()

    html = html % {
        'site_url' : cfg.get("Server", "site_url"),
        'maps_api_key' : cfg.get("API_keys", "maps")
    }
    html = bytes(html)
    status = '200 OK'

    response_headers = [
            ('Content-Type', 'text/html'),
            ('Content-Length', str(len(html)))
            ]
    start_response(status, response_headers)
    return [html]

def serve_js(cfg, start_response):
    js_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "js")
    js_files = [f for f in os.listdir(js_path)
                if os.path.isfile(os.path.join(js_path, f))]
    js = ""
    for f in js_files:
        if not f.endswith(".js"):
            continue
        with open(os.path.join(js_path, f), 'r') as jsfile:
            js += jsfile.read()
    js = js % {
            'site_url' : cfg.get("Server", "site_url"),
            'annis_service': cfg.get("Server", "annis_service")
    }
    js = bytes(jsmin(js))
    start_response('200 OK', [('Content-Type', 'text/javascript'),
                              ('Content-Length', str(len(js)))])
    return [js]

def application (environ, start_response):
    d = parse_qs(environ['QUERY_STRING'])

    image_color = d.get("image", [""])[0]
    if image_color != "":
        return serve_image(image_color, start_response)

    cfg = ConfigParser.ConfigParser()
    dir_path = os.path.dirname(os.path.realpath(__file__))
    cfg.read(os.path.join(dir_path, "annisvis.conf"))

    if environ['PATH_INFO'] == "/annisvis.js":
        return serve_js(cfg, start_response)

    if environ['PATH_INFO'] == "/textlist.json":
        return serve_corpora(cfg, start_response)

    return serve_html(cfg, start_response)

# create locations cache when called directly
# this can help if apache has permissions problems
if __name__ == "__main__":
    cfg = ConfigParser.ConfigParser()
    dir_path = os.path.dirname(os.path.realpath(__file__))
    cfg.read(os.path.join(dir_path, "annisvis.conf"))
    texts = get_texts(cfg)
    get_locations(cfg, texts)

