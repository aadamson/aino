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
	print(url)
	usock = urllib2.urlopen(url)
	vineHTML = usock.read()
	usock.close()
    
	videoDivEnd = vineHTML.find("video/mp4")
	videoURLStart = vineHTML.rfind("https://", 0, videoDivEnd)
	videoURLEnd = vineHTML.find(".mp4", videoURLStart) + len('.mp4')
	return vineHTML[videoURLStart:videoURLEnd]

    ''' 
    
	
    def buildHTMLRow(tweet):
	innerHTML = '<td>' + tweet['text'] + '</td>'
	innerHTML += '<td>' + tweet['user']['screen_name'] + '</td>'
	innerHTML += '<td><a href="' + tweet['entities']['urls'][0]['url'] + '">' + tweet['entities']['urls'][0]['url'] +'</a></td>'
	innerHTML += '<td>' + tweet['retweet_count'] + '</td>'
	return innerHTML
    '''
    
    def addVideoURLs(self, statuses, count):
	for i in range(0, count-1):
	    url = self.getVideoURL(statuses[i])
	    statuses[i]['videoURL'] = url
	    print(statuses[i])
	
	return statuses

	
    def getFromTwitter(self, tag, lastID, size):
	q = 'vine.co/v'
	if tag != None:
	    q = q + " " + tag
    
	JSONArray = self.twitter.search.tweets(q=q, count=size, result_type="recent", since_id=lastID, include_entities=1)
	for i in range(0, JSONArray['search_metadata']['count']-1):
	    url = self.getVideoURL(JSONArray['statuses'][i])
	    JSONArray['statuses'][i]['videoURL'] = url
	    #print(statuses[i])
	
	return JSONArray['statuses']
	#statuses = self.addVideoURLs(JSONArray['statuses'], JSONArray['search_metadata']['count'])
	#print(JSONArray)
	#return statuses
