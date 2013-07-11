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
			var table = document.getElementById('vidtable');
			table.deleteRow(0);
						
			app.draw();
			console.log('error')
		};
		player.on("error", videoErr);
		
		var videoLoaded = function(){
			video.play();
		};
		player.on("loadeddata", videoLoaded);
	});
	
	/**
	 * Function: getRowHTML
	 * --------------------
	 * Given a JSON record associated with a tweet referencing a Vine, 
	 * parses relevant members (abbreviated URL, prof. pic, text), and 
	 * constructs and returns an HTML table row.
	 */
	
	var getRowHTML = function(record) {
		var picline = '<img width=\'48px\' height=\'48px\' src="' + record['user']['profile_image_url'] + '">';
		var textline = record['text'].replace(record['entities']['urls'][0]['url'], 
											  '<a href="' + record['entities']['urls'][0]['url'] + '">' 
											  + record['entities']['urls'][0]['url'] +'</a>');
		textline += '<br>' + record['user']['screen_name'];
		
		var innerHTML = '<td class="profile-pic">' + picline + '</td>';
		innerHTML += '<td class="tweet-text">' + textline + '</td>';
		return innerHTML;
	};
	
	/**
	 * Function: updateTable
	 * ---------------------
	 * Given a JSON record associated with a tweet referencing a Vine, 
	 * finds the table in document with the id 'vidtable', inserts a row,
	 * collects HTML for that row from getRowHTML, and deletes the last 
	 * row if necessary.
	 */
	
	var updateTable = function(record) {
		var historyTable = document.getElementById('vidtable');
		var newRow = historyTable.insertRow(0);
		newRow.innerHTML = getRowHTML(record);
		
		if(historyTable.rows.length > 10) {
			historyTable.deleteRow(historyTable.rows.length - 1);
		}
		
    };
    
    /**
     * membrane
     * --------
     * Used as an object that serves as a go-between, making API calls
     * at user input, and processing changes of state so they can be
     * reflected in the browser.
     */
	
    var membrane = function(options) {
        this.options = options; // either recent = true or a tag
        this._queue = [];
        this.load(true);
    };
    
	var load_size = 25;
	
    membrane.prototype = {
		load: function(drawOnResponse) {
            if (this.options.recent) {
                endpoint = this.generateEndpointURL('recent');
            } else {
                endpoint = this.generateTagURL(this.options.tag);
            }
            
            membraneObject = this;
            console.log('making api call');
            $.get(endpoint, function(response, textStatus, jqXHR) {
				console.log('api call made');
                membraneObject.queue(response);

				if(drawOnResponse){
					console.log("load calling draw...");
					membraneObject.draw();
				}
            }, 'json');
        },
		
		queue: function(data) {
			if (data.length == 0) {
				console.log("Null parameter passed as data to queue");
                //this.load(this._queue.length == 0);
                return false;
            }
			
            var q = this._queue;
            this._queue = this._queue.concat(data);
            
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
				updateTable(nextVideo);
				q.pop();
			}
			else {
				q.pop();
				this.draw();
				return;
			}

            if (q.length < 5) {
				console.log("After executing draw, q.length < 5, calling load");
				this.load(false);
				console.log("New q.length is " + q.length);
            }
        },
        
        /**
         * Function: generateEndpointURL
         * -----------------------------
         */
        generateEndpointURL: function(endpoint) {
            var origin = document.location.origin;

            console.log(origin + '/api/' + endpoint + '/' + load_size);
            return origin + '/api/' + endpoint + '/' + load_size;
        },

        generateTagURL: function(tag) {
			var endpoint = 'tags/' + encodeURIComponent(tag);
            return this.generateEndpointURL(endpoint);
        }
    };

    return membrane;
})(window.jQuery || {});
