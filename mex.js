///@idea Automagically queue concurrent requests when they reach a set limit (default 6, because browsers)
///@idea Possibility of adding support for XHR's "withCredentials" and/or XHR.open user and password
///@idea Possibility of adding support for setting XHR's request headers
///@idea Possibility of adding support for retrieving XHR's response headers
///@idea Possibility of adding support for overriding the mimetype
///@idea Possibility of adding support for binary sending
///@idea Possibility of adding support for more than the http protocol (e.g. file, ftp)

///@todo further down the road, support ecma classes instead of these older imitations

///@todo check if it is interesting to change content-type header when using json and xml parser
///@todo check if it is interesting to always override the mimetype when using the xml parser

///@todo make a debuggable version

// Definition of a volatile class and autocreation of a singleton based off it, all in one step. The "Mex" object name is set in the "constructor".
new ( function ()
{
	
	// Helper functions  --  <editor-fold defaultstate="expanded" desc="Helper functions">
	
	/**
	 * Checks if something is a valid string.
	 * @param {string} test_string The string to be tested.
	 * @returns {bool} True is it is a string, false otherwise.
	 */
	function _Is_string ( test_string )
	{
		if ( typeof test_string == 'string' ) return true;
		if ( test_string instanceof String ) return true;
		
		return false;
	}
	
	
	/**
	 * Tests whether something is a reference to a function (that is, a callback).
	 * @param {mixed} callback The reference to test.
	 * @returns {bool} True if it is a reference to a function, false otherwise.
	 */
	function _Is_callback ( callback )
	{
		return callback instanceof Function;
	}
	
	
	/**
	 * A custom parseInt which also tests against NaN.
	 * @param {mixed} value The value to convert to int.
	 * @returns {int|false} If the value could be converted safely to int, the converted value. False if the value couldn't be converted.
	 */
	function _Parse_int ( value )
	{
		var v;
		
		return !isNaN( v = parseInt( value ) ) ? v : false;
	}
	
	
	//</editor-fold>
	
	
	this.HTTP_code = function ()
	{
		Object.defineProperties
		(
			this,
			{
//				number: { get: function () { return number; }, set: function ( value ) { Number( value ); } },
//				has_result: { get: function () { return has_result; }, set: function ( value ) { Has_result( value ); } }
			}
		);
	};
	
	
	// Mex.Request code  --  <editor-fold defaultstate="expanded" desc="Mex.Request code">
	
	/**
	 * The Mex.Request "class". Through a Mex.Request object you can easily configure and send a XMLHttpRequest with Mex features such as queueing 
	 * and automatic retrying.
	 * @param {string} initial_uri Optional. If set, the request will be initialized with this URI in the Mex.Request.uri property.
	 * @param {FormData} initial_data Optional. If set, the request will be initialized with this data in the Mex.Request.data property.
	 */
	this.Request = function ( initial_uri, initial_data )
	{
		
		// Properties
		
		Object.defineProperties
		(
			this,
			{
				uri: { get: function () { return uri; }, set: function ( value ) { this.Uri( value ); } },
				method: { get: function () { return method; }, set: function ( value ) { this.Method( value ); } },
				
				timeout: { get: function () { return timeout; }, set: function ( value ) { this.Timeout( value ); } },
				retries: { get: function () { return retries; }, set: function ( value ) { this.Retries( value ); } },
				
				data: { get: function () { return data; }, set: function ( value ) { this.Data( value ); } },
				context: { get: function () { return context; }, set: function ( value ) { this.Context( value ); } },
				
				parse_result: { get: function () { return parse_result; }, set: function ( value ) { this.Parse_result( value ); } },
				parser: { get: function () { return parser; }, set: function ( value ) { this.Parser( value ); } },
				
				//////////////
				
				on_before_send:       { get: function () { return on_before_send; }, set: function ( value ) { this.On_before_send( value ); } },
				on_send:              { get: function () { return on_send; }, set: function ( value ) { this.On_send( value ); } },
				on_transfer_start:    { get: function () { return on_transfer_start; }, set: function ( value ) { this.On_transfer_start( value ); } },
				on_transfer_progress: { get: function () { return on_transfer_progress; }, set: function ( value ) { this.On_transfer_progress( value ); } },
				on_transfer_success:  { get: function () { return on_transfer_success; }, set: function ( value ) { this.On_transfer_success( value ); } },
				on_transfer_end:      { get: function () { return on_transfer_end; }, set: function ( value ) { this.On_transfer_end( value ); } },
				on_response:          { get: function () { return on_response; }, set: function ( value ) { this.On_response( value ); } },
				on_success:           { get: function () { return on_success; }, set: function ( value ) { this.On_success( value ); } },
				on_end:               { get: function () { return on_end; }, set: function ( value ) { this.On_end( value ); } },
				
				on_abort: { get: function () { return on_abort; }, set: function ( value ) { this.On_abort( value ); } },
				on_retry: { get: function () { return on_retry; }, set: function ( value ) { this.On_retry( value ); } },
				
				on_error: { get: function () { return on_error; }, set: function ( value ) { this.On_error( value ); } },
				
				on_status_error:   { get: function () { return on_status_error; }, set: function ( value ) { this.On_status_error( value ); } },
				on_parse_error:    { get: function () { return on_parse_error; }, set: function ( value ) { this.On_parse_error( value ); } },
				on_timeout_error:  { get: function () { return on_timeout_error; }, set: function ( value ) { this.On_timeout_error( value ); } },
				on_transfer_error: { get: function () { return on_transfer_error; }, set: function ( value ) { this.On_transfer_error( value ); } },
				
				/////////////
				
				retried: { get: function () { return retried; } }
			}
		);
		
		
		// Private vars  --  <editor-fold defaultstate="expanded" desc="Private vars">
		
		var DEFAULT_TIMEOUT = 5000; // Used as a constant!
		var DEFAULT_RETRIES = 1; // Used as a constant!
		
		var uri;
		var method;
		
		var timeout;
		var retries;
		
		var data;
		var context;
		
		var parse_result;
		var parser;
		var parser_callback;
		
		///
		
		var on_before_send;
		var on_send;
		var on_transfer_start;
		var on_transfer_progress;
		var on_transfer_success;
		var on_transfer_end;
		var on_response;
		var on_success;
		var on_end;
		
		var on_abort;
		var on_retry;
		
		var on_error;
		
		var on_status_error;
		var on_parse_error;
		var on_timeout_error;
		var on_transfer_error;
		
		///
		
		var retried;
		
		///
		
		var xhr;
		var xhr_with_response;
		
		var can_send_abort_events;
		
		//</editor-fold>
		
		
		// Public methods  --  <editor-fold defaultstate="expanded" desc="Public methods">
		
		/**
		 * Resets the request object to its default values.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Reset = function ()
		{
			uri = '';
			method = Mex.Methods.get;
			
			timeout = DEFAULT_TIMEOUT;
			retries = DEFAULT_RETRIES;
			
			data = new FormData();
			context = null;
			
			parse_result = true;
			parser = Mex.Parsers.json;
			parser_callback = null;
			
			///
			
			on_before_send = null;
			on_send = null;
			on_transfer_start = null;
			on_transfer_progress = null;
			on_transfer_success = null;
			on_transfer_end = null;
			on_response = null;
			on_success = null;
			on_end = null;
			
			on_abort = null;
			on_retry = null;
			
			on_error = null;
			
			on_status_error = null;
			on_parse_error = null;
			on_timeout_error = null;
			on_transfer_error = null;
			
			///
			
			retried = 0;
			
			///
			
			xhr = null;
			xhr_with_response = null;
			
			can_send_abort_events = true;
			
			return this;
		};
		
		
		/**
		 * Send the request inmediately, without using the queue (concurrent).
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Send = function ()
		{
			// Initialize some things first
			retried = 0;
			can_send_abort_events = true;
			
			///
			
			Triggers.On_before_send();
			Send_request();
			
			return this;
		};
		
		
		/**
		 * Add the request to the queue.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Queue = function ()
		{
			// Initialize some things first
			retried = 0;
			can_send_abort_events = true;
			
			///
			
			Triggers.On_before_send();
			
			_queue.push( this );
			_queue_callbacks.push( Send_request );
			
			_Triggers.On_queue_add();
			
			_Process_queue();
			
			return this;
		};
		
		
		/**
		 * Aborts the current request. This only has effect if the request was sent and has not yet a response.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Abort = function ()
		{
			if ( xhr )
				xhr.abort();
			
			return this;
		};
		
		//</editor-fold>
		
		
		// Properties methods  --  <editor-fold defaultstate="expanded" desc="Properties methods">
		
		/**
		 * Sets the URI of the resource where the request will be sent.
		 * @param {string} new_uri The new URI value.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Uri = function ( new_uri )
		{
			if ( _Is_string( new_uri ) )
				uri = new_uri;
			
			return this;
		};
		
		
		/**
		 * Sets the HTTP method for the request.
		 * @param {string} new_method The new method. Mex is heavily focused for REST-alike applications so the recommended methods are "GET", 
		 * "POST", "PUT", "PATCH" and "DELETE". You can use the Mex.Methods collection members as safe parameters. You can also use an arbitrary 
		 * string but other than convert to uppercase no other checks are done, so make sure the method is supported by the XMLHttpRequest object.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Method = function ( new_method )
		{
			if ( _Is_string( new_method ) )
				method = new_method.toUpperCase();
			
			return this;
		};
		
		
		/**
		 * Sets the time a request must wait until give the request up for lost.
		 * @param {int} new_timeout The new timeout value, in miliseconds. The minimum value is 1000. Invalid values will set the default timeout.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Timeout = function ( new_timeout )
		{
			var v = _Parse_int( new_timeout );
			
			timeout = ( ( v !== false ) && ( v >= 1000 ) ) ? v : DEFAULT_TIMEOUT;
			
			return this;
		};
		
		
		/**
		 * Sets the number of retries a request will do in case of an error.
		 * @param {int} num_retries The new retries value. The minimum value is 0 (do not retry). Invalid values will set it to the default retries.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Retries = function ( num_retries )
		{
			var v = _Parse_int( num_retries );
			
			retries = ( ( v !== false ) && ( v >= 0 ) ) ? v : DEFAULT_RETRIES;
			
			return this;
		};
		
		
		/**
		 * Sets the data collection to send in the request. Any FormData standard object will be accepted.
		 * @param {FormData} form_data The new data value. This MUST be a FormData object, and if it isn't then nothing will be changed in the property.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Data = function ( form_data )
		{
			if ( form_data && ( form_data instanceof FormData ) )
				data = form_data;
			
			return this;
		};
		
		
		/**
		 * Sets the arbitrary data that will be passed as arguments to any of the available callbacks.
		 * @param {mixed} data The new context value. This value can be anything that your code needs, and will be returned as-is.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Context = function ( data )
		{
			context = data;
			
			return this;
		};
		
		
		/**
		 * Indicates whether the request must try to parse the response or if it should return it as-is.
		 * @param {bool} activate If true (the default value), the response will be parsed based off the configuration in the "parser" property.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Parse_result = function ( activate )
		{
			parse_result = activate ? true : false;
			
			return this;
		};
		
		
		/**
		 * Sets the automatic parser that the request will try to use on the response.
		 * @param {string|callback} new_parser The new parser. You can use the safe values from the Mex.Parsers collection. Also, you can use a 
		 * custom parser by passing a reference to a function in this parameter. Only string and callbacks (references to functions) are allowed in 
		 * this parameter, anything else will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.Parser = function ( new_parser )
		{
			if ( _Is_string( new_parser ) )
			{
				parser = new_parser.toLowerCase();
				parser_callback = null;
			}
			
			if ( _Is_callback( new_parser ) )
				parser_callback = new_parser;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called before the request is sent (e.g. when it is added to the queue but not yet sent).
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_before_send = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_before_send = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request is sent.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_send = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_send = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the XMLHttpRequest starts sending the data to the resource.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_transfer_start = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_transfer_start = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when an upload progress event is generated.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_transfer_progress = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_transfer_progress = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the XMLHttpRequest object correctly finalizes sending the data to the resource.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_transfer_success = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_transfer_success = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the XMLHttpRequest object ends the data transfer to the resource, either successful or not.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_transfer_end = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_transfer_end = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request gets a response but is not yet parsed or returned.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_response = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_response = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request encounters a valid result.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_success = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_success = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called at the end of the request (either successful or not).
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_end = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_end = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request has been aborted (e.g. through the Mex.Request.Abort() method).
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_abort = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_abort = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request has found some troubles and will retry.
		 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
		 * callback. Any other value type will not have any effect.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_retry = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_retry = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called cannot produce a valid result with independence of the motive.
		 * @param {callback} callback The reference to a function that will be called when an error in the request or the response is found. This 
		 * callback is called in any error event, but there are also more specific callbacks for better error handling.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_error = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_error = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called if the response gets a HTTP status code different that 2xx (e.g. 404 or 500).
		 * @param {callback} callback The reference to a function that will be called when an error in the request or the response is found. This 
		 * callback is called in any error event, but there are also more specific callbacks for better error handling.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_status_error = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_status_error = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called if the parsing returns an error. This can happen with custom parsers as well.
		 * @param {callback} callback The reference to a function that will be called when an error in the request or the response is found. This 
		 * callback is called in any error event, but there are also more specific callbacks for better error handling.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_parse_error = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_parse_error = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the request times out, that is, when it waits for the resource response for more milliseconds 
		 * than those configured in the Mex.Request.timeout property.
		 * @param {callback} callback The reference to a function that will be called when an error in the request or the response is found. This 
		 * callback is called in any error event, but there are also more specific callbacks for better error handling.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_timeout_error = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_timeout_error = callback;
			
			return this;
		};
		
		
		/**
		 * Sets a callback that will be called when the XMLHttpRequest object raises an error. These are mostly transfer and network related errors.
		 * @param {callback} callback The reference to a function that will be called when an error in the request or the response is found. This 
		 * callback is called in any error event, but there are also more specific callbacks for better error handling.
		 * @returns {Mex.Request} Returns a reference to the request object, so multiple calls can be chained.
		 */
		this.On_transfer_error = function ( callback )
		{
			if ( _Is_callback( callback ) || ( callback === null ) )
				on_transfer_error = callback;
			
			return this;
		};
		
		//</editor-fold>
		
		
		// Private methods  --  <editor-fold defaultstate="expanded" desc="Private methods">
		
		function Send_request ( is_queued )
		{
			xhr_with_response = null;
			
			xhr = new XMLHttpRequest();
			
			///@todo I've seen some examples setting a /12 char at the end of the uri for PUT and DELETE. Check if it is really needed.
			xhr.open( method, uri );
			
			xhr.timeout = timeout;
			
			xhr.addEventListener( 'readystatechange', XHR.State_change.bind( this, is_queued ) );
			
			xhr.addEventListener( 'progress', XHR.Progress );
			xhr.addEventListener( 'loadstart', XHR.Load_start.bind( this, is_queued ) );
			xhr.addEventListener( 'load', XHR.Load_success.bind( this, is_queued ) );
			xhr.addEventListener( 'loadend', XHR.Load_end.bind( this, is_queued ) );
			
			xhr.addEventListener( 'abort', XHR.Abort.bind( this, is_queued ) );
			
			xhr.addEventListener( 'timeout', XHR.Timeout.bind( this, is_queued ) );
			xhr.addEventListener( 'error', XHR.Error.bind( this, is_queued ) );
			
			// Send it away, and also trigger the callback.
			
			Triggers.On_send();
			xhr.send( data );
		}
		
		
		/**
		 * Checks if the request have available retries and re-send/re-queue the request if so.
		 * @param {bool} is_queued Whether the request came from the queue or as a standalone request.
		 * @returns {bool} True if there were available retries and the request was re-sent/re-queued. False otherwise.
		 */
		function Retry ( is_queued )
		{
			// Check if there are retries left
			if ( retried >= retries )
				return false;
			
			// Add to the retry counter and call the appropiate callback.
			retried++;
			Triggers.On_retry();
			
			// If it came from the queue, then re-queue it. If not, then send it away.
			if ( is_queued )
			{
				_queue.push( this );
				_queue_callbacks.push( Send_request );
				
				///@todo Should I call the Mex._Triggers.On_queue_add when retrying a queued request?
				
				// Make sure the queue is being processed.
				_Process_queue();
			}
			else
				Send_request( is_queued );
			
			return true;
		}
		
		
		/**
		 * Try to parse a response text as a JSON object.
		 * @param {string} response The response text to parse.
		 * @returns {object|null} If the parsing was successful, an object will be returned. If it fails null will be returned.
		 */
		function Parse_JSON ( response )
		{
			try
			{
				return JSON.parse( response );
			}
			catch ( e ) {}
			
			return null;
		}
		
		
		function Check_code ( code )
		{
			// Check first for specially supported ones
			
			//switch ( code )
			
			return;
			
			// Code indicates an error response, let's see which
			switch ( true )
			{
				// Redirections are not supported at this moment
				
				///@todo Think about supporting typical redirections (301, 303, 307, 308)
				case ( xhr.status >= 300 ) && ( xhr.status < 400 ):
				
				// Client errors
				
				// The method not allowed code is useful because it tell us when a resource cannot be accesed with the method used
				case xhr.status == 405:
				
				// The request timeout code is the server equivalent of the timeout, in this case the server waits for the cliente to send 
				// data and times out.
				case xhr.status == 408:
				
				// The payload too large code is returned when request sends to the server more data than the server is willing to process
				case xhr.status == 413:
				
				///@todo If the auth is supported in the future, checks against 401 & 403 may be useful
				case ( xhr.status >= 400 ) && ( xhr.status < 500 ):
				
			}
			if ( ( xhr.status >= 200 ) && ( xhr.status < 300 ) ) // any 2xx http code is "success"
			{
				///@todo make these differentiations, probably making some new callbacks along, and changes to current one
				// 201 indicates that the request ended with a new resource created
				// 202 indicates that the request has been accepted, but it may take a while to complete
				// 204 does not expect any content returned, so no content fetching or parsing
				// 205 is the same as 204, but also states that the requester resets the view
				// any other 2xx code will be treated as a normal 200
			}
		}
		
		//</editor-fold>
		
		
		// XMLHttpRequest object event handlers  --  <editor-fold defaultstate="expanded" desc="XMLHttpRequest object event handlers">
		
		var XHR =
		{
			State_change : function ( is_queued )
			{
				// Only the state 4 needs to be checked
				if ( xhr.readyState != 4 )
					return;
				
				var code;
				var result;
				
				// In most situations, the HTTP code 200 is the only one that will be used. However Mex will support correctly several other HTTP 
				// codes as well. Also, some codes can be configured to be interpreted as valid response. E.g. HTTP code 404 with no response content 
				// may be useful as a valid response for non-existing data.
				// 
				// Valid codes include:
				// - all the 2xx range
				// - 405 - method not allowed
				// - 408 - request timeout
				// - 413 - payload too large
				// - all the custom defined ones
				// 
				// Valid codes may return a result or not.
				if ( code = Check_code( xhr.status ) )
				{
					// A valid response code was returned
					// Check whether a result is needed or not
					if ( code.has_result )
					{
						result = xhr.responseText;
						
						// A null value is actually a valid result
						// Does the result needs to be parsed and is not null?
						if ( ( result !== null ) && parse_result )
						{
							switch ( true )
							{
								case _Is_callback( parser ):
									result = parser( xhr.responseText );
									break;
								
								case parser === 'xml':
									// The XMLHttpRequest object do parse the XML as a DOM tree by itself as long as the response mime is text/xml.
									// If responseXML is null, it means it could not be parsed as XML
									result = xhr.responseXML;
									break;
								
								case parser === 'json':
									result = Parse_JSON( xhr.responseText );
									break;
								
								// Defaults to return the result unprocessed
								default:
									result = xhr.responseText;
							}
							
							// Check for parse errors. Parse errors don't retry the request.
							if ( result === null )
							{
								Triggers.On_parse_error( xhr.responseText );
								Triggers.On_error( 'parse', xhr.responseText );
							}
						}
						
						Triggers.On_success( result );
					}
					else
						// No result needs to be returned, just a simple call to the callback is enough.
						Triggers.On_success();
					
					Triggers.On_end();
				}
				else
				{
					// Not a valid response code
					// There was an error, check if there are retries left to send.
					if ( !Retry( is_queued ) )
					{
						Triggers.On_status_error( xhr.status );
						Triggers.On_error( 'status', xhr.status );
						Triggers.On_end();
					}
				}
				
				// If the request came from the queue, make sure the next request is processed.
				if ( is_queued )
					_Process_queue();
			},
			Load_start : function ()
			{
				Triggers.On_transfer_start();
			},
			Load_success : function ()
			{
				Triggers.On_transfer_success();
			},
			Load_end : function ()
			{
				Triggers.On_transfer_end();
			},
			Abort : function ()
			{
				// Check if the abort event came from a controlled event (on purpose through the Mex.Request code).
				if ( !can_send_abort_events )
				{
					can_send_abort_events = true;
					return;
				}
				
				// Aborting is stopping forcefully the request, so I think the On_end callback should be called as well.
				Triggers.On_abort();
				Triggers.On_end();
			},
			Timeout : function ( is_queued )
			{
				// We want to fully stop any XHR leftovers, but the abort events shouldn't be called in this case, so we use a flag to deactivate 
				// the abort callback.
				can_send_abort_events = false;
				xhr.abort();
				
				// There was an error, check if there are retries left to send.
				if ( !Retry( is_queued ) )
				{
					Triggers.On_timeout_error();
					Triggers.On_error( 'timeout' );
					Triggers.On_end();
				}
			},
			Error : function ( is_queued )
			{
				// We want to fully stop any XHR leftovers, but the abort events shouldn't be called in this case, so we use a flag to deactivate 
				// the abort callback.
				can_send_abort_events = false;
				xhr.abort();
				
				// There was an error, check if there are retries left to send.
				if ( !Retry( is_queued ) )
				{
					Triggers.On_transfer_error();
					Triggers.On_error( 'transfer' );
					Triggers.On_end();
				}
			},
			Progress : function ( progress_info )
			{
				Triggers.On_transfer_progress( progress_info );
			}
		};
		
		//</editor-fold>
		
		
		// Callback triggers  --  <editor-fold defaultstate="expanded" desc="Callback triggers">
		
		var Triggers =
		{
			On_before_send : function ()
			{
				if ( on_before_send )
					on_before_send( context );
			},
			On_send : function ()
			{
				if ( on_send )
					on_send( context );
			},
			On_transfer_start : function ()
			{
				if ( on_transfer_start )
					on_transfer_start( context );
			},
			On_transfer_progress : function ( progress_info )
			{
				if ( on_transfer_progress )
					on_transfer_progress( context, progress_info );
			},
			On_transfer_success : function ()
			{
				if ( on_transfer_success )
					on_transfer_success( context );
			},
			On_transfer_end : function ()
			{
				if ( on_transfer_end )
					on_transfer_end( context );
			},
			On_success : function ( result )
			{
				if ( on_success )
					on_success( context, result );
			},
			On_end : function ()
			{
				if ( on_end )
					on_end( context );
			},
			On_abort : function ()
			{
				// Free the xhr resources
				xhr = null;
				xhr_with_response = null;
				
				if ( on_abort )
					on_abort( context );
			},
			On_retry : function ()
			{
				if ( on_retry )
					on_retry( context, retried );
			},
			On_error : function ( type, extra )
			{
				if ( on_error )
					on_error( context, type, extra );
			},
			On_status_error : function ( status_code )
			{
				if ( on_status_error )
					on_status_error( context, status_code );
			},
			On_parse_error : function ( context, unprocessed_result )
			{
				if ( on_parse_error )
					on_parse_error( context, unprocessed_result );
			},
			On_timeout_error : function ()
			{
				if ( on_timeout_error )
					on_timeout_error( context );
			},
			On_transfer_error : function ()
			{
				if ( on_transfer_error )
					on_transfer_error( context );
			}
		};
		
		//</editor-fold>
		
		
		// Constructor
		
		( function Constructor ( obj, uri, data )
		{
			obj.Reset();
			
			if ( uri )
				obj.uri = uri;
			
			if ( data )
				obj.data = data;
			
		}
		)( this, initial_uri, initial_data );
		
	};
	
	//</editor-fold>
	
	
	// Mex code  --  <editor-fold defaultstate="expanded" desc="Mex code">
	
	// Properties
	
	Object.defineProperties
	(
		this,
		{
			// Collections  --  <editor-fold defaultstate="expanded" desc="Collections">
			
			/**
			 * Collection of "safe" methods to use with the requests
			 */
			Methods: { get: function () { return { // Cannot use my preferred indenting, because JS ends the return statement in the new line char
				post: 'POST',
				get: 'GET',
				put: 'PUT',
				patch: 'PATCH',
				delete: 'DELETE'
			}; } },
			
			/**
			 * Collection of default parsers to use with the requests.
			 */
			Parsers: { get: function () { return { // Cannot use my preferred indenting, because JS ends the return statement in the new line char
				json: 'json',
				xml: 'xml'
			}; } },
			
			/**
			 * HTTP result codes to use with the requests response processing, or to ask for a custom code event.
			 */
			Codes: { get: function () { return { // Cannot use my preferred indenting, because JS ends the return statement in the new line char
				// Success HTTP codes
				Success:
				{
					// Everything is ok. This code has a response content.
					ok: 200,
					// The request ended with a new resource created. The response content should have the resource characteristics and a list or 
					// URIs pointing to the resource, and the "Location" header should have the most specific URI pointing to the created resource.
					// This code indicates that the resource was created BEFORE returning the status, if the creating operation takes a while the 202 
					// code should be used instead.
					created: 201,
					// The request has been accepted, but may take a while to fully process. The process may fail, so you can't expect the resource 
					// to be available until the process finishes correctly. To do this, the service should return data about the current status and 
					// a pointer (most probably an URI) to somewhere able to monitorize the process. In a web service context, this may be a URI that 
					// points to another web service that returns said info.
					accepted_for_processing: 202,
					// The request has been completed, but there is no need to return anything. Technically, some meta information may be present in 
					// the response headers, but practically this is more focused in services that don't need any result at all (e.g. counters, or 
					// simple true/false checks). This code expects that the view of the data associated (if any) remains unchanged for the most part.
					// E.g. a view with data for a shop client may check if he/she is subscribed to a newsletter and change the status of the 
					// associated field in the view, but the rest is unchanged.
					no_content: 204,
					// Sames as 204's "no_content", but in this case the services tells that the view should be resetted. A use case for this may be 
					// in editable forms, where after some checks the service may force the user to input some data by deleting the contents of the 
					// editable fields (e.g. captchas comes to mind).
					no_content_and_reset_view: 205
				},
				// Error HTTP codes
				Error:
				{
					// All the 4xx and 5xx codes should return information about the error and the condition of said error (e.g. if it is temporary, 
					// permanent, etc), except when using the method HEAD.
					
					// The request has malformed syntax.
					bad_request: 400,
					// The request can only be accesed with user authentication, or the authentication failed. The response must send a 
					// WWW-Authenticate header with a challenge for that resource.
					unauthorized: 401,
					// The server chose to refuse the request.
					forbidden: 403,
					// The server has not found any resource matching the request.
					not_found: 404,
					// The method used is not allowed for the resource. The response should have an "Allow" header with the supported methods.
					method_not_allowed: 405,
					// The server timed out waiting for the request to be sent. This is not the same that the timeout that happens while waiting for 
					// the response.
					request_timeout: 408,
					// The server does not want to process the request because it is too big. If it is something temporary a "Retry-After" header may 
					// be included with an amount of time that the cliente should wait to retry.
					request_too_large: 413,
					
					// Unexpected error. Kind of generic error for when no more info is available.
					internal_server_error: 500,
					// The server does not support the functionality described in the request.
					not_implemented: 501
				}
			}; } },
			
			//</editor-fold>
			
			queue:       { get: function () { return _queue; } },
			queue_delay: { get: function () { return _queue_delay; }, set: function ( value ) { this.Queue_delay( value ); } },
			
			on_queue_add:     { get: function () { return _on_queue_add; }, set: function ( value ) { this.On_queue_add( value ); } },
			on_queue_advance: { get: function () { return _on_queue_advance; }, set: function ( value ) { this.On_queue_advance( value ); } },
			on_queue_end:     { get: function () { return _on_queue_end; }, set: function ( value ) { this.On_queue_end( value ); } }
		}
	);
	
	
	// Private vars  --  <editor-fold defaultstate="expanded" desc="Private vars">
	
	var DEFAULT_QUEUE_DELAY = 0; // Used as a constant!
	
	var _queue = [];
	var _queue_callbacks = [];
	var _is_queue_working = false;
	
	var _queue_delay = DEFAULT_QUEUE_DELAY;
	
	var _on_queue_add;
	var _on_queue_advance;
	var _on_queue_end;
	
	//</editor-fold>
	
	
	// Properties methods  --  <editor-fold defaultstate="expanded" desc="Properties methods">
	
	/**
	 * Sets the time that the queue must wait between requests.
	 * @param {int} new_delay The new queue delay value, in miliseconds. The minimum value is 0, which turns off the delay. Invalid values will set 
	 * the default delay.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Queue_delay = function ( new_delay )
	{
		var v = _Parse_int( new_delay );
		
		_queue_delay = ( ( v !== false ) && ( v >= 0 ) ) ? v : DEFAULT_QUEUE_DELAY;
		
		return this;
	};
	
	
	/**
	 * Sets a callback that will be called each time a request is added to the queue.
	 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
	 * callback. Any other value type will not have any effect.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.On_queue_add = function ( callback )
	{
		if ( _Is_callback( callback ) || ( callback === null ) )
			_on_queue_add = callback;
		
		return this;
	};
	
	
	/**
	 * Sets a callback that will be called each time a request is sent from the queue.
	 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
	 * callback. Any other value type will not have any effect.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.On_queue_advance = function ( callback )
	{
		if ( _Is_callback( callback ) || ( callback === null ) )
			_on_queue_advance = callback;
		
		return this;
	};
	
	
	/**
	 * Sets a callback that will be called each time the queue empties.
	 * @param {callback|null} callback The reference to the function that must be called. Null is also an accepted value to deactivate the 
	 * callback. Any other value type will not have any effect.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.On_queue_end = function ( callback )
	{
		if ( _Is_callback( callback ) || ( callback === null ) )
			_on_queue_end = callback;
		
		return this;
	};
	
	//</editor-fold>
	
	
	// Public methods  --  <editor-fold defaultstate="expanded" desc="Public methods">
	
	/**
	 * Sends inmediately one or several requests.
	 * @param {Mex.Request|Mex.Request[]} Any number of Mex.Requests objects can be passed as arguments. Alternatively, an array of Mex.Request 
	 * objects will also be understood. You can even use several parameters and mix single requests and arrays of requests.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Send = function ()
	{
		for ( var i = 0; i < arguments.length; i++ )
		{
			if ( arguments[i] instanceof Array )
				arguments[i].forEach
				( function ( item )
				{
					if ( item instanceof Mex.Request )
						item.Send();
				}
				);
			else if ( arguments[i] instanceof Mex.Request )
				arguments[i].Send();
		}
		
		return this;
	};
	
	
	/**
	 * Puts one or several requests in the queue.
	 * @param {Mex.Request|Mex.Request[]} Any number of Mex.Requests objects can be passed as arguments. Alternatively, an array of Mex.Request 
	 * objects will also be understood. You can even use several parameters and mix single requests and arrays of requests.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Queue = function ()
	{
		for ( var i = 0; i < arguments.length; i++ )
		{
			if ( arguments[i] instanceof Array )
				arguments[i].forEach
				( function ( item )
				{
					if ( item instanceof Mex.Request )
						item.Queue();
				}
				);
			else if ( arguments[i] instanceof Mex.Request )
				arguments[i].Queue();
		}
		
		return this;
	};
	
	
	/**
	 * Aborts one or several requests.
	 * @param {Mex.Request|Mex.Request[]} Any number of Mex.Requests objects can be passed as arguments. Alternatively, an array of Mex.Request 
	 * objects will also be understood. You can even use several parameters and mix single requests and arrays of requests.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Abort = function ()
	{
		for ( var i = 0; i < arguments.length; i++ )
		{
			if ( arguments[i] instanceof Array )
				arguments[i].forEach
				( function ( item )
				{
					if ( item instanceof Mex.Request )
						item.Abort();
				}
				);
			else if ( arguments[i] instanceof Mex.Request )
				arguments[i].Abort();
		}
		
		return this;
	};
	
	//</editor-fold>
	
	
	// Private methods  --  <editor-fold defaultstate="expanded" desc="Private methods">
	
	/**
	 * Finds and calls the next request in the queue.
	 */
	function _Process_queue ()
	{
		if ( _is_queue_working )
			return;
		
		if ( _queue.length > 0 )
		{
			_is_queue_working = true;
			
			var request_callback = _queue_callbacks.shift();
			_queue.shift();
			
			if ( _queue_delay > 0 )
				window.setTimeout( function ()
				{
					_Triggers.On_queue_advance();
					request_callback( true );
				}, _queue_delay );
			else
			{
				_Triggers.On_queue_advance();
				request_callback( true );
			}
		}
		else
			_Triggers.On_queue_end();
	}
	
	//</editor-fold>
	
	
	// Callback triggers  --  <editor-fold defaultstate="expanded" desc="Callback triggers">

	var _Triggers =
	{
		On_queue_add : function ()
		{
			if ( _on_queue_add )
				_on_queue_add( _queue.length );
		},
		On_queue_advance : function ()
		{
			if ( _on_queue_advance )
				_on_queue_advance( _queue.length );
		},
		On_queue_end : function ()
		{
			if ( _on_queue_end )
				_on_queue_end();
		}
	};

	//</editor-fold>
	
	
	//</editor-fold>
	
	
	// Constructor. The brackets are for visual code separation and management through i.e. code folding (in editors that support it).
	{
		// This is where the "Mex" object is registered.
		Mex = this;
	}
	
} );


var xMex = function ()
{
	Object.defineProperties
	(
		this,
		{
			debug:       { get: function () { return _debug; },       set: function ( value ) { this.Debug( value ); } },
			debug_level: { get: function () { return _debug_level; }, set: function ( value ) { this.Debug_level( value ); } }
		}
	);
	
	var _debug = false;
	var _debug_level = 2;
	
	
	/**
	 * Sets the Mex.debug property.
	 * @param {bool} value Set it to true to print debug info onto the browser's console, while false deactivates it.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Debug = function ( value )
	{
		_debug = value ? true : false;
		
		return this;
	};
	
	
	/**
	 * Sets the Mex.debug_level property.
	 * @param {int} level The debug level can be 0, 1 or 2. Any other value will default to 2. The lower the debug level is, more debug messages and 
	 * more detailed will appear in the browser's console.
	 * @returns {Mex} Returns a reference to the Mex object, so multiple calls can be chained.
	 */
	this.Debug_level = function ( level )
	{
		var v;
		
		if ( !isNaN( v = parseInt( level ) ) && ( v >= 0 ) && ( v <= 2 ) )
			_debug_level = v;
		else
			_debug_level = 2;
		
		return this;
	};
};
