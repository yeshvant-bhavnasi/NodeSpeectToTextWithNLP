const nlp = require("compromise");
const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();
const async = require('async');

var annotations = {
  lossTypes: [],
  questions: [],
  policyNumbers: [],
  vehicles: [],
  persons: [],
  locations: [],
  lossdescriptions: "",
  dates: []
};

function entitiesDetection(text) {
  const document = {
    content: text,
    type: "PLAIN_TEXT"
  };
  return client.analyzeEntities({ document });
}

function findAnnotations(text, lastTextFromAgent) {
  var metadata = [];
  var taggedTranscript = text;
  var currentAnnotation = {};

  let sentences = nlp(text)
    .sentences()
    .data();
  // //each of these sentences are probably related to each other

  // return Promise.mapSeries(sentences,
  return new Promise(function(resolve, reject) {
    var currentAnnotations = [];
    async.eachSeries(sentences,function(aSentence,callback) {
      currentAnnotation = {};
      let normaltext = aSentence.normal;

      entitiesDetection(normaltext).then(function(data) {
        let entities = data[0].entities;
        //check if lastTextFromAgent was question
        let questionsData = getQuestionWithSubject(text);

        if (questionsData.length > 0) {
          annotations.questions.push(questionsData);
          currentAnnotation.questions = questionsData;

          questionsData.forEach(element => {
            metadata.push({
              'key':'question',
              'value':element.question
            });
            metadata.push({
              'key':'subject in quesrtion',
              'value':element.subject
            });
            taggedTranscript= taggedTranscript.replace(element,'<span>'+element+'</span>');
          });
        }
        //check for policy info
        let policyNumber = getPolicyData(normaltext);
        if (policyNumber !== undefined && policyNumber.length > 0) {
          annotations.policyNumbers.push(policyNumber);
          metadata.push({
            'key': 'policyNumber',
            'value':policyNumber
          });
          currentAnnotation["policyNumbers"] = policyNumber;
          taggedTranscript = taggedTranscript.replace(policyNumber,'<span>'+policyNumber+'</span>');
        }

        //check for loss types
        let probableLossType = findLossType(normaltext, entities);
        if (probableLossType !== undefined && probableLossType.length > 0) {
          annotations.lossTypes.push(probableLossType);
          metadata.push({
            'key': 'lossType',
            'value':probableLossType
          });
          currentAnnotation.lossTypes = probableLossType;
          taggedTranscript= taggedTranscript.replace(probableLossType,'<span>'+probableLossType+'</span>');
        }

        //check for vehicle
        let vehicle = getVehicle(normaltext, entities);
        if (vehicle !== undefined) {
          annotations.vehicles.push(vehicle);
          metadata.push({
            'key': 'vehicle',
            'value':vehicle
          });
          currentAnnotation.vehicles = vehicle;
          taggedTranscript= taggedTranscript.replace(vehicle.make,'<span>'+vehicle.make+'</span>');
          taggedTranscript= taggedTranscript.replace(vehicle.model,'<span>'+vehicle.model+'</span>');
          taggedTranscript= taggedTranscript.replace(vehicle.year,'<span>'+vehicle.year+'</span>');
          taggedTranscript= taggedTranscript.replace(vehicle.licensePlate,'<span>'+vehicle.licensePlate+'</span>');
        }

        //check for persons
        let persons = getPerson(normaltext, entities);
        if (persons.length > 0) {
          annotations.persons.push(persons);
          currentAnnotation.persons = persons;
          persons.forEach(element => {
            metadata.push({
              'key': 'person',
              'value':element
            });
            taggedTranscript= taggedTranscript.replace(element,'<span>'+element+'</span>');
          });

        }

        //check for locations
        let locations = getLocations(entities);
        if (locations !== undefined) {
          annotations.locations.push(locations);
          currentAnnotation.locations = locations;
          metadata.push({
            'key': 'location',
            'value':locations
          });
          taggedTranscript = taggedTranscript.replace(locations.locality,'<span>'+locations.locality+'</span>');
          taggedTranscript = taggedTranscript.replace(locations.street_name,'<span>'+locations.street_name+'</span>');
          taggedTranscript = taggedTranscript.replace(locations.broad_region,'<span>'+locations.broad_region+'</span>');
          taggedTranscript = taggedTranscript.replace(locations.narrow_region,'<span>'+locations.narrow_region+'</span>');
          taggedTranscript = taggedTranscript.replace(locations.street_number,'<span>'+locations.street_number+'</span>');



          //taggedTranscript.replace(vehicle.locations,'<span>'+vehicle.locations+'</span>');
        }

        //check for dates
        let parsedDate = getDate(normaltext);
        if (parsedDate !== undefined && parsedDate.length > 0) {
          annotations.dates.push(parsedDate);
          currentAnnotation.dates = parsedDate;
          metadata.push({
            'key': 'date',
            'value':parsedDate
          });
          taggedTranscript = taggedTranscript.replace(parsedDate,'<span>'+parsedDate+'</span>');

        }

        //check for numbers
        let numbers = getNumber(normaltext);
        if (numbers !== undefined && numbers.length > 0) {
          numbers.split(" ").forEach(element => {
            metadata.push({
              'key': 'number',
              'value':element
            })
            taggedTranscript = taggedTranscript.replace(element,'<span>'+element+'</span>');

          });
        }
        callback(null,currentAnnotation);
      });
    },
    function done(err,results) {
      resolve({'annotations':metadata,
      'taggedTranscript':taggedTranscript
      });
    });
  });

}

function findLossType(text, entities) {
  let nouns = nlp(text)
    .nouns()
    .out();
  let lossType;
  entities.forEach(element => {
    if (element.type === "EVENT") {
      if (nouns.indexOf(element.name) >= 0) {
        lossType = element.name;
      }

    }
  });
  return lossType;
}

function getNumber(text) {
  let doc = nlp(text);
  return doc.match("#Value").out("text").replace(" ","").trim();
}

function getQuestionWithSubject(text) {
  console.log(text);
  let doc = nlp(text);
  let questions = [];

  doc
    .questions()
    .data()
    .forEach(element => {
      questions.push({
        subject: nlp(element.normal)
          .nouns()
          .out(),
        question: element.normal
      });
    });
    console.log("questions:" +questions);
  return questions;
}

function getDate(text) {
  let doc = nlp(text);
  let parsedDate = doc.dates().out();
  if(parsedDate.length != 0 && parsedDate !== undefined)
    return parsedDate

}

function getPerson(text, entities) {
  let persons = [];
  let doc = nlp(text);
  let personsText = doc.people().out();
  entities.forEach(element => {
    if (element.type === "PERSON") {
      if (element.name) {
        persons.push(element.name);
      }
    }
  });
  return persons;
}

function getLocations(entities) {
  let locations = [];
  entities.forEach(element => {
    if (element.type === "ADDRESS") {
      if (element.metadata !== null) {
        locations.push(element.metadata);
      }
    }
  });
  if(locations.length > 0)
    return locations;
}

function getVehicle(text, entities) {
  let vehicle = {};
  if (nlp(text).match("license plate").found) {
    vehicle.licensePlate = getNumber(text);
  }

  entities.forEach(element => {
    if (element.type === "CONSUMER_GOOD") {
      vehicle.model = element.name;
    }
    if (element.type === "ORGANIZATION") {
      vehicle.make = element.name;
    }
    if (element.type === "DATE") {
      vehicle.year = element.name;
    }
  });

  if (
    vehicle.make !== undefined &&
    vehicle.year !== undefined &&
    vehicle.model !== undefined &&
    vehicle.licensePlate !== undefined
  ) {
    return vehicle;
  }
}

function getLossDescription(conversation) {}

function getPolicyData(text) {
  let doc = nlp(text);
  if (doc.match("policy").found) {
    return getNumber(text);
  }
}


module.exports = {
  annotations: findAnnotations
}
