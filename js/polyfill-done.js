// should work in any browser without browserify

if (typeof Promise.prototype.done !== 'function') {
  Promise.prototype.done = function (onFulfilled, onRejected) {
    var self = arguments.length ? this.then.apply(this, arguments) : this
    self.then(null, function (err) {
      setTimeout(function () {
        console.error("done:err",err)
        //throw err;
      }, 0)
    })
  }
}