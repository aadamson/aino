# coding: utf-8

import json
from json import JSONEncoder
import logging
import os
import pprint
import urllib2

import requests
from twitter import *

BASE_URL = "https://api.vineapp.com/"

class VineError(Exception):
    def __init__(self, response):
        self.code = response["code"]
        self.message = response["error"]

    def __str__(self):
        return str(self.message)

class Vine(object):
    def __init__(self):
        self._user_id = None
        self._key = None
	self.twitter = None

    def login(self, username, password):
        response = self._call("users/authenticate", data={"username": username, "password": password})
        self._user_id = response["data"]["userId"]
        self._key = response["data"]["key"]
	
	CONSUMER_KEY = "guloV0nVh0nHJ80PxoGBJg"
	CONSUMER_SECRET = "dCtKkpdDQgFwu03DDQtLJFkOWKyyRL1iG6GeEnWexo"

	MY_TWITTER_CREDS = os.path.expanduser('~/vino/creds')
	if not os.path.exists(MY_TWITTER_CREDS):
	    oauth_dance("Bonfire", CONSUMER_KEY, CONSUMER_SECRET, MY_TWITTER_CREDS)

	oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

	self.twitter = Twitter(auth=OAuth(oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))

    def tag(self, tag_, lastID=0, size=15):
        return self.getFromTwitter("#" + tag_, lastID, size)

    def recent(self, lastID, size=15):
        return self.getFromTwitter(None, lastID, size)
	
    def extractVideoURLFromStatusJSON(self, status):
	url = status['entities']['urls'][0]['expanded_url']

	usock = urllib2.urlopen(url)
	data = usock.read()
	usock.close()
    
	start = data.find("https://vines.s3.amazonaws.com/r/videos/")
	if(start == -1):
	    start = data.find("https://v.cdn.vine.co/r/videos/")
	end = data.find("?", start)
	
	return data[start:end]
	
    def buildVinoArrayFromJson(self, JSONArray):
	vinoArray = {}
	arrCount = 0
	try:
	    count = JSONArray['search_metadata']['count']
	    
	    vinoArray = {'count': arrCount, 'vines': []}
	    
	    statuses = JSONArray['statuses']
	    for i in range(0, count):
		print(i)
		curr = statuses[i]
		currVine = {'VineURL': curr['entities']['urls'][0]['url'], 'screen_name': curr['user']['screen_name'], 'id': curr['id'], 'retweets': curr['retweet_count'], 'created_at': curr['created_at'], 'text': curr['text'], 'videoURL': self.extractVideoURLFromStatusJSON(curr)}
		arrCount += 1
		vinoArray['count'] = arrCount
		vinoArray['vines'].append(currVine)
		
		
	    return JSONEncoder().encode(vinoArray)
	    
	except:
	    return JSONEncoder().encode(vinoArray)
        
    def getFromTwitter(self, tag=None, lastID=0, size=15):
	#try:
	    q = 'vine.co/v'
	    if tag != None:
			q = q + " " + tag
	
	    #if lastID != 0:
		#JSONArray = self.twitter.search.tweets(q=q, count=size, result_type="recent", include_entities=1, since_id=lastID)
	    #else:
	    pp=pprint.PrettyPrinter(depth=4)
	    JSONArray = self.twitter.search.tweets(q=q, count=size, result_type="recent", include_entities=1)
	    pp.pprint(JSONArray)
	    VinoArray = self.buildVinoArrayFromJson(JSONArray)
	    #pp=pprint.PrettyPrinter(depth=4)
	    pp.pprint(VinoArray)
	    #pp.pprint(JSONArray)
	    #pp.pprint(vines['statuses'][1]['entities'])
	    return VinoArray
	#except:
	    #print("error")
	    #return self.getFromTwitter(tag, 0, 1)

    def _call(self, call, params=None, data=None):
        """Make an API call. Return the parsed response. If login has
        been called, make an authenticated call. If data is not None,
        it's a post request.
        """
        url = BASE_URL + call
        headers = {"User-Agent": "com.vine.iphone/1.0.3 (unknown, iPhone OS 6.0.1, iPhone, Scale/2.000000)",
                   "Accept-Language": "en, sv, fr, de, ja, nl, it, es, pt, pt-PT, da, fi, nb, ko, zh-Hans, zh-Hant, ru, pl, tr, uk, ar, hr, cs, el, he, ro, sk, th, id, ms, en-GB, ca, hu, vi, en-us;q=0.8"}
        if self._key:
            headers["vine-session-id"] = self._key
		
	if data:
	    r = requests.post(url, params=params, data=data, headers=headers, verify=False)
	elif twitter==1:
	    return self.getFromTwitter()
	    r = requests.get(url, params=params, headers=headers, verify=False)
        else:
	    r = requests.get(url, params=params, headers=headers, verify=False)
		#else if twitter=1:
			#r = getFromTwitter()
        try:
            data = r.json()
            if data.get("success") is not True:
                raise VineError(data)
            #print(data);
            return data
        except:
            logging.error(r.text)
            raise
