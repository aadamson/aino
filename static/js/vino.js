// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


var Vino = (function($) {
    var video =  _V_("v");
    videojs("v").ready(function(){
		console.log("loaded");
		var player = this;
	
		var videoEnd = function(){
			app.draw();
			console.log('ended')
		};
		player.on("ended", videoEnd);
		
		var videoErr = function(){
			app.draw();
			console.log('error')
		};
		player.on("error", videoErr);
		
		var videoLoaded = function(){
			video.play();
			//app.updateTable();
		};
		player.on("loadeddata", videoLoaded);
	});
		
    var load_size = 25; // changed from 20
	
    var cls = function(options) {
        this.options = options;
        
        this.lastID = 0;
   
        this.documentNode = $(document);
		
        this._queue = [];
        this.load(true);
    };
    
    var getRowHTML = function(record) {
			var textline = record['text'].replace(record['entities']['urls'][0]['url'], '<a href="' + record['entities']['urls'][0]['url'] + '">' + record['entities']['urls'][0]['url'] +'</a>');
			var innerHTML = '<td>' + textline + '</td>';
			innerHTML += '<td>' + record['user']['screen_name'] + '</td>';
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
        },
		
        load: function(drawOnResponse) {
            if (this.options.recent) {
                endpoint = this.generateEndpointURL('recent');
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

        updateTable: function(record) {
			var historyTable = document.getElementById('vidtable');
			var newRow = historyTable.insertRow(0);
		
			if(historyTable.rows.length > 10) {
				historyTable.deleteRow(10);
			}
			newRow.innerHTML = getRowHTML(record);
        },

        draw: function() {			
            var q = this._queue;
            if(q.length == 0) {
				this.load(true);
				return;
			}
			
			var nextVideo = q[q.length-1];
			console.log(nextVideo);
			if(nextVideo.videoURL) {
				video.src(nextVideo.videoURL);
				this.updateTable(nextVideo);
				q.pop();
			}
			else {
				q.pop();
				this.draw();
				return;
			}

            if (q.length < load_size) {
				console.log("After executing draw, q.length < 5, calling load");
				this.load(false);
				console.log("New q.length is " + q.length);
            }
        },
        
        generateEndpointURL: function(endpoint) {
            var origin = document.location.origin;
            console.log(origin + '/api/' + endpoint + '/' + this.lastID + '/' + load_size);
            return origin + '/api/' + endpoint + '/' + this.lastID + '/' + load_size;
        },

        generateTagURL: function(tag) {
            var endpoint = 'tags/' + encodeURIComponent(tag);
            return this.generateEndpointURL(endpoint, 0, load_size);
        }
    };

    return cls;
})(window.jQuery || {});
