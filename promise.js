(function (window) {
    var Promise = function (fn) {
        var value = null;
        var callbacks = [];
        var state = 'pending'; // pengding, fulfilled, rejected

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
            // 状态变化前，事件推进队列里；状态一旦变化后不再变动，直接执行结果
            if (state === 'pending') {
                callbacks.push(callback);
            } else {
                var cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected
                // then方法没有传递任何参数的情况下，返回结果值
                if (!cb) {
                    cb = state === 'fulfilled' ? callback.resolve : callback.reject;
                    cb(value)
                } else {
                    try {
                        var ret = cb(value);
                        callback.resolve(ret);
                    } catch (e) {
                        callback.reject(e)
                    }  
                }
            }
        }

        function resolve(newValue) {
            // 假如resolve了一个promise的话（链式promise）
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (typeof then === 'function') {
                    // 调用第二个promise中的then，递归直到不是一个promise值为止
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
                // 等待全部promise执行完才执行resolve一个数组
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
        }, 1000);
    })
}

function test2(i) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            if (i % 2) {
            resolve(i);  
            } else {
            reject(i); 
            }
        }, 2000);
    })
}

test(1).then(test2).then(function (something) {
    console.log('case1: success!' + something);
}).catch(function (something) {
    console.log('case1: failed!' + something);
})

Promise.all([test(2), test2(4)]).then(function (something) {
    console.log('case2: success!' + something);
}).catch(function (something) {
    console.log('case2: failed!' + something)
})

Promise.race([test(3), test2(5)]).then(function (something) {
    console.log('case3: success!' + something);
}).catch(function (something) {
    console.log('case3: failed!' + something)
})