promise-pc
==========

*New functionality!* - Tree notify, see below

A Promise implementation of the producer-consumer problem.

Basically a queue in which you can keep adding promises. 
Consumer(s) consume promises and notify the producer. Uses the [then/promise](http://github.com/then/promise) implementation.

Number of consumers is dynamic. (**Coming soon**. Currently changing the maxParallel after initialization does not do anything)

#### Usage

* Require the module and initialize a PCQueue
```javascript
var PCQueue = require("promise-pc").PCQueue;
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

#### Tree Notify
Many a times processing of a tree or tree like structure requires async processing.
On a node per node basis there is no difference in production and consumption.
But at a tree level, it may be needed to be notified when tree processing is complete. The **treeNotify** event can be used to be notified once all the nodes of a tree are finished being processed by the consumer.

This is done by  
1. Declaring **tree** option as true  
2. Using **treeNotify** event to be notified of tree processing completion  
3. During producer/consumer processing, using **children** method to declare number of children current node has.

*See tree test in tests.js*

```javascript
pcqueue.treeNotify(function() {/*Do something*/});

//Inside producer/consumer processing
pcqueue.children(node.children.length);
```

#### Options

* *maxParallel* : Maximum number of consumers. *If not specified, assumes inifite number of consumers*
* *tree* : Enables tree mode wherein treeNotify event is available
