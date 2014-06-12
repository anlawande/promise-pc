promise-pc
==========

A Promise implementation of the producer-consumer problem.

Basically a queue in which you can keep adding promises. 
Consumer(s) consume promises and notify the producer. Uses the [then/promise](http://github.com/then/promise) implementation.

Number of consumers is dynamic. (**Coming soon**. Currently changing the maxParallel after initialization does not do anything)

#### Usage

* Require the module and initialize a PCQueue
```javascript
var PCQueue = require("promise-pc");
var pcqueue = new PCQueue(opts);
```
See below for available options

* When an item is ready to be consumed, a producer pushes it onto the queue using the **produce** method.
```javascript
var promise = pcqueue.produce(function() {
  //This is a consumer function
  
  //Must return a promise object
});

promise.then(function(result){  //Use 'done' instead of 'then' if you wish to propagate errors
//Producer is notified after a consumer consumes an item
//Results of consumption are available here
});
```
Note that the consumer function is not immediately invoked. Only when a consumer is free (as indicated by the maxParallel option).

#### Options

* *maxParallel* : Maximum number of consumers. *If not specified, assumes inifite number of consumers*
