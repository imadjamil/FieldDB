define([ 
    "backbone",
    "libs/OPrime"
], function(
    Backbone
) {
  var UserMask = Backbone.Model.extend(
  /** @lends UserMask.prototype */
  {
    /**
     * @class A mask of a user which can be saved along with the corpus. It is
     *        generally just a username and gravatar but could be more depending
     *        on what the user allows to be public.
     * 
     * 
     * @extends Backbone.Model
     * @constructs
     */
    initialize : function() {
      OPrime.debug("UserMask init");
      
    },
    /**
     * backbone-couchdb adaptor set up
     */
    
    // The couchdb-connector is capable of mapping the url scheme
    // proposed by the authors of Backbone to documents in your database,
    // so that you don't have to change existing apps when you switch the sync-strategy
    url : "/users",
    
    defaults : {
      gravatar :  "user/user_gravatar.png"
    },
    
    /**
     * this function makes it possible to save the UserMask with a
     * hardcoded id, it uses pouch's API directly for the first save, and then backbone/pouch save for the rest
     * 
     * @param successcallback
     * @param failurecallback
     */
    saveAndInterConnectInApp : function(successcallback, failurecallback){
      OPrime.debug("Saving the UserMask");
      var self = this;
        
        if(OPrime.isBackboneCouchDBApp()){
          if(self.get("pouchname")){
            self.unset("pouchname");
          }
          self.save(null, {
            success : function(model, response) {
              if(typeof successcallback == "function"){
                successcallback();
              }
            },error : function(e,f,g) {
              OPrime.debug('UserMask save error ' + f.reason);
              self.fetch({
                error : function(model, xhr, options) {
                  OPrime.bug("There was an error fetching your UserMask in this corpus.");
                  if(typeof successcallback == "function"){
                    successcallback();
                  }
                },
                success : function(model, response, options) {
                  OPrime.bug("Overwriting your UserMask in this corpus, with your UserMask from your preferences.");
                  self._rev = model.get("_rev");
                  self.set("_rev", model.get("_rev"));
                  self.save();
                  
                  if(typeof successcallback == "function"){
                    successcallback();
                  }
                }
              });
            }
          });
          return;
        }
        
        self.pouch(function(err,db){
//          self.set("id", this.id); //TODO might not be necessary
          var modelwithhardcodedid = self.toJSON();
//          modelwithhardcodedid._id = this.id; //this is set by authentication when it first creates the usermask
          if(! modelwithhardcodedid._id){
            if(modelwithhardcodedid.id){
              modelwithhardcodedid._id = modelwithhardcodedid.id; //this is set by authentication when it first creates the usermask
            }else{
              OPrime.debug("Trying to save user mask too early, before it has an _id. not saving...but pretending it worked", modelwithhardcodedid);
              if(typeof successcallback == "function"){
                successcallback();
              }
              return;
              OPrime.debug("bug: the user mask doesnt have an _id, it wont save properly, trying to take the id from the user "+window.app.get("authentication").get("userPrivate").id);
              modelwithhardcodedid._id = window.app.get("authentication").get("userPrivate").id;
            }
          }
          
          db.put(modelwithhardcodedid, function(err, response) {
            if(err){
              OPrime.debug("UserMask put error", err);
              if(err.status == "409"){
                  //find out what the rev is in the database by fetching
                  self.fetch({
                    success : function(model, response) {
                      OPrime.debug("UserMask fetch revision number success, after getting a Document update conflict", response);
                      
                      modelwithhardcodedid._rev = self.get("_rev");
                      OPrime.debug("Usermask old version", self.toJSON());
                      OPrime.debug("Usermask replaced with new version", modelwithhardcodedid );
                      
                      db.put(modelwithhardcodedid, function(err, response) {
                        if(err){
                          OPrime.debug("UserMask put error, even after fetching the version number",err);
                          if(typeof failurecallback == "function"){
                            failurecallback();
                          }
                        }else{
                          OPrime.debug("UserMask put success, after fetching its version number and overwriting it", response);
                          //this happens on subsequent save into pouch of this usermask's id
                          if(typeof successcallback == "function"){
                            successcallback();
                          }
                        }
                      });
                      
                    },
                    //fetch error
                    error : function(e) {
                      OPrime.debug('UserMask fetch error after trying to resolve a conflict error' + JSON.stringify(err));
                      if(typeof failurecallback == "function"){
                        failurecallback();
                      }
                    }
                  });
              }else{
                OPrime.debug('UserMask put error that was not a conflict' + JSON.stringify(err));
                //this is a real error, not a conflict error
                if(typeof failurecallback == "function"){
                  failurecallback();
                }
              }
            //this happens on the first save into pouch of this usermask's id
            }else{
              OPrime.debug("UserMask put success", response);
              if(typeof successcallback == "function"){
                successcallback();
              }
            }
          });
        });
    }
  });

  return UserMask;
});