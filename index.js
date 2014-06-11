var Promise = require("promise");

function PCQueue(opts) {
    this.promises = [];
    this.num_consumers = 1;
    this.active_consumers = 0;

    if(opts && opts.maxParallel)
        this.num_consumers = opts.maxParallel;
}

PCQueue.prototype.produce = function(func) {
    var self = this;

    var obj = {
        "func" : func
    };
    this.promises.push(obj);
    var promise = new Promise(function(resolve, reject) {
        obj.resolve = resolve;
        obj.reject = reject;

        //If a consumer is already free
        if(self.active_consumers < self.num_consumers) {
            self.active_consumers++;

            self.consume();
        }
    });

    //When a consumer finishes consuming, and is free. Both resolve and reject
    promise.done(function() {
        self.active_consumers--;

        if(self.promises.length > 0) {
            self.active_consumers++;
            self.consume();
        }
    }, function() {
        self.active_consumers--;

        if(self.promises.length > 0) {
            self.active_consumers++;
            self.consume();
        }
    });

    return promise;
}

PCQueue.prototype.consume = function() {
    var self = this;

    var curr = self.promises.shift();
    curr.func().done(function(data) {
        curr.resolve(data);
    }, function(err) {
        curr.reject(err);
    });
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