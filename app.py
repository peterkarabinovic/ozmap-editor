# -*- coding: utf-8 -*-
# from gevent import monkey
# monkey.patch_all()
import codecs
import json
import os
import random
from flask import Flask, jsonify
from flask import send_from_directory
from gevent import wsgi

# Подготавливаем tenants.json
tenants_json = os.path.join('.', 'data', 'tenants.json')
if not os.path.exists(tenants_json):
    f = os.path.join('.', 'data', 'tenats.txt')
    with codecs.open(f, 'r', "utf-8") as file:
        pairs = [ line.split('-') for line in file.readlines()]
        tenants = { it[0].strip() : dict(title=it[1].strip(), floor=i % 3 + 1, geom=None) for i, it in enumerate(pairs) }
        with codecs.open(tenants_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(tenants, ensure_ascii=False))


app = Flask(__name__, static_folder='')


@app.route('/')
def index():
  return app.send_static_file('index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path)

@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory('data', path)

@app.route('/tenants/')
def tenants():
    with codecs.open(tenants_json, 'r', "utf-8") as file:
        return file.read()


server = wsgi.WSGIServer(('127.0.0.1', 5000), application=app, log=None)
server.serve_forever()

