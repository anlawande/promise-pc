var Promise = require("promise");

function PCQueue(opts) {
    this.promises = [];
    this.num_consumers = 1;
    this.active_consumers = 0;

    if(opts && opts.maxParallel)
        this.num_consumers = opts.maxParallel;
}

PCQueue.prototype.produce = function(func) {
    this.promises.push(func);
    var _resolve, _reject;
    var self = this;

    var promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;

        //If a consumer is already free
        if(self.active_consumers < self.num_consumers) {
            self.active_consumers++;

            self.consume(resolve, reject)();
        }
    });

    //When a consumer finishes consuming, and is free. Both resolve and reject
    promise.done(function() {
        self.active_consumers--;

        if(self.promises.length > 0) {
            self.consume(_resolve, _reject)();
        }
    }, function() {
        self.active_consumers--;

        if(self.promises.length > 0) {
            self.consume(_resolve, _reject)();
        }
    });

    return promise;
}

PCQueue.prototype.consume = function(resolve, reject) {
    var self = this;

    return function() {
        var curr = self.promises.shift();

        curr().done(function(data) {
            resolve(data);
        }, function(err) {
            reject(err);
        });
    }
}

var produced = ['a', 'b', 'c', 'd', 'e'];

var pcqueue = new PCQueue({
    maxParallel : 2
});

for(var i = 0; i < produced.length; i++) {
    pcqueue.produce((function(i) {
        return function(){
            return dummyConsumer(i);
        }
    })(i)).done(function(data) {
        console.log("Producer says: " + data);
    });
}

function dummyConsumer(i) {
    return new Promise(function(resolve, reject){
        setTimeout(function() {
            console.log("Consumer says: " + i);
            resolve(i);
        }, (Math.random()*2000 + 2000));
    });
}