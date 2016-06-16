var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

var flowengine = require('./flowengine');
var runFlows = flowengine.runFlows;

chai.use(sinonChai);

var validJSON = '{"value": 1}';
var invalidJSON = '{invalid: JSON';

var fnTrue = function(i) {
  return i.value === 1;
}

var fnFalse = function(i) {
  return i.value > 1;
}

var fnThrows = function(i) {
  throw 'some error';
}


describe('Flow engine', function() {

  beforeEach(function() {
    sinon.spy(console, 'log');
  });

  afterEach(function() {
    console.log.restore();
  });

  describe('when run rule', function() {

    describe('log rule result', function() {

      it('for passing', function() {
        runFlows([{id: 1, body: fnTrue}], validJSON);
        console.log.should.have.been.calledWith('👍 Rule 1 %cpassed', 'color: green');
      });


      it('for not passing', function() {
        runFlows([{id: 1, body: fnFalse}], validJSON);
        console.log.should.have.been.calledWith('👎 Rule 1 %cfailed', 'color: red');
      });


      it('for throwing functions', function() {
        runFlows([{id: 1, body: fnThrows}], validJSON);
        console.log.should.have.been.calledWith('%c🙀 Rule 1 throws the following exception: some error', 'color: red');
        console.log.should.have.been.calledWith('End');
        console.log.should.have.callCount(2)
      });
    });
  });


  it('will stop after find circular', function() {
    runFlows([{id: 1, false_id: 1, body: fnFalse}, {id: 1, body: fnFalse}], validJSON);
    console.log.should.have.been.calledWith('👎 Rule 1 %cfailed', 'color: red');
    console.log.should.have.been.calledWith('%c🙀 Rule 1 was used before, this steps runs in to circular flow', 'color: red');
    console.log.should.have.been.calledWith('End');
    console.log.should.have.callCount(3)
  });


  it('will stop when cant find the next rule', function() {
    runFlows([{id: 1, false_id: 2, body: fnFalse}], validJSON);
    console.log.should.have.been.calledWith('👎 Rule 1 %cfailed', 'color: red');
    console.log.should.have.been.calledWith('%c🙀 Can not find the next rule with id 2', 'color: red');
    console.log.should.have.been.calledWith('End');
    console.log.should.have.callCount(3)
  });


  it('will call every rules until a `null` is provided as next rule id', function() {
    runFlows([{id: 1, false_id: 2, body: fnFalse}, {id: 2, false_id: null, body: fnFalse}], validJSON);
    console.log.should.have.been.calledWith('👎 Rule 1 %cfailed', 'color: red');
    console.log.should.have.been.calledWith('👎 Rule 2 %cfailed', 'color: red');
    console.log.should.have.been.calledWith('End');
    console.log.should.have.callCount(3)
  });

  describe('should catch ', function() {

    it('unparsebale JSON', function() {
      runFlows([], invalidJSON);
      console.log.should.have.been.calledWith('%c' + '🙀 Could not parse the JSON string ', 'color: red');
      console.log.should.have.been.calledWith('End');
      console.log.should.have.callCount(2)
    });


    it('empty rules', function() {
      runFlows([], validJSON);
      console.log.should.have.been.calledWith('%c' + '🙀 At least on rule must be given ', 'color: red');
      console.log.should.have.been.calledWith('End');
      console.log.should.have.callCount(2)
    });

  });

});