(function (window) {
    var Promise = function (fn) {
        var value = null;
        var callbacks = [];
        var state = 'pending';

        var promise = this;

        // 注册then事件，供resolve后调用
        promise.then = function (onFulfilled, onRejected) {
            // 返回promise实现链式promise调用
            return new Promise(function (resolve, reject) {
                handle({
                    onFulfilled: onFulfilled || null,
                    onRejected: onRejected || null,
                    resolve: resolve,
                    reject: reject
                })
            })
        }

        promise.catch = function(onRejected) {
            return promise.then(undefined, onRejected)
        }
        
        function handle (callback) {
            // 状态变化前，事件推进队列里
            if (state === 'pending') {
                callbacks.push(callback);
                return;
            }

            var cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected

            // 没有传递任何值的情况
            if (!cb) {
                cb = state === 'fulfilled' ? callback.resolve : callback.reject;
                cb(value)
                return;
            }

            try {
                // 状态变化后，直接执行事件
                var ret = cb(value);
                callback.resolve(ret);
            } catch (e) {
                callback.reject(e)
            }
        }

        function resolve(newValue) {
            // 假如resolve了一个promise的话
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (typeof then === 'function') {
                    then.call(newValue, resolve, reject);
                    return
                }
            }

            value = newValue;
            state = 'fulfilled';
            
            execute()
        }

        function reject(reason) {
            state = 'rejected'
            value = reason

            execute()
        }

        function execute() {
            // 使用setTimeOut保证resolve一定在then事件注册后执行
            setTimeout(() => {
                callbacks.forEach(function (callback) {
                    handle(callback);
                })
            }, 0);
        }

        fn(resolve, reject);
    }

    Promise.all = function (promises) {
        if (!Array.isArray(promises)) {
            throw new TypeError('请传入promise数组')
        }

        return new Promise(function (resolve, reject) {
            var result = [];
            var count = promises.length

            function reslover (index) {
                return function(value) {
                    resloveAll(index, value)
                }
            }
    
            function rejecter (reason) {
                reject(reason)
            }
    
            function resloveAll (index, value) {
                result[index] = value
                if (--count === 0) {
                    resolve(result)
                }
            }

            promises.forEach(function (promise, index) {
                promise.then(reslover(index), rejecter)
            })
        })
    }

    Promise.race = function (promises) {
        if (!Array.isArray(promises)) {
            throw new TypeError('请传入promise数组')
        }

        return new Promise(function (resolve, reject) {
            function reslover (value) {
                resolve(value)
            }
    
            function rejecter (reason) {
                reject(reason)
            }
            promises.forEach(function (promise, index) {
                promise.then(reslover, rejecter)
            })
        })
    }

    window.Promise = Promise

})(window)

 
/******************************************实例 */
function test(i) {
    return new Promise(function (resolve) {
        setTimeout(() => {
        resolve(i); 
        }, 10);
    })
}

function test2(i) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            if (i > 5) {
            resolve(i);  
            } else {
            reject(i); 
            }
        }, 1000);
    })
}

test(10).then(test2).then(function (something) {
    console.log('success' + something);
}).catch(function (something) {
    console.log('failed' + something);
})

Promise.race([test(2), test2(6)]).then(function (something) {
    console.log('success' + something);
}).catch(function (something) {
    console.log('failed' + something)
})

Promise.race([test(3), test2(7)]).then(function (something) {
    console.log('success' + something);
}).catch(function (something) {
    console.log('failed' + something)
})