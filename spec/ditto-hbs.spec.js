const DittoHbs = require('../src');

describe('ditt0-hbs', function() {

  let fakeOpt = {
    defaultTemplate: 'index',
    partials: './files/partials',
    templates: './files/templates'
  };

  /**
   * opt tests
   */
  it('should be equal to getDefaultOpt()', function() {
    let testInstance = new DittoHbs();

    expect(testInstance.opt).toEqual(testInstance.getDefaultOpt());
  });

  it('should be equal to fakeOpt)', function() {
    let testInstance = new DittoHbs(fakeOpt);

    expect(testInstance.opt).toEqual(fakeOpt);
  });

  /**
   * register listeners test
   */
  it('should register five listeners', function() {
    let testInstance = new DittoHbs();

    testInstance.registerListeners(function() {
      console.log('im done');
    });

    expect(testInstance._eventsCount).toBe(5);
  });

});