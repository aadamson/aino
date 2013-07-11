# coding: utf-8

import json
from json import JSONEncoder
import logging
import os
import pprint
import urllib2

import requests
from twitter import *

#twitter info

CONSUMER_KEY = "guloV0nVh0nHJ80PxoGBJg"
CONSUMER_SECRET = "dCtKkpdDQgFwu03DDQtLJFkOWKyyRL1iG6GeEnWexo"

class VineError(Exception):
    def __init__(self, response):
        self.code = response["code"]
        self.message = response["error"]

    def __str__(self):
        return str(self.message)

class Vine(object):
    def __init__(self):
	self.twitter = None

    def twitter_login(self):
	MY_TWITTER_CREDS = os.path.expanduser('~/creds')
	if not os.path.exists(MY_TWITTER_CREDS):
	    oauth_dance("Bonfire", CONSUMER_KEY, CONSUMER_SECRET, MY_TWITTER_CREDS)

	oauth_token, oauth_secret = read_token_file(MY_TWITTER_CREDS)

	self.twitter = Twitter(auth=OAuth(oauth_token, oauth_secret, CONSUMER_KEY, CONSUMER_SECRET))
    
    def tag(self, tag, lastID=0, size=15):
        return self.getFromTwitter("#" + tag, lastID, size)

    def recent(self, lastID=0, size=15):
        return self.getFromTwitter(None, lastID, size)
	
    def getVideoURL(self, status):
	url = status['entities']['urls'][0]['expanded_url']
	usock = urllib2.urlopen(url)
	vineHTML = usock.read()
	usock.close()
    
	metaProperty = vineHTML.find("twitter:player:stream")
	videoURLStart = vineHTML.find("https://", metaProperty)
	videoURLEnd = vineHTML.find(".mp4", videoURLStart) + len('.mp4')
	return vineHTML[videoURLStart:videoURLEnd]
    
    def addVideoURLs(self, statuses, count):
	for i in range(0, count-1):
	    url = self.getVideoURL(statuses[i])
	    statuses[i]['videoURL'] = url
	
	return statuses

	
    def getFromTwitter(self, tag, lastID, size):
	q = 'vine.co/v'
	if tag != None:
	    q = q + " " + tag
    
	JSONArray = self.twitter.search.tweets(q=q, count=size, result_type="recent", since_id=lastID, include_entities=1)
	try:
	    return self.addVideoURLs(JSONArray['statuses'], JSONArray['search_metadata']['count'])
	    
	except:
	    print('Error parsing and appending video URLs into JSON arrays')
	    return {}
