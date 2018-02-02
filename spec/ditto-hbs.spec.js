const
  Ditto = require('ditt0'),
  DittoHbs = require('../src'),
  DittoHbsOpt = require('../src/dittoHbsOpt');

let
  fakeOpt = {
    defaultTemplate: 'index',
    partials: './spec/support/files/partials',
    templates: './spec/support/files/templates'
  },
  fakeOptHbs = new DittoHbsOpt(fakeOpt);

describe('ditt0-hbs opt', function() {

  /**
   * opt tests
   */
  it('should be equal to getDefaultOpt()', function() {
    let
      testInstance = new DittoHbs(),
      defaultOpt = new DittoHbsOpt();

    expect(testInstance.opt).toEqual(defaultOpt);
  });

  it('should be non default params', function() {
    let testInstance = new DittoHbs(fakeOpt);

    expect(testInstance.opt.defaultTemplate).toEqual(fakeOpt.defaultTemplate);
    expect(testInstance.opt.partials).toEqual(fakeOpt.partials);
    expect(testInstance.opt.templates).toEqual(fakeOpt.templates);
  })

  it('should be equal to fakeOpt', function() {
    let testInstance = new DittoHbs(fakeOpt);

    expect(testInstance.opt).toEqual(fakeOptHbs);
  });
});

describe('ditt0-hbs discover partials', function() {
  /**
   * discover partials test
   */
  it('should find one partial', function() {
    let testInstance = new DittoHbs(fakeOpt);

    testInstance.discoverPartials(function(err, partials) {
      expect(partials.length).toEqual(1);
      expect(partials[0]).toEqual('spec/support/files/partials/header.hbs');
    });
  });
});

describe('ditt0-hbs register partials', function() {
  let 
    testInstance = new DittoHbs(fakeOpt),
    filepaths = [];

  beforeAll(function(done) {
    testInstance.discoverPartials(function(err, partials) {
      filepaths = partials;

      done();
    });
  });

  it('should register one partial', function(){
    testInstance.registerPartials(filepaths, function(err){
      expect(err).toEqual('undefined');
    });
  });
});