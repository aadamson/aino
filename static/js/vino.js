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
 * bonfire
 * --------
 * Used as an object that serves as a go-between, making API calls
 * at user input, and processing changes of state so they can be
 * reflected in the browser. processUpdates is the only function
 * intended for use as a callback
 */

function bonfire(options) {
	this.options = options; // either recent = true or a tag
	this.video =  _V_("v");
	this._queue = [];
	this.load(true);
}(window.jQuery || {});

var load_size = 20;

bonfire.prototype = {
	/**
	 * Function: load
	 * --------------
	 * Constructs a URL from this.options and leverages jQuery to 
	 * make an API call that returns a JSON array to the callback function.
	 * The response is passed off to queue and possibly to processUpdates
	 * for immediate processing of the JSON records for use in updating
	 * the document.
	 */
	load: function(processUpdatesOnResponse) {
		if (this.options.recent) {
			endpoint = this.generateEndpointURL('recent');
		} else {
			endpoint = this.generateTagURL(this.options.tag); 
		}
		
		bonfireObject = this;
		console.log('making api call');
		$.get(endpoint, function(response, textStatus, jqXHR) {
			console.log('api call made');
			bonfireObject.queue(response);

			if(processUpdatesOnResponse){
				console.log("load calling processUpdates...");
				bonfireObject.processUpdates();
			}
		}, 'json');
	},
	
	/**
	 * Function: queue
	 * ---------------
	 * Checks to see if the array of JSON records passed to it (data)
	 * has any records, and appends the records to this._queue if it does.
	 */
	
	queue: function(data) {
		if (data.length == 0) {
			console.log("Null parameter passed as data to queue");
			return; // load will attempt to processUpdates, which will 
					// recognize lack of records and call load again
		}
	
		this._queue = this._queue.concat(data);
	},
	
	/**
	 * Function: processUpdates
	 * --------------
	 * After determining that the queue is not empty (and calling
	 * load and returning if it is), updates the source of the video.js
	 * object and calls updateTable if the last video in the queue has
	 * a videoURL attached to it. Otherwise, pops the URL-less JSON record
	 * off the top of the queue and calls processUpdates again to try to process the
	 * next record.
	 * Before returning, the function checks to see if there are less than five
	 * records in the queue and loads more if there are.
	 */
	processUpdates: function() {			
		var q = this._queue;
		if(q.length == 0) {
			this.load(true); // bug: obscure tags timeout here because load_size is larger than the number of recent vines for a 
							 // particular tag
			return;
		}
		
		var nextVideo = q[q.length-1];
		console.log(nextVideo);
		if(nextVideo.videoURL) {
			this.video.src(nextVideo.videoURL);
			updateTable(nextVideo);
			q.pop();
		}
		else {
			q.pop();
			this.processUpdates();
			return;
		}

		if (q.length < 5) {
			console.log("After executing processUpdates, q.length < 5, calling load");
			this.load(false);
			console.log("New q.length is " + q.length);
		}
	},
	
	/**
	 * Function: generateEndpointURL
	 * -----------------------------
	 * Given endpoint, constructs the path of an API call to be made
	 * by jQuery.
	 */
	generateEndpointURL: function(endpoint) {
		var origin = document.location.origin;

		console.log(origin + '/api/' + endpoint + '/' + load_size);
		return origin + '/api/' + endpoint + '/' + load_size;
	},
	
	/**
	 * Function: generateTagURL
	 * ------------------------
	 * Given a tag string, appends it to 'tags/' and passes the appended
	 * string to generateEndpointURL for further appendages before
	 * returning the string.
	 */

	generateTagURL: function(tag) {
		var endpoint = 'tags/' + encodeURIComponent(tag);
		return this.generateEndpointURL(endpoint);
	}
}
