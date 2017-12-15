# Mex
_A multi-request enhanced XMLHttpRequest javascript library, for those that need a little bit more._

**Warning: unfinished, do not use in real projects!**

## So, what is this about? ##
In my job life, I have found several quirks when using web services, and pretty sure all of us did at some point. They are more or less _liveable_, however I had to do a heavily focused AJAJ site and the browser/server limits quickly came to make a mess.

One of those limits were the concurrent queries, which is the main reason I developed a small code able to easily queue AJAJ calls. Another limit came with the error management, so I expanded further to allow automatic retrying.

At the end, I ended with a fairly good little code which allowed me to send any combination of concurrent and queued web services requests, each with their very own list of available callbacks for successful results and errors, each with the ability to retry the call automatically in case the servers couldn't answer quickly enough, and even some more tidbits here and there. 

I was talking to a friend about this library and ended up deciding on sharing it with the world. Mex simply is the latest iteration of my custom AJAJ library, updated and rewritten for an clearer use.

## What can I do with Mex? ##
If I must summarize what Mex can do, then it would be...

* Send simple XMLHttpRequest based requests
* Send multiple XMLHttpRequest based requests...
    * ... concurrently, all running at the same time
    * ... or sequentially, one each time
* Configure the timeout per request
* Configure the HTTP method per request
* Configure if you want to parse the result as JSON
* Configure a number of automatic retries in case the request fails
* Configure a range of callbacks for different points in the request life and for several possible errors
* Set any arbitrary data per request that is available later in any callback

Also, keep in mind that the code is **plain, vanilla JS**. There are no dependencies at all.

In the future, even if it isn't so sophisticated, I may set up some internal documentation that explain exactly how it works internally, but if you're reading up to this point what you probably want to know is...

## How do I use it? ##

It's pretty simple. Seriously, it really is.

Obviously, the very first thing is to include the file in your page.

```html
<script src='mex.js'></script>
```

Then, let's go with a simple request, just a web service that returns a JSON object. To do this, we create a `Mex.Request` object.

```javascript
var request = new Mex.Request( 'http://myweb.com/services/user' );
request.on_success = User_success_callback;
```

Now, let's make the `User_success_callback` function.

```javascript
function User_success_callback ( context, result )
{
    if ( result.ok )
        alert( "User's name is " + result.data.name );
    else
        alert( "Something went wrong" );
}
```

Finally, send the request.

```javascript
Mex.Send( request );
```

Fairly easy, if I must say so. Let's spice things a bit.

Our page sends some more requests, but due to limits in either speed, browsers or servers, we cannot send them all at the same time. The Mex queue comes to the rescue.

```javascript
var request_1 = Mex.Request( 'http://myweb.com/services/user' );
var request_2 = Mex.Request( 'http://myweb.com/services/auth/check' );
var request_3 = Mex.Request( 'http://myweb.com/services/shopping_cart' );

Mex.Queue( request_1 );
Mex.Queue( request_2 );
Mex.Queue( request_3 );
```

This will make sure that only one of the requests is active at the same time, overcoming many of the issues about building a web with a lot of AJAJ calls. You can even send normal (concurrent) requests while a queue is active and it will work just fine.

```javascript
Mex.Queue( r1 );
Mex.Queue( r2 );

Mex.Send( r4 );

Mex.Queue( r3 );
```

Our user service is part of an intranet which have some load troubles, it may take a while to answer or even don't answer at all. Enter automatic retries and error handling. Also, because it might take time, we also use a callback to show a spinner to the visitor.

```javascript
request.retries = 5; // 3 by default
request.timeout = 15000; // milliseconds!
request.on_before_send = function ( context )
{
    // Show the spinner as soon as possible
    document.querySelector( '#user-spinner' ).style.display = 'block';
};
request.on_end = function ( context )
{
    // Hide the spinner when the request is done
    document.querySelector( '#user-spinner' ).style.display = 'none';
};
request.on_error = function ( context )
{
    // Oops!
    alert( "Server did not respond" );
};

Mex.Send( request );
```

For those that prefer it, method chaining is available as well:

```javascript
request.Retries( 5 ).Timeout( 15000 ).
    On_before_send( function ( context )
    {
        // Show the spinner as soon as possible
        document.querySelector( '#user-spinner' ).style.display = 'block';
    } ).
    On_end( function ( context )
    {
        // Hide the spinner when the request is done
        document.querySelector( '#user-spinner' ).style.display = 'none';
    } ).
    On_error( function ( context )
    {
        // Oops!
        alert( "Server did not respond" );
    } );

Mex.Send( request );
```

By doing this, our request will retry the call up to 5 times before raising an error. We did also set 15 seconds for the timeout. Of course this could lead to a big waiting time (15 x 5 = 75 seconds!), so set the values with care.

There are some more callbacks available to fine-tune the experience.

And what about this "context" that shows in the callbacks? Well, that's literally wathever you want to. The context is a data that lives within the request and is available in any of its callbacks. It can be used to store information that was available before sending the request but that may dissapear or change in the time the result comes back, or simply to solve easily the different scopes within the callbacks and your own code.

```javascript
request.context = { user_data: document.querySelector( '#user-data' ), users_url: 'http://myweb.com/user/' };
request.on_success = function ( context, result )
{
    if ( result.ok )
    {
        context.user_data.querySelector( '[data-role~=name]' ).innerHTML = result.data.name;
        context.user_data.querySelector( '[data-role~=age]' ).innerHTML = result.data.age;
        context.user_data.querySelector( '[data-role~=link]' ).innerHTML = context.users_url + result.data.id;
        context.user_data.style.display = 'block';
    }
    else
        // Oops!
        alert( 'Something went wrong!' );
};

Mex.Send( request );
```

More examples and a detailed reference to methods and properties will be uploaded to the wiki at some point.

## Any final words? ##
Yes: the code is not yet done.

What I have uploaded up until now is a preliminar code, not yet finished nor tested. It is a work in progress in which I am still making some decisions, therefore the examples above or even how the library is used may suffer some changes. I work on this on my free time, or more exactly, when I feel like coding it, as such don't expect it to get the "ready to use" flag right away.

This very file, the wiki, and maybe some samples will be probably added and/or changed over time. I plan on including a file explaining my coding standards as well, maybe even why I reached them.

Remember, this is **untested & unfinished** at this point. Don't use it (yet)!
