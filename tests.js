var PCQueue = require("./index.js").PCQueue;
var Promise = require("promise");
var assert = require("assert");
var request = require("request");

describe("Simple consumer", function(){
    it("should produce and consume 5 items", function(done) {

        //Create new PCQueue
        var pcqueue = new PCQueue({
            maxParallel : 2
        });
        //To verify
        var num_consumed = 0, num_produced = 0;

        //Storing promises to know when we are done with the test
        var promises = [];
        for(var i = 0; i < 5; i++) {
            
            //Put something on the queue, passing in the consumer function (MUST return a promise)
            var promise = pcqueue.produce(function() {
                return dummyConsumer(Math.floor(Math.random()*100));
            });
            
            //Producer is notified when item is consumed
            promise.done(function(data) {
                console.log("Producer says: " + data);
                num_produced++;
            });
            
            promises.push(promise);
        }
        
        Promise.all(promises).then(function(){
            assert.equal(num_consumed, num_produced);
            done();
        });

        //Simple function to return a consumer which waits a random time
        function dummyConsumer(i) {
            return new Promise(function(resolve, reject){
                setTimeout(function() {
                    console.log("Consumer says: " + i);
                    num_consumed++;
                    resolve(i);
                }, (Math.random()*2000 + 2000));
            });
        }
    });
});

describe("HTTP request consumer", function() {
    it("should fire off 5 HTTP requests, 2 at a time", function(done) {
        //Create new PCQueue
        var pcqueue = new PCQueue({
            maxParallel : 2
        });
        //To verify
        var num_consumed = 0, num_produced = 0;
        
        var urls = ["http://www.google.com", "http://www.facebook.com", "http://www.github.com", "http://www.twitter.com", "http://www.stackoverflow.com"];

        //Storing promises to know when we are done with the test
        var promises = [];
        for(var i = 0; i < urls.length; i++) {
            var url = urls[i];
            //Put something on the queue, passing in the consumer function (MUST return a promise)
            var promise = pcqueue.produce(function() {
                return requestConsumer(url);
            });
            
            //Producer is notified when item is consumed
            promise.done((function(url){    //Stamping the function with url, since it's in a loop
                return function(data) {
                    console.log(url + " - status " + data);
                    num_produced++;
                }
            })(url));
            
            promises.push(promise);
        }
        
        Promise.all(promises).then(function(){
            assert.equal(num_consumed, num_produced);
            done();
        });
        
        //Simple function to return a consumer which waits a random time
        function requestConsumer(url) {
            return new Promise(function(resolve, reject){
                request(url, function(err, response, body) {
                    if(err) {
                        reject(err);
                        return;
                    }
                    num_consumed++;
                    resolve(response.statusCode);
                });
            });
        }
    })
});

describe("Tree notify", function(){
    it("should be notified when all nodes on a tree are consumed", function(done) {

        //Create new PCQueue
        var pcqueue = new PCQueue({
            maxParallel : 2,
            tree : true
        });
        //To verify
        var num_consumed = 0, num_produced = 0;
        
        //Sample tree
        var tree = {
            name : "Root",
            children: [{
                name : "Child 1",
                children : [{
                    name : "Child 11",
                    children : []
                }]
            }, {
                name : "Child 2",
                children : []
            }, {
                name : "Child 3",
                children : []
            }]
        };
        
        //The function "treeNotify" can be called on any of the promises
        //Will be invoked when tree consumption is done
        pcqueue.produce(function() {
            return treeRecurs(tree);
        }).done(handleConsumption);
        
        pcqueue.treeNotify(function() {
            console.log("Tree consumed");
            done();
        });
        
        function treeRecurs(node) {
            return new Promise(function(resolve, reject) {
                var promise = this;
                for (var i = 0; i < node.children.length; i++) {
                    var childNode = node.children[i];
                    /*pcqueue.produce(function() {
                        return treeRecurs(childNode);
                    }).done(handleConsumption);*/
                    (function(childNode) {
                        return pcqueue.produce(function() {
                            return treeRecurs(childNode);
                    })})(childNode).done(handleConsumption);
                }
                
                //This statement notifies the producer consumer module of the number of 
                //children the current node has.
                //It is used to calculate when all nodes in a tree have finished consumption
                pcqueue.children(node.children.length);
                
                //Mocking an aync operation
                setTimeout(function(){
                    resolve(node.name);
                },Math.random()*1000 + 500);
            });
        }
        
        function handleConsumption(name) {
            console.log(name);
        }
    });
});