// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


var Vino = (function($) {
    var video =  _V_("v");
		
    var load_size = 15; // changed from 20
	
    var cls = function(options) {
		this.numTableRows = 0;
        this.options = options;

        this.lastID = 0;
   
        this.documentNode = $(document);
		
        this._queue = [];
        this.load(true);
    };
    
    var getRowHTML = function(record) {
			var innerHTML = '<td>' + record['text'] + '</td>';
			innerHTML += '<td>' + record['user']['screen_name'] + '</td>';
			innerHTML += '<td><a href="' + record['entities']['urls'][0]['url'] + '">' + record['entities']['urls'][0]['url'] +'</a></td>';
			innerHTML += '<td>' + record['retweet_count'] + '</td>';
			return innerHTML;
	};

    cls.prototype = {
		 queue: function(data) {
            if (data == null) {
				console.log("Null parameter passed as data to queue");
                return false;
            }
			
            var q = this._queue;
            this._queue = this._queue.concat(data);
            
            this.lastID = data[data.length-1].id;
            
            //var count = data.count;
			
			//#q += vines;
			
            /*for (var i = 0; i < count; i++) {
                current = vines[i];
				if(current != null && current.videoURL != '') {
	                q.push({
						vineURL: current.tweetedURL,
	                    id: current.id,
	                    videoURL: current.videoURL,
	                    tweetText: current.text,
	                    username: current.screen_name,
	                    created_at: current.created_at,
	                    retweets: current.retweets
	                });
				}
            }*/
        },
		
        load: function(drawOnResponse) {
            if (this.options.recent) {
                endpoint = this.generateEndpointURL('recent', this.lastID, load_size);
            } else {
                endpoint = this.generateTagURL(this.options.tag);
            }
            
            clsObject = this;
            console.log('making api call');
            $.get(endpoint, function(response, textStatus, jqXHR) {
				console.log('api call made');
                clsObject.queue(response);

				if(drawOnResponse){
					console.log("load calling draw...");
					clsObject.draw();
				}
            }, 'json');
        },
        
        getHTMLfromURL: function(url) {
			httpRequest = new XMLHttpRequest();
			httpRequest.onreadystatechange=function() {
		        if (httpRequest.readyState==4 && httpRequest.status==200) {
		            return httpRequest.responseText;
		        }
		    }
		    httpRequest.open("GET", url, false );
			httpRequest.send();
		},
		    
        
        displayNextVideo: function(videoRecord) {
			var url = videoRecord['entities']['urls'][0]['expanded_url'];
			var response = this.getHTMLfromURL(url);
			response = response.to_string();
			var toVideoDivEnd = response.slice(0, response.search('video/mp4'));
			videoURL = toVideoDivEnd.slice(response.lastIndexOf('https://'), response.lastIndexOf('.mp4') + 4);

			
			try {
				video.src(videoURL);
			}
			catch(err) {
				console.log('Error with video.src');
				return false;
			}
			try {
				video.play;
			}
			catch(err) {
				console.log('Error with video.play');
				return false;
			}
			//}
			/*catch(err) {
				console.log('Encountered type error while trying to play new video. Attempting to draw next video via call to draw.');
				return false;
			}*/
			
			return true;
		},
		
		

        updateTable: function(record) {
			var newRow = document.getElementById('vidtable').insertRow(0);
			this.numTableRows += 1;
			if(this.numTableRows >= 10) {
				document.getElementById('vidtable').deleteRow(10);
				this.numTableRows -= 1;
			}
			newRow.innerHTML = getRowHTML(record);
        },

        draw: function() {			
            var q = this._queue;
			
			while(true) {
				var nextVideo = q[q.length-1];
				console.log(nextVideo);
				if(q.length > 0 && this.displayNextVideo(nextVideo)) {
					this.updateTable(nextVideo);
					q.pop();
					break;
				}
				else {
					console.log('Either !(q.length > 0) || displayNextVideo returned false, dumping queue and calling load');
					q = [];
					this.load(false);
				}
			}

            if (q.length < 45) {
				console.log("After executing draw, q.length < 5, calling load");
				this.load(false);
				console.log("New q.length is " + q.length);
            }
        },
        
        

        

        generateEndpointURL: function(endpoint, lastID, size) {
            var origin = document.location.origin;
            console.log(origin + '/api/' + endpoint + '/' + lastID + '/' + size);
            return origin + '/api/' + endpoint + '/' + lastID + '/' + size;
        },

        generateTagURL: function(tag) {
            var endpoint = 'tags/' + encodeURIComponent(tag);
            return this.generateEndpointURL(endpoint, 0, load_size);
        }
    };

    return cls;
})(window.jQuery || {});
