var PCQueue = require("./index.js").PCQueue;
var Promise = require("promise");

describe("Simple consumer", function(){
    it("should produce and consume 5 items", function(done) {
        var produced = ['a', 'b', 'c', 'd', 'e'];

        var pcqueue = new PCQueue({
            maxParallel : 2
        });

        var promises = [];
        for(var i = 0; i < produced.length; i++) {
            
            var promise = pcqueue.produce((function(i) {
                return function(){
                    return dummyConsumer(i);
                }
            })(i));
            
            promise.done(function(data) {
                console.log("Producer says: " + data);
            });
            
            promises.push(promise);
        }
        
        Promise.all(promises).then(function(){
            done()
        });

        function dummyConsumer(i) {
            return new Promise(function(resolve, reject){
                setTimeout(function() {
                    console.log("Consumer says: " + i);
                    resolve(i);
                }, (Math.random()*2000 + 2000));
            });
        }
    });
});