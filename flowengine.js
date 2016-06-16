function runFlows(rules, dataString) {

  try {
    var data = JSON.parse(dataString);
  } catch (e) {
    console.log('%c' + '🙀 Could not parse the JSON string ', 'color: red');
    console.log('End');
    return;
  }

  if (!rules || !rules.length) {
    console.log('%c' + '🙀 At least on rule must be given ', 'color: red');
    console.log('End');
    return;
  }

  var usedIds = [];

  runFlow(rules[0]);


  //run all steps and then call the function recursively as long as there is a next rule
  //could be improved by trampolining to prevent max stack error
  function runFlow(rule) {

    usedIds.push(rule.id);

    var result = step(rule, [])
      .then(runFunction)
      .then(findNextId)
      .then(checkCircular)
      .then(findRule);

    log(result.logs);

    if (result.value) {
      runFlow(result.value);
    }
  }

  function step(value, logs) {

    if (value === null) {
      logs.push(['End']);
      return {
        then: function() {
          return this;
        },
        value: null,
        logs: logs
      };
    } else {
      return {
        then: function(fn) {
          var r = fn(value);
          var log = r[1];
          if (log) {
            logs.push(log);
          }
          return step(r[0], logs);
        },
        value: value,
        logs: logs
      };
    }
  }

  function runFunction(rule) {
    var id = rule.id;
    try {
      var passed = rule.body(Object.assign({}, data));
      if (typeof passed === 'boolean') {
        return [{passed: passed, rule: rule}, getFncRunMessage(id, passed)];
      } else {
        return [null, getErrorMsg('function for rule ' + id + 'does not return a boolean')];
      }
    } catch (e) {
      return [null, getErrorMsg('Rule ' + id + ' throws the following exception: ' + e)];
    }
  }

  function findNextId(o) {
    return [o.passed ? o.rule.true_id : o.rule.false_id];
  }

  function checkCircular(id) {
    if (usedIds.indexOf(id) === -1) {
      return [id];
    } else {
      return [null, getErrorMsg('Rule ' + id + ' was used before, this steps runs in to circular flow')];
    }
  }

  function findRule(id) {
    var rule = rules.find(function(r) {
      return r.id === id;
    });

    if (rule) {
      return [rule];
    } else {
      return [null, getErrorMsg('Can not find the next rule with id ' + id)];
    }
  }

  function getErrorMsg(error) {
    return ['%c' + '🙀 ' + error, 'color: red'];
  }

  function getFncRunMessage(id, passed) {
    var emoji = passed ? '👍' : '👎';
    var text = passed ? 'passed' : 'failed';
    var color = 'color: ' + (passed ? 'green' : 'red');
    return [emoji + ' Rule ' + id + ' %c' + text, color];
  }

  function log(messages) {
    messages
      .forEach(function(msg) {
        console.log.apply(console, msg);
      });
  }

}

if (typeof exports !== 'undefined') { exports.runFlows = runFlows }
