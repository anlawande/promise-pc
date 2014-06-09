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
        if(this.active_consumers < this.num_consumers) {
            this.active_consumers++;
            
            this.consume(resolve, reject)();
        }
    });
    
    //When a consumer finishes consuming, and is free.
    promise.done(function() {
        this.active_consumers--;
        
        if(self.promises.length > 0) {
            this.consume(_resolve, _reject)();
        }
    });
    
    return promise;
}

PCQueue.prototype.consume = function(resolve, reject) {
    var self = this;
    
    return function() {
        var curr = self.promises.shift();

        curr().then(function(data) {
            resolve(data);
        }, function(err) {
            reject(err);
        });
    }
}