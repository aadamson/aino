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
        this.options = options;

        this.lastID = 0;
   
        this.documentNode = $(document);
		
        this._queue = [];
        this.load(true);
    };

    cls.prototype = {
		 queue: function(data) {
            var vines = data.vines;
            if (vines == null) {
				console.log("Null parameter passed as data to queue");
                return false;
            }
			
            var q = this._queue;
            var count = data.count;
			this.lastID = vines[count-1].id;
			
            for (var i = 0; i < count; i++) {
                current = vines[i];
				if(current != null && current.videoURL != '') {
	                q.push({
						vineURL: current.VineURL,
	                    id: current.id,
	                    video: current.videoURL,
	                    description: current.text,
	                    username: current.screen_name,
	                    created_at: current.created_at,
	                    likes: current.retweets
	                });
				}
            }
        },
		
        load: function(drawOnResponse) {
            if (this.options.recent) {
                endpoint = this.generateEndpointURL('popular', this.lastID, load_size);
            } else {
                endpoint = this.generateTagURL(this.options.tag);
            }
            
            clsObject = this;
            
            $.get(endpoint, function(response, textStatus, jqXHR) {
				response = JSON.parse(response);

                clsObject.queue(response);

				if(drawOnResponse){
					console.log("load calling draw...");
					clsObject.draw();
				}
            }, 'json');
        },
        
        displayNextVideo: function(videoRecord) {
			try {
				video.src(videoRecord.video);
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

        generateVideoHtml: function(record) {
            var vidInfo = '<td>' + record.description + '</td>'
							+ '<td>' + record.username + '</td>'
							+ '<td><a href="' + record.vineURL + '">' + record.vineURL +'</a></td>'
							+ '<td>' + record.likes + '</td>';
							
			var newRow = document.getElementById('vidtable').insertRow(0);
			newRow.innerHTML = vidInfo
        },

        draw: function() {			
            var q = this._queue;
           
            /*while(true) {
				if (q.length == 0) {
					console.log("q.length == 0, calling load");
	                this.load(false); // don't want to draw twice
	                q = this._queue;
				}
				while(q.length > 0 && !(q[q.length-1] in window)) {
					console.log("First video object in queue undefined, removing");
					q.pop();
				}
				if(q.length > 0 && q[q.length-1] in window) break;
			}*/
			
			while(true) {
				var nextVideo = q[q.length-1];
				console.log(nextVideo);
				if(q.length > 0 && this.displayNextVideo(nextVideo)) {
					this.generateVideoHtml(nextVideo);
					q.pop();
					break;
				}
				else {
					console.log('Either !(q.length > 0) || displayNextVideo returned false, dumping queue and calling load');
					q = [];
					this.load(false);
				}
			}

            if (q.length < 5) {
				console.log("After executing draw, q.length < 5, calling load");
				this.load(false);
				console.log("New q.length is " + q.length);
            }
        },
        
        

        

        generateEndpointURL: function(endpoint, lastID, size) {
            var origin = document.location.origin;
            return origin + '/api/' + endpoint + '/' + lastID + '/' + size;
        },

        generateTagURL: function(tag, page) {
            var endpoint = 'tags/' + encodeURIComponent(tag);
            return this.generateEndpointURL(endpoint, 0, load_size);
        }
    };

    return cls;
})(window.jQuery || {});
