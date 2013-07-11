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

'''
Function: getVideoURL
---------------------
Attempts to open a socket to the URL gleaned from the passed JSON object
(status). Stores the HTML at the URL. The HTML's metadata is then parsed
for the .mp4 file associated with the "twitter:player:stream" property.
The .mp4 file's address is returned. Returns the empty string on error.
'''

def getVideoURL(status):
    try:
	url = status['entities']['urls'][0]['expanded_url']
	usock = urllib2.urlopen(url)
	vineHTML = usock.read()
	usock.close()
    except:
	print('Socket error in getVideoURL')
	return ''
    
    metaProperty = vineHTML.find("twitter:player:stream")
    videoURLStart = vineHTML.find("https://", metaProperty)
    videoURLEnd = vineHTML.find(".mp4", videoURLStart) + len('.mp4')
    return vineHTML[videoURLStart:videoURLEnd]

def addVideoURLs(statuses, count):
    for i in range(0, count-1):
	url = getVideoURL(statuses[i])
	statuses[i]['videoURL'] = url
    
    return statuses

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
    
    def tag(self, tag, size=15):
        return self.getFromTwitter("#" + tag, size)

    def recent(self, size=15):
        return self.getFromTwitter(None, size)
    
    '''
    Function: getFromTwitter
    ------------------------
    After attempting to append a tag to the vine video url, sends a 
    query through the twitter search API and receives a JSON array of
    recent tweets (with the relevant tag). Calls addVideoURLs to append
    the URL of the .mp4 file of the referenced Vine submission to each
    array member, and returns the result. If addVideoURLs fails, returns
    an empty JSON array.
    '''
    
    def getFromTwitter(self, tag, size):
	q = 'vine.co/v'
	if tag != None:
	    q = q + " " + tag
    
	tweets = self.twitter.search.tweets(q=q, count=size, result_type="recent", include_entities=1)
	try:
	    return addVideoURLs(tweets['statuses'], tweets['search_metadata']['count'])
	    
	except:
	    print('Error parsing and appending video URLs into JSON arrays')
	    return JSONEncoder().encode({}) 
