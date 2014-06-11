var PCQueue = require("./index.js").PCQueue;
var Promise = require("promise");
var assert = require("assert");

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