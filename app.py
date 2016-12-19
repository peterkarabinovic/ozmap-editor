# -*- coding: utf-8 -*-
# from gevent import monkey
# monkey.patch_all()
import codecs
import os
from flask import Flask, jsonify
from flask import send_from_directory
from gevent import wsgi

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
    f = os.path.join('.', 'data', 'tenats.txt')
    with codecs.open(f, 'r', "utf-8") as file:
        pairs = [ line.split('-') for line in file.readlines()]
        tenant_list = [ {"id": it[0].strip(), "title":it[1].strip() } for it in pairs]
        return jsonify(tenant_list)



# f = os.path.join('.', 'data', 'tenats.txt')
# with codecs.open(f, 'r', "utf-8") as file:
#     pairs = [ line.split(u'-') for line in file.readlines()]
#     tenant_list = [{"id": it[0].strip(), "title": it[1].strip()} for it in pairs]
#     print tenant_list



server = wsgi.WSGIServer(('127.0.0.1', 5000), application=app, log=None)
server.serve_forever()

