import functools
import os
import json
import flask
import vine

application = flask.Flask(__name__)

application.debug=True

'''
Function: cached
----------------
Attempts to retrieve value associated with key formed from API call. The
value is returned if found. Otherwise, the response to the API call is
formed (value) and associated with the key.

Credit to: starlock (github.com/starlock/vino)
'''

def cached(time=None):
    def _cached(f):
        @functools.wraps(f)
        def _f(*args, **kwargs):
            key = "%s__%s__%s" % (f.func_name, args, kwargs)
            data = mc.get(key)
            if not data:
                print("caching response for " + str(time) + " seconds")
                data = f(*args, **kwargs)
                mc.set(key, data, time=time)
            else:
                print("retrieved cached response")
            return data
        return _f
    return _cached

def json_endpoint(f):
    @functools.wraps(f)
    def _json_endpoint(*args, **kwargs):
        return flask.Response(json.dumps(f(*args, **kwargs)), content_type="application/json")
    return _json_endpoint

'''
The next four blocks are flask routing directives. The first two catch 
calls directed at /api/recent/* and /api/tags/* respectively, parses them,
and returns the result of calling the relevant Vine methods. The last two
determine, based on user input, which argument to render tag.html with.
'''

@application.route('/api/recent/<int:size>')
@cached(15)
@json_endpoint
def api_recent(size):
    return v.recent(size)

@application.route('/api/tags/<tag>/<int:size>')
@cached(15)
@json_endpoint
def api_tag(tag, size):
    return v.tag(tag, size=size)

@application.route('/')
def show_recent():
    return flask.render_template('tag.html', recent=True)

@application.route('/<tag>')
def show_tag(tag):
    return flask.render_template('tag.html', tag=tag)

if __name__ == '__main__':
    # The Vine API
    v = vine.Vine()
    v.twitter_login()
    

    # Memcached if available
    if "MEMCACHIER_SERVERS" in os.environ:
        print("memcachier info found")
        os.environ['MEMCACHE_SERVERS'] = os.environ.get('MEMCACHIER_SERVERS', '').replace(',', ';')
        os.environ['MEMCACHE_USERNAME'] = os.environ.get('MEMCACHIER_USERNAME', '')
        os.environ['MEMCACHE_PASSWORD'] = os.environ.get('MEMCACHIER_PASSWORD', '')

    if "MEMCACHE_SERVERS" in os.environ:
        import pylibmc
        print("Loading memcached")
        mc = pylibmc.Client(
            servers=[os.environ.get("MEMCACHE_SERVERS")],
            username=os.environ.get("MEMCACHE_USERNAME"),
            password=os.environ.get("MEMCACHE_PASSWORD"),
            binary=True)
    else:
        class MemcacheDummy(object):
            print("memcached not found, building dummy")
            def get(self, *args):
               return None

            def set(self, *args, **kwargs):
                return None

        mc = MemcacheDummy()

    # The application itself
    port = int(os.environ.get("PORT", 5001))
    application.run(host="0.0.0.0",port=port)
