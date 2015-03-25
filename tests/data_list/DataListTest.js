/* globals spyOn */

var DataList = require("./../../api/data_list/DataList").DataList;
var SubExperimentDataList = require("./../../api/data_list/SubExperimentDataList").SubExperimentDataList;
var Contextualizer = require("./../../api/locales/Contextualizer").Contextualizer;
var FieldDBObject = require("./../../api/FieldDBObject").FieldDBObject;

var specIsRunningTooLong = 5000;
var SAMPLE_DATALIST_MODEL = require("../../sample_data/datalist_v1.22.1.json")[0];

describe("Data List", function() {
  describe("construction", function() {

    it("should load the DataList", function() {
      expect(DataList).toBeDefined();
    });

    it("should show a title, dateCreated, description, and datumIDs of the Datums in the Data List by default", function() {
      var list = new DataList();
      expect(list).toBeDefined();
      expect(list.title).toBe("");
      expect(list.description).toBe("");
      expect(list.docIds).toEqual([]);
      expect(list.length).toEqual(0);
    });

    it("should warn devs datumIds are deprecated", function() {
      var list = new DataList({
        title: "An old data list",
        description: "Testing upgrade of old datalists from backbone to commonjs.",
        datumIds: ["123o4j",
          "1231qwaeisod",
          "23ea"
        ]
      });
      expect(list.title).toBe("An old data list");
      expect(list.warnMessage).toContain("datumIds is deprecated, please use docIds instead.");
    });

    it("should accept a docs collection", function() {
      var list = new DataList({
        docs: [
          new FieldDBObject({
            "_id": "docone",
            "datumFields": [],
            "session": {}
          }), new FieldDBObject({
            "_id": "doctwo",
            "datumFields": [],
            "session": {}
          }), new FieldDBObject({
            "_id": "docthree",
            "datumFields": [],
            "session": {}
          })
        ]
      });
      expect(list.docs.fieldDBtype).toEqual("DocumentCollection");
      expect(list.docs.docone.id).toEqual("docone");
      expect(list.docs.length).toEqual(3);
      expect(list.docIds).toEqual(["docone",
        "doctwo",
        "docthree"
      ]);
      expect(list.length).toEqual(3);
    });


    it("should support custom primary keys", function() {
      var datalist = new DataList({
        docs: {
          primaryKey: "tempId"
        },
        docIds: ["one"],
      });
      expect(datalist.docs.primaryKey).toEqual("tempId");
      expect(datalist.docIds).toEqual(["one"]);
      expect(datalist.docs.one.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "one",
        dateCreated: datalist.docs.one.dateCreated,
        version: datalist.version
      });
    });

    it("should be able to empty docs", function() {
      expect(SAMPLE_DATALIST_MODEL.datumIds.length).toEqual(9);

      var list = new DataList(JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)));
      list.docs = [];
      // list.debugMode = true;
      expect(list.docs.length).toEqual(0);
      expect(list.docIds.length).toEqual(0);

      list.populate([{
        _id: "5EB57DXE-5D97-428E-A9C7-377DEEC02A19"
      }, {
        _id: "F60C2FX6-20FB-4B2B-BB3A-448B0784DBE9"
      }, ]);

      expect(list.docs.length).toEqual(2);
      expect(list.docIds.length).toEqual(2);
      expect(list.datumIds.length).toEqual(2);
      expect(list.docs["5EB57DXE-5D97-428E-A9C7-377DEEC02A19"]._id).toEqual("5EB57DXE-5D97-428E-A9C7-377DEEC02A19");
    });

  });

  describe("adding and removing docs", function() {

    it("should add docs to a datalist which had docIds ", function() {
      expect(SAMPLE_DATALIST_MODEL.datumIds.length).toEqual(9);

      var list = new DataList(JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)));
      expect(list.docIds).toEqual(SAMPLE_DATALIST_MODEL.datumIds);
      expect(list.datumIds.length).toEqual(9);
      expect(list.docs["924726BF-FAE7-4472-BD99-A13FCB5FEEFF"]._id).toEqual("924726BF-FAE7-4472-BD99-A13FCB5FEEFF");

      var additions = list.add([{
        _id: "5EB57DXE-5D97-428E-A9C7-377DEEC02A10"
      }, {
        _id: "F60C2FX6-20FB-4B2B-BB3A-448B0784DBE0"
      }, ]);

      expect(list.docs.length).toEqual(11);
      expect(list.docIds.length).toEqual(11);
      expect(list.docIds).toEqual(SAMPLE_DATALIST_MODEL.datumIds.concat(["5EB57DXE-5D97-428E-A9C7-377DEEC02A10", "F60C2FX6-20FB-4B2B-BB3A-448B0784DBE0"]));
      expect(list.datumIds.length).toEqual(11);

      expect(list.docs["5EB57DXE-5D97-428E-A9C7-377DEEC02A10"]._id).toEqual("5EB57DXE-5D97-428E-A9C7-377DEEC02A10");

      expect(additions).toBeDefined();
      expect(additions.length).toEqual(2);
      expect(additions[0]).toBe(list.docs._collection[list.docs.length - 2]);
      expect(additions[1]).toBe(list.docs._collection[list.docs.length - 1]);

      additions = list.unshift({
        id: "anotheritem",
        _rev: "2-9023",
        withrReal: "contents"
      });
      expect(list.docIds.length).toEqual(12);
      expect(list.docs.anotheritem.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        id: "anotheritem",
        _rev: "2-9023",
        withrReal: "contents",
        version: list.version
      });
      expect(list.docs.indexOf("anotheritem")).toEqual(0);

      expect(additions).toBeDefined();
      expect(additions).toBe(list.docs._collection[0]);

      var bottomItem = list.pop();
      expect(bottomItem.id).toEqual("F60C2FX6-20FB-4B2B-BB3A-448B0784DBE0");
      expect(bottomItem.fieldDBtype).toEqual("FieldDBObject");

      bottomItem = list.pop();
      expect(bottomItem.id).toEqual("5EB57DXE-5D97-428E-A9C7-377DEEC02A10");
      expect(bottomItem.fieldDBtype).toEqual("FieldDBObject");

      bottomItem = list.pop();
      expect(bottomItem.id).toEqual("924726BF-FAE7-4472-BD99-A13FCB5FEEFF");
      expect(bottomItem.fieldDBtype).toEqual("FieldDBObject");

      additions = list.unshift({
        id: "yetanotheritem",
        _rev: "3-9023"
      });
      expect(list.docIds.length).toEqual(10);
      expect(list.docs.yetanotheritem.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        id: "yetanotheritem",
        _rev: "3-9023",
        version: list.version
      });
      expect(list.docs.indexOf("anotheritem")).toEqual(1);
      expect(list.docs.indexOf("yetanotheritem")).toEqual(0);

      expect(additions).toBeDefined();
      expect(additions).toBe(list.docs._collection[0]);
      expect(list.docs.get(0)).toBe(additions);

      expect(list.docIds).toEqual(["yetanotheritem",
        "anotheritem",
        "5EB57D1E-5D97-428E-A9C7-377DEEC02A14",
        "F60C2FE6-20FB-4B2B-BB3A-448B0784DBE5",
        "D43A71E0-EFE3-4BC4-AABA-FDD152890326",
        "B31DB3E0-1F43-4FE0-9299-D1C85F0C4C62",
        "AF976245-1157-47DE-8B6A-28A7542D3497",
        "23489BDF-68EF-46C9-BB06-4C8EC9D77F48",
        "944C2CDE-74B8-4322-8940-72E8DD134841",
        "ED5A2292-659E-4B27-A352-9DBC5065207E"
      ]);
    });

    it("should add fast if the docs are not declared", function() {
      var startTimeAddWithExistingMembers = Date.now();
      var datalist1 = new DataList({
        docIds: ["one"]
      });
      var addition1 = datalist1.add({
        id: "two"
      }, {
        id: "three"
      }, {
        id: "four"
      }, {
        id: "five"
      }, {
        id: "six"
      });
      expect(addition1).toBeDefined();

      var slowerAddTime = Date.now() - startTimeAddWithExistingMembers;
      // expect(slowerAddTime).toEqual(1);

      var startTimeAddWithNoExistingMembers = Date.now();
      var datalist2 = new DataList();
      var addition2 = datalist2.add({
        id: "two"
      }, {
        id: "three"
      }, {
        id: "four"
      }, {
        id: "five"
      }, {
        id: "six"
      });
      expect(addition2).toBeDefined();

      var fasterAddTime = Date.now() - startTimeAddWithNoExistingMembers;
      // expect(fasterAddTime).toEqual(1);

      console.log(fasterAddTime + " should be less than " + slowerAddTime + " because it doesnt have to search for an item, but we arent requreing it");
      // expect(fasterAddTime <= slowerAddTime).toBeTruthy();
      // expect(slowerAddTime >= fasterAddTime).toBeTruthy();
    });

    it("should add fast if the docs are not declared, but keep other customization", function() {
      var datalist = new DataList({
        docs: {
          primaryKey: "tempId"
        },
        docIds: ["tempone"]
      });
      expect(datalist.docs.primaryKey).toEqual("tempId");
      expect(datalist.docIds).toEqual(["tempone"]);
      expect(datalist.docs.tempone.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "tempone",
        dateCreated: datalist.docs.tempone.dateCreated,
        version: datalist.version
      });

      var additions = datalist.add([{
        tempId: "temptwo",
        some: "content"
      }, {
        tempId: "tempthree",
        num: 1
      }, {
        tempId: "tempfour",
        some: "other content"
      }]);
      expect(additions).toBeDefined();

      expect(datalist.docs.primaryKey).toEqual("tempId");
      expect(datalist.docIds).toEqual(["tempone", "temptwo", "tempthree", "tempfour"]);
      expect(datalist.docs.tempone.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "tempone",
        dateCreated: datalist.docs.tempone.dateCreated,
        version: datalist.version
      });
      expect(datalist.docs.temptwo).toBeDefined();
      expect(datalist.docs.temptwo.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "temptwo",
        some: "content",
        dateCreated: datalist.docs.temptwo.dateCreated,
        version: datalist.version
      });

      expect(datalist.docs.tempthree.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "tempthree",
        num: 1,
        dateCreated: datalist.docs.tempthree.dateCreated,
        version: datalist.version
      });

    });
  });

  describe("merging", function() {
    it("should add fast if the docs are not declared, but keep other customization", function() {
      var datalist = new DataList({
        docs: {
          primaryKey: "tempId"
        },
        docIds: ["tempone"]
      });

      var additions = datalist.add([{
        tempId: "temptwo",
        some: "content"
      }, {
        tempId: "tempthree",
        num: 1
      }, {
        tempId: "tempfour",
        _rev: "1-456",
        some: "other content"
      }]);

      expect(datalist.docs.primaryKey).toEqual("tempId");
      expect(datalist.docIds).toEqual(["tempone", "temptwo", "tempthree", "tempfour"]);

      expect(datalist.docs.tempfour.toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        tempId: "tempfour",
        _rev: "1-456",
        some: "other content",
        dateCreated: datalist.docs.tempfour.dateCreated,
        version: datalist.version
      });

      additions = datalist.add([{
        tempId: "tempthree",
        num: 1
      }, {
        tempId: "tempfour",
        _rev: "2-123",
        some: "other content changed"
      }]);

      expect(datalist.docs.tempfour.confirmMessage).toBeDefined();
      expect(datalist.docs.tempfour.confirmMessage).toContain("I found a conflict for _rev, Do you want to overwrite it from \"1-456\" -> \"2-123\"");
      expect(datalist.docs.tempfour.confirmMessage).toContain("I found a conflict for some, Do you want to overwrite it from \"other content\" -> \"other content changed\"");
      // expect(datalist.docs.tempfour.confirmMessage).toContain("I found a conflict for _dateCreated, Do you want to overwrite it from ");

      // expect(datalist.docs.tempfour.toJSON()).toEqual({
      //   fieldDBtype: 'FieldDBObject',
      //   tempId: 'tempfour',
      //   some: 'other content changed',
      //   _rev: "2-123",
      //   dateCreated: datalist.docs.tempfour.dateCreated,
      //   version: datalist.version
      // });
    });
  });

  describe("pagination", function() {

    it("should create placeholder docs if set with datumids", function() {
      expect(SAMPLE_DATALIST_MODEL.datumIds.length).toEqual(9);
      expect(SAMPLE_DATALIST_MODEL.docs).toBeUndefined();
      expect(SAMPLE_DATALIST_MODEL.datumIds[7]).toEqual("ED5A2292-659E-4B27-A352-9DBC5065207E");

      var list = new DataList(JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)));
      expect(list.docIds.length).toEqual(9);

      expect(list.docs.length).toEqual(9);
      expect(list.docs.indexOf("ED5A2292-659E-4B27-A352-9DBC5065207E")).toEqual(7);
      expect(list.docs["ED5A2292-659E-4B27-A352-9DBC5065207E"].toJSON()).toEqual({
        fieldDBtype: "FieldDBObject",
        id: "ED5A2292-659E-4B27-A352-9DBC5065207E",
        version: list.version
      });
    });

  });

  describe("serialization", function() {

    it("should convert docs into datumIds", function() {
      var list = new DataList({
        docs: [new FieldDBObject({
          "_id": "docone",
          "datumFields": [],
          "session": {}
        }), new FieldDBObject({
          "_id": "doctwo",
          "datumFields": [],
          "session": {}
        }), new FieldDBObject({
          "_id": "docthree",
          "datumFields": [],
          "session": {}
        })]
      });
      expect(list).toBeDefined();
      var listToSave = list.toJSON();
      expect(listToSave.docIds).toEqual(["docone",
        "doctwo",
        "docthree"
      ]);
      expect(listToSave.datumIds).toEqual(["docone",
        "doctwo",
        "docthree"
      ]);
      expect(listToSave.docs).toBeUndefined();
    });

    it("should serialize existing datalists without breaking prototype app", function() {
      // JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)).debugMode = true;
      var list = new DataList(JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)));
      expect(list.comments).toBeDefined();
      expect(list.comments.collection[0].text).toContain("an example of how you can");
      expect(list.comments.fieldDBtype).toEqual("Comments");

      list.comments.debugMode = true;
      expect(list.comments._collection[0].previousFieldDBtype).toEqual("Comment");
      expect(list.comments._collection[0].fieldDBtype).toEqual("Comment");

      var listToSave = list.toJSON();
      expect(listToSave._id).toEqual(list.id);
      expect(listToSave.title).toEqual(list.title);
      expect(listToSave.description).toEqual(list.description);
      expect(listToSave.dbname).toEqual(list.dbname);
      expect(listToSave.datumIds).toEqual(list.datumIds);
      expect(listToSave.pouchname).toEqual(list.pouchname);
      expect(listToSave.dateCreated).toEqual(list.dateCreated);
      expect(listToSave.dateModified).toEqual(list.dateModified);
      expect(listToSave.comments).toBeDefined();

      expect(listToSave.comments[0].text).toContain("an example of how you can");
      expect(listToSave.comments[0].previousFieldDBtype).toBeUndefined();
      expect(listToSave.comments[0].fieldDBtype).toEqual("Comment");
      expect(listToSave.comments[0].text).toEqual(list.comments.collection[0].text);
      expect(listToSave.comments[0].username).toEqual(list.comments.collection[0].username);
      expect(listToSave.comments[0].gravatar).toEqual(list.comments.collection[0].gravatar);
      expect(listToSave.comments[0].timestamp).toEqual(1348670525349);
    });

    it("should serialize datalists with docs into docIds ", function() {
      expect(SAMPLE_DATALIST_MODEL.datumIds.length).toEqual(9);

      var list = new DataList(JSON.parse(JSON.stringify(SAMPLE_DATALIST_MODEL)));
      expect(list.docIds).toEqual(SAMPLE_DATALIST_MODEL.datumIds);
      // list.debugMode = true;
      expect(list.datumIds.length).toEqual(9);
      list.add([{
        _id: "5EB57DXE-5D97-428E-A9C7-377DEEC02A10"
      }, {
        _id: "F60C2FX6-20FB-4B2B-BB3A-448B0784DBE0"
      }, ]);

      expect(list.docs.length).toEqual(11);
      expect(list.docIds.length).toEqual(11);
      expect(list.datumIds.length).toEqual(11);
      expect(list.docs["924726BF-FAE7-4472-BD99-A13FCB5FEEFF"]._id).toEqual("924726BF-FAE7-4472-BD99-A13FCB5FEEFF");
      expect(list.docs["924726BF_FAE7_4472_BD99_A13FCB5FEEFF"]).toBeUndefined();

      var listToSave = list.toJSON();
      expect(listToSave.datumIds.length).toEqual(11);
      expect(listToSave.datumIds).toEqual(SAMPLE_DATALIST_MODEL.datumIds.concat(["5EB57DXE-5D97-428E-A9C7-377DEEC02A10",
        "F60C2FX6-20FB-4B2B-BB3A-448B0784DBE0"
      ]));


    });
  });

  describe("actions on items", function() {

    it("should show filtered results of users corpus (search)", function() {
      expect(true).toBeTruthy();
    });

    it("should show LaTeX'ed datum", function() {
      expect(true).toBeTruthy();
      //expect(dl.laTeXiT()).toContain("");
    });

    it("should add audio to datum", function() {
      expect(true).toBeTruthy();
      //expect(dl.addAudio()).toBeTruthy();
    });

    it("should discover audio on datum", function(done) {
      var list = new DataList({
        docs: [new FieldDBObject({
          "_id": "docone",
          "datumFields": [],
          "session": {},
          "audioVideo": [{
            "URL": "http://youtube.com/iwoamoiemqo32"
          }, {
            "URL": "http://soundcloud.com/iwoa/moiemqo32"
          }, {
            "URL": "http://localhost:3184/example/oiemqo32"
          }]
        }), new FieldDBObject({
          "_id": "doctwo",
          "datumFields": [],
          "session": {}
        }), new FieldDBObject({
          "_id": "docthree",
          "datumFields": [],
          "session": {},
          "audioVideo": []
        })]
      });
      // list.debugMode = true;
      list.getAllAudioAndVideoFiles().then(function(urls) {
        expect(urls).toEqual(["http://youtube.com/iwoamoiemqo32",
          "http://soundcloud.com/iwoa/moiemqo32",
          "http://localhost:3184/example/oiemqo32"
        ]);
        // expect(dl.playDatum()).toBeTruthy();
      }).done(done);
    }, specIsRunningTooLong);

    it("should copy datum to clipboard", function() {
      expect(true).toBeTruthy();
      //  expect(dl.copyDatum()).toContain("");
    });

    it("should star datum", function() {
      var dl = new DataList({
        docs: [new FieldDBObject({
          "_id": "docOne",
          "datumFields": [],
          "session": {},
          "star": function(value) {
            this._star = value;
          }
        }), new FieldDBObject({
          "_id": "doctwo",
          "datumFields": [],
          "session": {},
          "star": function(value) {
            this._star = value;
          }
        }), new FieldDBObject({
          "_id": "docthree",
          "datumFields": [],
          "session": {},
          "star": function(value) {
            this._star = value;
          }
        })]
      });

      expect(dl.applyFunctionToAllIds).toBeDefined();

      spyOn(dl.docs.doctwo, "star");
      expect(dl.docs.docOne.id).toEqual("docOne");
      dl.applyFunctionToAllIds(["doctwo",
        "docOne"
      ], "star", ["on"]);
      expect(dl.docs.doctwo.star).toHaveBeenCalledWith("on");

    });
  });

  describe("psycholinguistics", function() {
    it("should permit complex title objects", function() {

      FieldDBObject.application = {};
      var dl = new SubExperimentDataList({
        // debugMode: true,
        "label": "practice",
        "title": {
          "default": "locale_practice",
          "gamified_title": "locale_gamified_practice"
        },
        "description": {
          "default": "locale_practice_description_for_teacher",
          "for_child": "locale_practice_description_for_child",
          "for_parent": "locale_practice_description_for_parent",
          "for_experimentAdministrator": "locale_practice_description_for_teacher",
          "for_school_records": "locale_practice_description_for_school_record",
          "for_experimentAdministratorSpecialist": "locale_practice_description_for_slp"
        },
        "instructions": {
          "default": "locale_practice_instructions_for_teacher",
          "for_child": "locale_practice_instructions_for_child",
          "for_parent": "locale_practice_instructions_for_parent",
          "for_experimentAdministrator": "locale_practice_instructions_for_teacher",
          "for_school_records": "locale_practice_instructions_for_school_record",
          "for_experimentAdministratorSpecialist": "locale_practice_instructions_for_slp"
        }
      });

      expect(dl).toBeDefined();
      expect(dl.title).toBeDefined();
      expect(dl.title.fieldDBtype).toEqual("ContextualizableObject");
      expect(dl.title.data).toEqual({
        default: {
          message: "locale_practice"
        },
        gamified_title: {
          message: "locale_gamified_practice"
        }
      });
      expect(dl.title.default).toEqual("locale_practice");
      expect(dl.title.gamified_title).toEqual("locale_gamified_practice");
      expect(dl.description.default).toEqual("locale_practice_description_for_teacher");
      expect(dl.instructions.default).toEqual("locale_practice_instructions_for_teacher");

      var contextualizer = new Contextualizer({
        // debugMode: true
      });
      contextualizer.addMessagesToContextualizedStrings("en", {
        "locale_practice": {
          "message": "Practice"
        },
        "locale_practice_description_for_teacher": {
          "message": "This is a screening test for reading difficulties before children learn to read."
        },
        "locale_practice_instructions_for_teacher": {
          "message": "Make sure the head phones are plugged in before you begin."
        }
      });
      FieldDBObject.application = {
        contextualizer: contextualizer
      };
      expect(contextualizer.contextualize("locale_practice_description_for_teacher")).toEqual("This is a screening test for reading difficulties before children learn to read.");
      expect(contextualizer.contextualize(dl.description.for_experimentAdministrator)).toEqual("This is a screening test for reading difficulties before children learn to read.");
      expect(dl.contextualizer.fieldDBtype).toEqual("Contextualizer");
      expect(dl.description.fieldDBtype).toEqual("ContextualizableObject");
      expect(dl.description.for_experimentAdministrator).toEqual("This is a screening test for reading difficulties before children learn to read.");

    });

    it("should serialize results", function() {
      var experiment = new SubExperimentDataList({
        trials: ["idoftrialafromdatabase",
          "idoftrialbfromdatabase"
        ]
      });
      expect(experiment.docs).toBeDefined();
      expect(experiment.docs.length).toEqual(2);

      expect(experiment.trials).toBe(experiment.docs);
      expect(experiment.trials).toBeDefined();
      expect(experiment.trials.length).toEqual(2);

      expect(experiment.docs.idoftrialafromdatabase).toBeDefined();
      expect(experiment.docs.idoftrialafromdatabase.id).toEqual("idoftrialafromdatabase");
      expect(experiment.docs.idoftrialbfromdatabase).toBeDefined();
      expect(experiment.docs.idoftrialbfromdatabase.id).toEqual("idoftrialbfromdatabase");

      experiment.populate([{
        id: "idoftrialafromdatabase",
        type: "Datum",
        responses: [{
          x: 200,
          y: 200,
          score: 1
        }, {
          x: 300,
          y: 300,
          score: 0.4
        }]
      }, {
        id: "idoftrialbfromdatabase",
        type: "Datum"
      }]);
      expect(experiment.docs.length).toEqual(2);
      expect(experiment.trials.length).toEqual(2);

      expect(experiment.trials.idoftrialafromdatabase.responses[0].x).toEqual(200);

      var toSave = experiment.toJSON();
      expect(toSave.trials).toEqual(["idoftrialafromdatabase",
        "idoftrialbfromdatabase"
      ]);
      expect(toSave.results[0].responses[0].x).toEqual(200);

    });

  });
});
