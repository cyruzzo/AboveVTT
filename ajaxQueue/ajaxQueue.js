/* ES6 Module for queuing multiple ajax requests.
*
* @author Pavel Máca / Converted to es6 by Adrian Dybwad
* @github https://github.com/PavelMaca
* @license MIT
*
* https://gist.github.com/pavelmaca/942485
*/

import $ from "./jquery.module.js";
var queue = [];
var currentRequest = null;
var stopped = false;

class AjaxQueueTask {
  constructor(options, requestComplete) {
    this.options = options || {};
    var oldComplete = options.complete || function () { };
    var completeCallback = function (XMLHttpRequest, textStatus) {
      (function () {
        oldComplete(XMLHttpRequest, textStatus);
      })();
      //Let the AjaxQueue know to run the next task. 
      requestComplete();
    };
    this.options.complete = completeCallback;
  }

  perform() {
    $.ajax(this.options);
  }
}

class AjaxQueue {
  constructor(options) {
    //Not yet used. For the future, some queue master options?
    this.options = options || {};
  }

  stop() {
    stopped = true;

  }

  run() {
    stopped = false;
    this.startNextRequest();
  }

  clear() {
    queue = [];
    currentRequest = null;
  }

  addRequest(options) {
    //When the task is complete, it needs to tell the AjaxQueue so we can run the next task
    const requestComplete = () => { this.requestComplete() };
    var request = new AjaxQueueTask(options, requestComplete);

    queue.push(request);
    this.startNextRequest();
  }

  requestComplete() {
    currentRequest = null;
    this.startNextRequest();
  }

  startNextRequest() {
    //If the queue is stopped or a request is in progress, do nothing.
    if (stopped || currentRequest) {
      return false;
    }

    var request = queue.shift();
    if (request) {
      currentRequest = request;
      request.perform();
    }
  }
}

export const ajaxQueue = new AjaxQueue({ complete: function() { } }, function() { });
