import ConfigParser
import sys
import os

my_cfg = ConfigParser.ConfigParser()
my_dir_path = os.path.dirname(os.path.realpath(__file__))
my_cfg.read(os.path.join(my_dir_path, "annisvis.conf"))
sys.path.append(my_cfg.get("Application", "app_path"))

from annisvis import application

