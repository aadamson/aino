// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


var Vino = (function($) {
    var video =  _V_("v");
    var videoContainer = $('#videos');
		
    var load_size = 15; // changed from 20
	
    var cls = function(options) {
        this.options = options;

        this.page = 0;
        this.hasNextPage = false;
        this.lastResponse = {};
        this.isLoading = false;
        this.lastID = 0;
        

        this.documentNode = $(document);
		
		this.recentVideoHTML = [];
        this._queue = [];
        this.load(true);
    };

    cls.prototype = {
        load: function(drawOnResponse) {
            var self, callback, endpoint;
            if (drawOnResponse !== false) {
                drawOnResponse = true;
            }

            this.page += 1;

            if (this.options.recent) {
                endpoint = this.generateEndpointURL('popular', this.lastID, load_size);
            } else {
                endpoint = this.generateTagURL(this.options.tag);
            }

            self = this;
            this.isLoading = true;
            $.get(endpoint, function(response, textStatus, jqXHR) {
				response = JSON.parse(response);
                this.lastResponse = response;
                
				if(response.count > 1) {
					self.hasNextPage = true;
				}

                self.queue(response);
                self.isLoading = false;

                if (self.page == 1 || drawOnResponse) {
                    self.draw();
				}
            }, 'json');
        },

        queue: function(data) {
            var vines = data.vines;
            if (vines == null) {
                return false;
            }
			
            var q = this._queue;
            var count = data.count;
			this.lastID = vines[0].id;
			
            for (var i = 0; i < count; i++) {
                current = vines[i];
          
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
        },
        
        updateInfoTable: function(vidInfo) {
			this.recentVideoHTML.push(vidInfo);
			var count = this.recentVideoHTML.length;
			if(count > 10) {
				recentVideoHTML.pop();
			}
			var newHTML = "";
			for(var i = 0; i < count; i++) {
				newHTML.concat(this.recentVideoHTML[i]);
			}
			videoContainer = newHTML;
		},
				
        
        generateVideoHtml: function(record, width, height) {
			while(record == undefined){
				this.load(true);
			}
            video.src(record.video);
            video.play;
            
            var vidInfo = '<table><tr><td>' + record.description + '</td>'
							+ '<td>' + record.username + '</td>'
							+ '<td><a href="' + record.vineURL + '">' + record.vineURL +'</a></td>'
							+ '<td>' + record.likes + '</td>'
							+ '</tr></table>';
			videoContainer.append(vidInfo);
        },

        redraw: function() {
            // Reset queue to current page in order to redraw
            this.queue(this.lastResponse);
            this.load(true);
        },

        draw: function() {			
            var q = this._queue;
            if (!q.length) {
                this.load(true);
            }

            var container, width, height,
                count, current;
            
            this.generateVideoHtml(q[q.length-1], width, height);

            q.pop();
            count = q.length;

            if (this.hasNextPage) {
                return;
            }

            if (!count) {
				this.load(false);
                return;
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
