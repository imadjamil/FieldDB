var config = require("config");
var expect = require("chai").expect;
var CORS = require("fielddb/api/CORSNode").CORS;
var activityHeatMap = require("./../../routes/activity").activityHeatMap;
var specIsRunningTooLong = 5000;
var LINGLLAMA_ACTIVITY_SIZE = 48;
var COMMUNITY_GEORGIAN_ACTIVITY_SIZE = 218;

var acceptSelfSignedCertificates = {
  strictSSL: false
};

if (process.env.NODE_ENV === "production") {
  acceptSelfSignedCertificates = {};
}

describe("activity routes", function() {

  it("should load", function() {
    expect(activityHeatMap).to.be.defined;
  });

  describe("invalid requests", function() {

    it("should return empty data if dbname is not provided", function(done) {
      activityHeatMap(null, done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(0);
      }).done(done);
    }, specIsRunningTooLong);

  });

  describe("normal requests", function() {

    it("should return heat map data from the sample activity feeds", function(done) {
      activityHeatMap("lingllama-communitycorpus", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(LINGLLAMA_ACTIVITY_SIZE);
      }).done(done);
    }, specIsRunningTooLong);

    it("should return heat map data from the community activity feeds", function(done) {
      activityHeatMap("community-georgian", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(COMMUNITY_GEORGIAN_ACTIVITY_SIZE);
      }).done(done);
    }, specIsRunningTooLong);

  });

  describe("normal requests via service", function() {

    it("should return heat map data from the sample activity feeds", function(done) {
      CORS.makeCORSRequest({
        dataType: "json",
        url: config.url + "/activity/lingllama-communitycorpus"
      }).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(LINGLLAMA_ACTIVITY_SIZE);
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception.stack).to.equal(undefined);
      }).done(done);
    }, specIsRunningTooLong);

    it("should return heat map data from the community activity feeds", function(done) {
      CORS.makeCORSRequest({
        dataType: "json",
        url: config.url + "/activity/community-georgian"
      }).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(COMMUNITY_GEORGIAN_ACTIVITY_SIZE);
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception.stack).to.equal(undefined);
      }).done(done);
    }, specIsRunningTooLong);

  });

  describe("close enough requests", function() {

    it("should use lowercase dbname", function(done) {
      activityHeatMap("LingLlama-communitycorpus", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(LINGLLAMA_ACTIVITY_SIZE);
      }).done(done);
    }, specIsRunningTooLong);

    it("should accept activity feed dbname", function(done) {
      activityHeatMap("lingllama-communitycorpus-activity_feed", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(LINGLLAMA_ACTIVITY_SIZE);
      }).done(done);
    }, specIsRunningTooLong);
  });

  describe("sanitize requests", function() {

    it("should return empty data if dbname is too short", function(done) {
      activityHeatMap("aa", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(0);
      }).done(done);
    }, specIsRunningTooLong);

    it("should return empty data if dbname is not a string", function(done) {
      activityHeatMap({
        "not": "astring"
      }, done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(0);
      }).done(done);
    }, specIsRunningTooLong);

    it("should return empty data if dbname contains invalid characters", function(done) {
      activityHeatMap("a.*-haaha script injection attack attempt file:///some/try", done).then(function(results) {
        expect(results).to.be.defined;
        expect(results.rows).to.be.defined;
        expect(results.rows.length).to.deep.equal(0);
      }).done(done);
    }, specIsRunningTooLong);
  });


});
