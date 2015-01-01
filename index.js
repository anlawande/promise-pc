var Promise;
if(!window)
	Promise = require("promise");
else {
	Promise = function(callback) {
		var promise = new jQuery.Deferred();
		
		callback(function(args) {
			promise.resolve(args);
		}, function(args) {
			promise.reject(args);
		});
		
		return promise;
	}
}

function PCQueue(opts) {
    this.promises = [];
    this.num_consumers = null;
    this.active_consumers = 0;

    if(opts && opts.maxParallel)
        this.num_consumers = opts.maxParallel;

    if(opts && opts.tree) {
        this.treeNotificationList = [];
        this.treeNodes = 1;
        this.treeNodesDone = 0;
    }
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
        if(!self.num_consumers || self.active_consumers < self.num_consumers) {
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
        
        //Calling the tree notification list.
		var nextTick;
		if(!window)
			nextTick = process.nextTick;
		else
			nextTick = setTimeout;
        nextTick(function() {
            self.treeNodesDone++;
            if(self.treeNodes === self.treeNodesDone) {
                for(var i = 0; i < self.treeNotificationList.length; i++)
                    self.treeNotificationList[i]();
            }
        });
    }, function(err) {
        curr.reject(err);
    });
}

PCQueue.prototype.treeNotify = function(func) {
    this.treeNotificationList.push(func);
}

PCQueue.prototype.children = function(numChild) {
    this.treeNodes += numChild;
}

if(!window)
	exports.PCQueue = PCQueue;
else
	window.PCQueue = PCQueue;