var Confidential = require("./../confidentiality_encryption/Confidential").Confidential;
var Activities = require("./../activity/Activities").Activities;
var Database = require("./Database").Database;
var Connection = require("./Connection").Connection;
var DatumFields = require("./../datum/DatumFields").DatumFields;
var DatumStates = require("./../datum/DatumStates").DatumStates;
var DatumTags = require("./../datum/DatumTags").DatumTags;
var Comments = require("./../comment/Comments").Comments;
var FieldDBObject = require("./../FieldDBObject").FieldDBObject;
var Sessions = require("./../datum/DocumentCollection").DocumentCollection;
var DataLists = require("./../datum/DocumentCollection").DocumentCollection;
var TeamPreference = require("./../user/UserPreference").UserPreference;
var Team = require("./../user/Team").Team;
var Permissions = require("./../permission/Permissions").Permissions;
var Q = require("q");

var DEFAULT_CORPUS_MODEL = require("./corpus_mask.json");
/**
 * @class The CorpusMask is saved as corpus in the Couch repository,
 *        it is the publicly visible version of a corpus. By default it just says "This
 *        corpus is private," when users decide to make some aspects of their corpsu
 *        public they can customize the fields in their "corpus" object to display
 *        only certain sorts of data, even though the corpus is publicly discoverable.
 *
 * @property {String} title This is the title of the corpus, as set by the corpus
 *           team. It can contain any UTF-8 character.
 * @property {String} titleAsUrl This is what appears in the url on the main website.
 *           It is based on the title of the corpus and can be changed and looks
 *           nicer than the dbname which cannot be changed. eg
 *           http://fieldlinguist.com/LingLlama/SampleFieldLinguisticsCorpus
 * @property {String} description This is a short description that
 *           appears on the corpus details page
 * @property {Object} termsOfUse Terms of use set by the corpus team, includes
 *           a field for humanReadable terms which are displayed on the corpus
 *           and included in corpus exports.
 * @property {Object} license License set by the corpus team, includes a field
 *           for humanReadable terms which are displayed on the corpus and
 *           included in corpus exports, as well as a link to the license, imageUrl
 *           for the image/logo of the license for easy recognition and
 *           title of the license.
 * @property {Object} copyright Who owns the copyright to the corpus,
 *           by default it is set to the corpus team"s name but teams can customize
 *           it for example to make the corpus copyright of the language community
 *           or speakers who contributed to the corpus.
 * @property {Object} location GPS location of the corpus (longitude, latitude and accuracy)
 *           The corpus can be plotted on a map using the accuracy as a radius
 *           of roughly where the data is from.
 * @property {String} remote The url of the remote eg:
 *           git@fieldlinguist.com:LingLlama/SampleFieldLinguisticsCorpus.git
 * @property {Array} connection The url of remote server(s) where the
 *           corpus is replicated or backed up as well as other connection it is connected to.
 *
 * @property {Array} members Collection of public browsable/search engine
 *           discoverable members associated to the corpus
 * @property {Array} datumstates Collection of datum states for which data are
 *           will be public browsable/search engine discoverable in the corpus. This
 *           can be used to only show polished data or "checked" data on the public
 *           page for example.
 * @property {Array} datumfields Collection of datum fields which will be
 *           public browsable/search engine discoverable  on public datum in the corpus
 * @property {Array} sessions Collection of public browsable/search engine
 *           discoverable sessions that belong to the corpus
 * @property {Array} datalists Collection of public browsable/search engine
 *           discoverable data lists created under the corpus
 *
 * @extends Database
 * @tutorial tests/CorpusMaskTest.js
 */
var CorpusMask = function CorpusMask(options) {
  if (!this._fieldDBtype) {
    this._fieldDBtype = "CorpusMask";
  }
  this.debug(options);
  Database.apply(this, arguments);
};

CorpusMask.prototype = Object.create(Database.prototype, /** @lends CorpusMask.prototype */ {
  constructor: {
    value: CorpusMask
  },

  id: {
    get: function() {
      this._id = "corpus";
      return this._id;
    },
    set: function(value) {
      if (value === this._id) {
        return;
      }
      this.warn("CorpusMask id cannot be set, it is \"corpus\" by default." + value);
      value = "corpus";
      this._id = value;
    }
  },

  api: {
    value: "corpora"
  },

  defaults: {
    get: function() {
      var filteredCorpus = JSON.parse(JSON.stringify(DEFAULT_CORPUS_MODEL));
      return filteredCorpus;
    }
  },

  INTERNAL_MODELS: {
    value: {
      _id: FieldDBObject.DEFAULT_STRING,
      _rev: FieldDBObject.DEFAULT_STRING,
      dbname: FieldDBObject.DEFAULT_STRING,
      version: FieldDBObject.DEFAULT_STRING,
      dateCreated: FieldDBObject.DEFAULT_DATE,
      dateModified: FieldDBObject.DEFAULT_DATE,
      comments: Comments,
      sessions: Sessions,
      datalists: DataLists,

      titleAsUrl: FieldDBObject.DEFAULT_STRING,
      connection: Connection,
      activityConnection: Activities,
      publicCorpus: FieldDBObject.DEFAULT_STRING,
      confidential: Confidential,

      validationStati: DatumStates,
      tags: DatumTags,

      fields: DatumFields,
      datumFields: DatumFields,
      speakerFields: DatumFields,
      participantFields: DatumFields,
      conversationFields: DatumFields,
      sessionFields: DatumFields,

      prefs: TeamPreference,
      team: Team,
      permissions: Permissions
    }
  },

  addField: {
    value: function(field) {
      if (!this.fields) {
        this.fields = [];
      }
      if (typeof field === "string") {
        // this.fields.debugMode = true;
        if (this.fields[field]) {
          return this.fields[field];
        }
        field = {
          id: field
        };
      }
      this.debug("adding field", field);
      return this.fields.add(field);
    }
  },

  titleAsUrl: {
    get: function() {
      if (!this._titleAsUrl && this.title) {
        this._titleAsUrl = this.sanitizeStringForFileSystem(this.title, "_").toLowerCase();
      }
      return this._titleAsUrl;
    },
    set: function(value) {
      if (value === this._titleAsUrl) {
        return;
      }
      // If an app is explicity trying to overwrite a titleAsUrl, complain.
      if (this._titleAsUrl) {
        this.warn("titleAsUrl cannot be set directly, setting the title will cause it to be set.");
      }
    }
  },

  title: {
    configurable: true,
    get: function() {
      if (this.fields && this.fields.title) {
        return this.fields.title.value;
      } else {
        return FieldDBObject.DEFAULT_STRING;
      }
    },
    set: function(value) {
      if (!this.fields || !this.fields.title) {
        this.addField("title");
      }
      this.fields.title.value = value;
      if (value) {
        this._titleAsUrl = this.sanitizeStringForFileSystem(value, "_").toLowerCase();
      } else {
        this._titleAsUrl = this.dbname;
      }
    }
  },

  description: {
    configurable: true,
    get: function() {
      if (this.fields && this.fields.description) {
        return this.fields.description.value;
      } else {
        return FieldDBObject.DEFAULT_STRING;
      }
    },
    set: function(value) {
      if (!this.fields || !this.fields.description) {
        this.addField("description");
      }
      this.fields.description.value = value;
    }
  },

  keywords: {
    configurable: true,
    get: function() {
      if (this.fields && this.fields.keywords) {
        return this.fields.keywords.value;
      } else {
        return FieldDBObject.DEFAULT_STRING;
      }
    },
    set: function(value) {
      if (!this.fields || !this.fields.keywords) {
        this.addField("keywords");
      }
      this.fields.keywords.value = value;
    }
  },

  /**
   * TODO decide if we want to fetch these from the server, and keep a fossil in the object?
   * @type {Object}
   */
  team: {
    get: function() {
      if (!this._team) {
        this.team = {
          gravatar: "",
          username: "",
          _id: "team"
        };
        if (this.dbname) {
          this._team.gravatar = this._team.gravatar || this.gravatar || this._team.buildGravatar(this.dbname);
          this._team.username = this._team.username || this.dbname.split("-")[0];
        }
        if (this.id && this.rev) {
          this._team.fetch();
        }
      }
      return this._team;
    },
    set: function(value) {
      this.ensureSetViaAppropriateType("team", value);
    }
  },

  activityConnection: {
    get: function() {
      this.debug("getting activityConnection");
      if (!this._activityConnection && this.rev && this._connection) {
        this.warn("This corpus is missing its activity connection for some reason.");
        var copy = this._connection.toJSON();
        copy.dbname = copy.dbname + "-activity_feed";
        this.activityConnection = copy;
      }
      if (this._activityConnection && this._activityConnection.parent !== this) {
        this._activityConnection.parent = this;
      }
      return this._activityConnection;
    },
    set: function(value) {
      if (value) {
        value.parent = this;
        if (!value.confidential && this.confidential) {
          value.confidential = this.confidential;
        }
      }
      this.ensureSetViaAppropriateType("activityConnection", value);
    }
  },

  replicatedCorpusUrls: {
    get: function() {
      if (this._connection && this._connection.replicatedCorpusUrls) {
        return this._connection.replicatedCorpusUrls;
      }
      return FieldDBObject.DEFAULT_COLLECTION;
    },
    set: function(value) {
      if (this._connection) {
        this._connection.replicatedCorpusUrls = value;
      }
    }
  },

  olacExportConnections: {
    get: function() {
      if (this._connection && this._connection.olacExportConnections) {
        return this._connection.olacExportConnections;
      }
      return FieldDBObject.DEFAULT_COLLECTION;
    },
    set: function(value) {
      if (this._connection) {
        this._connection.olacExportConnections = value;
      }
    }
  },

  terms: {
    get: function() {
      this.warn("terms is deprecated, use termsOfUse instead.");
    },
    set: function(value) {
      this.warn("terms is deprecated, use termsOfUse instead.");
      if (!this.termsOfUse) {
        this.termsOfUse = value;
      }
    }
  },

  termsOfUse: {
    configurable: true,
    get: function() {
      if (this.fields && this.fields.rights) {
        return this.fields.rights.value;
      } else {
        return FieldDBObject.DEFAULT_STRING;
      }
    },
    set: function(value) {
      if (!this.fields || !this.fields.rights) {
        this.addField("rights");
      }
      if (value.humanReadable) {
        value = value.humanReadable;
      }
      this.fields.rights.value = value;
    }
  },

  license: {
    configurable: true,
    get: function() {
      // console.log('get license', this.fields);
      if (this.fields && this.fields.rights && this.fields.rights.json && this.fields.rights.json.license) {
        return this.fields.rights.json.license;
      } else {
        return FieldDBObject.DEFAULT_OBJECT;
      }
    },
    set: function(value) {
      // console.log('set license', this.fields, value);
      // throw (new Error('something is setting license'))
      if (!this.fields || !this.fields.rights) {
        this.addField("rights");
        this.fields.rights.json = {};
      }
      if (typeof value === "string") {
        value = {
          humanReadable: value
        };
      }
      this.fields.rights.json.license = value;
    }
  },

  copyright: {
    configurable: true,
    get: function() {
      if (this.fields && this.fields.rightsHolder) {
        return this.fields.rightsHolder.value;
      } else {
        return FieldDBObject.DEFAULT_STRING;
      }
    },
    set: function(value) {
      if (!this.fields || !this.fields.rightsHolder) {
        this.addField("rightsHolder");
      }
      this.fields.rightsHolder.value = value;
    }
  },

  startYear: {
    get: function() {
      if (this.parent && this.parent.dateCreated && this.parent._rev && this.parent._fieldDBtype === "Corpus") {
        this.dateCreated = this.parent.dateCreated;
      }
      if (this.dateCreated) {
        var year = new Date(this.dateCreated).getFullYear();
        if (year < new Date().getFullYear()) {
          this._startYear = year;
        }
      }
      return this._startYear;
    },
    set: function(value) {
      if (value === this._startYear) {
        return;
      }
      if (!value) {
        // delete this._startYear;
        return;
      }
      this._startYear = value;
    }
  },

  fetch: {
    value: function(optionalUrl) {
      var self = this;
      var deferred = Q.defer();

      this.debug("Customizing fetch ", optionalUrl);
      var fetchPromise = Database.prototype.fetch.apply(this, arguments);
      fetchPromise.then(deferred.resolve);
      fetchPromise.fail(function(err) {
        self.debug("Fetching CorpusMask failed", err);
        if (err.status === 404 && /deleted|missing/.test(err.userFriendlyErrors[0])) {
          self.warn("Repairing corpus which is missing its corpus doc: " + err.userFriendlyErrors.join(" "));
          self.loaded = true;
          var newCorpusMask = FieldDBObject.convertDocIntoItsType(self.defaults);
          newCorpusMask.dbname = self.dbname;
          self.merge("self", newCorpusMask, "overwrite");
          return deferred.resolve(self);
        }
        deferred.reject(err);
      });

      return deferred.promise;
    }
  },

  // unserializedSessions: {
  //   value: null
  // },
  sessions: {
    get: function() {
      return this.unserializedSessions || FieldDBObject.DEFAULT_COLLECTION;
    },
    set: function(value) {
      this.ensureSetViaAppropriateType("sessions", value, "unserializedSessions");
    }
  },

  // unserializedDatalists: {
  //   value: null
  // },
  datalists: {
    get: function() {
      return this.unserializedDatalists || FieldDBObject.DEFAULT_COLLECTION;
    },
    set: function(value) {
      this.ensureSetViaAppropriateType("datalists", value, "unserializedDatalists");
    }
  },

  permissions: {
    get: function() {
      if (!this._permissions) {
        this.permissions = {
          dbname: this.dbname,
          parent: this
        };
      }
      return this._permissions || FieldDBObject.DEFAULT_COLLECTION;
    },
    set: function(value) {
      this.ensureSetViaAppropriateType("permissions", value);
    }
  },

  loadPermissions: {
    value: function(dataToPost) {
      var deferred = Q.defer(),
        self = this;

      Q.nextTick(function() {

        if (!self.permissions || !(self.permissions instanceof Permissions)) {
          self.permissions = new Permissions(self.permissions);
        }
        if (!self.permissions.dbname) {
          self.permissions.dbname = self.dbname;
        }
        self.permissions.parent = self;
        self.permissions.fetch(dataToPost)
          .then(deferred.resolve, deferred.reject)
          .fail(function(error) {
            console.error(error.stack, self);
            deferred.reject(error);
          });

      });
      return deferred.promise;
    }
  },

  datumFields: {
    get: function() {
      this.debug("getting datumFields");
      return this._datumFields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("datumFields", value);
    }
  },

  sessionFields: {
    get: function() {
      this.debug("getting sessionFields");
      return this._sessionFields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("sessionFields", value);
    }
  },

  speakerFields: {
    get: function() {
      this.debug("getting speakerFields");
      return this._speakerFields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("speakerFields", value);
    }
  },

  participantFields: {
    get: function() {
      this.debug("getting participantFields");
      return this._participantFields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("participantFields", value);
    }
  },

  conversationFields: {
    get: function() {
      this.debug("getting conversationFields");
      return this._conversationFields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("conversationFields", value);
    }
  },

  fields: {
    get: function() {
      this.debug("getting fields");
      return this._fields;
    },
    set: function(value) {
      if (value && !value.confidential && this.confidential) {
        value.confidential = this.confidential;
      }
      this.ensureSetViaAppropriateType("fields", value);
    }
  },

  prefs: {
    get: function() {
      if (!this._prefs && this.INTERNAL_MODELS && this.INTERNAL_MODELS.prefs && this.INTERNAL_MODELS.prefs.prototype && this.INTERNAL_MODELS.prefs.prototype.defaults) {
        this.prefs = this.INTERNAL_MODELS.prefs.prototype.defaults;
      }
      return this._prefs;
    },
    set: function(value) {
      this.ensureSetViaAppropriateType("prefs", value);
    }
  },

  preferredDatumTemplate: {
    get: function() {
      if (this.prefs && this.prefs.preferredDatumTemplate) {
        var upgradeSucess = this.upgradeCorpusFieldsToMatchDatumTemplate(this.prefs.preferredDatumTemplate);
        if (!upgradeSucess) {
          return this.prefs.preferredDatumTemplate;
        } else {
          this.warn("preferredDatumTemplate is no longer needed");
        }
      }
    },
    set: function(value) {
      if (this.prefs && this.prefs.preferredDatumTemplate && value === this.prefs.preferredDatumTemplate) {
        return;
      }
      if (!value || value === "default") {
        if (this.prefs && this.prefs.preferredDatumTemplate) {
          delete this.prefs.preferredDatumTemplate;
        }
        return;
      }
      this.prefs = this.prefs || {};
      var upgradeSucess = this.upgradeCorpusFieldsToMatchDatumTemplate(value.trim());
      if (!upgradeSucess) {
        this.prefs.preferredDatumTemplate = value.trim();
      } else {
        this.warn("preferredDatumTemplate is no longer needed");
      }
    }
  },

  upgradeCorpusFieldsToMatchDatumTemplate: {
    value: function(value) {
      if (this.preferredDatumTemplateAtVersion) {
        return true;
      }
      if (!this.datumFields.reorder) {
        this.warn("could not upgrade corpus fields order to match data entry template for the spreadsheet app ");
        return false;
      }
      this.preferredDatumTemplateAtVersion = this.version;
      this.preferredDatumTemplate = null;
      this.prefs = this.prefs || {};
      this.prefs.debug(" this.prefs.preferredSpreadsheetShape.rows ", this.prefs.preferredSpreadsheetShape.rows);
      var order = ["judgement", "utterance", "morphemes", "gloss", "translation", "context", "documentation"];
      if (value === "compacttemplate") {
        order = ["judgement", "utterance", "morphemes", "gloss", "translation"];

      } else if (value === "fulltemplate") {
        order = ["judgement", "utterance", "morphemes", "gloss", "translation", "context", "documentation"];

      } else if (value === "mcgillfieldmethodsspring2014template") {
        order = ["judgement", "utterance", "morphemes", "gloss", "translation", "validationStatus", "tags"];

      } else if (value === "mcgillfieldmethodsfall2014template") {
        order = ["judgement", "utterance", "morphemes", "gloss", "translation", "phonetic", "notes"];

      } else if (value === "yalefieldmethodsspring2014template") {
        order = ["judgement", "orthography", "utterance", "morphemes", "gloss", "translation", "spanish", "Housekeeping", "tags"];
        this.prefs.debug("setting to yalefieldmethodsspring2014template");
        this.prefs.preferredSpreadsheetShape = this.prefs.preferredSpreadsheetShape;
        this.prefs.preferredSpreadsheetShape.rows = 4;
      }

      var fieldTemplate = {
        "label": "",
        "shouldBeEncrypted": false,
        "showToUserTypes": "all",
        "defaultfield": false,
        "value": "",
        "mask": "",
        "json": {},
        "help": "You can add help/conventions here which explain what this data entry field is for your teammates."
      };
      for (var expectedPosition = 0; expectedPosition < order.length; expectedPosition++) {
        var currentPosition = this.datumFields.indexOf(order[expectedPosition]);
        if (currentPosition === -1) {
          var newField = JSON.parse(JSON.stringify(fieldTemplate));
          // newField.id = order[expectedPosition];
          newField.label = order[expectedPosition];
          this.datumFields.add(newField);
          currentPosition = this.datumFields.length - 1;
        }
        if (currentPosition === expectedPosition) {
          this.debug(order[expectedPosition] + " Field was in the correct order. ");
        } else {
          this.debug(currentPosition + " moving to" + expectedPosition);

          this.datumFields.reorder(currentPosition, expectedPosition);
        }
      }
      var resultingOrder = this.datumFields.map(function(field) {
        return field.id;
      });
      this.warn("reordered fields to " + resultingOrder);

      return true;
    }
  },

  preferredLocale: {
    get: function() {
      if (this.prefs && this.prefs.preferredLocale) {
        return this.prefs.preferredLocale;
      }
    },
    set: function(value) {
      if (this.prefs && this.prefs.preferredLocale && value === this.prefs.preferredLocale) {
        return;
      }
      if (!value || value === "default") {
        if (this.prefs && this.prefs.preferredLocale) {
          delete this.prefs.preferredLocale;
        }
        return;
      }
      this.prefs = this.prefs || {};
      this.prefs.preferredLocale = value.trim();
    }
  },

  preferredDashboardLayout: {
    get: function() {
      if (this.prefs && this.prefs.preferredDashboardLayout) {
        return this.prefs.preferredDashboardLayout;
      }
    },
    set: function(value) {
      if (this.prefs && this.prefs.preferredDashboardLayout && value === this.prefs.preferredDashboardLayout) {
        return;
      }
      if (!value || value === "default") {
        if (this.prefs && this.prefs.preferredDashboardLayout) {
          delete this.prefs.preferredDashboardLayout;
        }
        return;
      }
      this.prefs = this.prefs || {};
      this.prefs.preferredDashboardLayout = value.trim();
    }
  },

  preferredTemplate: {
    get: function() {
      this.warn("preferredTemplate is deprecated, use preferredDatumTemplate instead.");
      return this.preferredDatumTemplate;
    },
    set: function(value) {
      this.warn("preferredTemplate is deprecated, please use preferredDatumTemplate instead.");
      this.preferredDatumTemplate = value;
    }
  },

  toJSON: {
    value: function(includeEvenEmptyAttributes, removeEmptyAttributes) {
      this.debug("Customizing toJSON ", includeEvenEmptyAttributes, removeEmptyAttributes);

      var json = Database.prototype.toJSON.apply(this, arguments);
      if (!json) {
        this.warn("Not returning json right now.");
        return;
      }

      this.debug("saving description, title, termsOfUse, license  as the deprecated attribute");
      json.title = this.title;
      json.description = this.description;
      json.termsOfUse = this.termsOfUse;
      json.license = this.license;
      json.copyright = this.copyright;

      this.debug(json);
      return json;
    }
  }

});
exports.CorpusMask = CorpusMask;
