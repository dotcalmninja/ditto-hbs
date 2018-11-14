const
  Ditto = require('ditt0'),
  DittoHbs = require('../src'),
  DittoHbsOpt = require('../src/opt');

const
  fakeOpt = {
    defaultTemplate: 'index',
    partials: './spec/support/files/partials',
    templates: './spec/support/files/templates'
  },
  fakeOptHbs = new DittoHbsOpt(fakeOpt);
  emptyInstance = new DittoHbs(),
  fakeOptInstance = new DittoHbs(fakeOptHbs);

describe('ditt0-hbs', function() {
  /**
   * opt tests
   */
  it('should be equal to getDefaultOpt()', function() {
    let defaultOpt = new DittoHbsOpt();
    expect(emptyInstance.opt).toEqual(defaultOpt);
  });

  it('should be non default params', function() {
    expect(fakeOptInstance.opt.defaultTemplate).toEqual(fakeOpt.defaultTemplate);
    expect(fakeOptInstance.opt.partials).toEqual(fakeOpt.partials);
    expect(fakeOptInstance.opt.templates).toEqual(fakeOpt.templates);
    expect(fakeOptInstance.opt).toEqual(fakeOptHbs);
  })

  /**
   * discover partials test
   */
  it('should find one partial', function() {
    fakeOptInstance.discoverPartials(function(err, partials) {
      expect(partials.length).toEqual(1);
      expect(partials[0]).toEqual('spec/support/files/partials/header.hbs');
    });
  });

  /**
   * discover templates test
   */
  it('should find one template', function() {
    fakeOptInstance.discoverTemplates(function(err, templates) {
      expect(templates.length).toEqual(1);
      expect(templates[0]).toEqual('spec/support/files/templates/index.hbs');
    });
  });

  /**
   * register template
   */
  it('should register one template', function(){
    fakeOptInstance.registerTemplate('spec/support/files/templates/index.hbs', function(err, template){
      expect(err).not.toBeNull();      
    });
  });

  /**
   * register partial
   */
  it('should register one partial', function(){
    fakeOptInstance.registerPartial('spec/support/files/partials/header.hbs', function(err){
      expect(err).not.toBeNull();
    });
  });
  
});
