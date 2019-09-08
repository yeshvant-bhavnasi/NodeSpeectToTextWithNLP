const nlp = require("compromise");
const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();
const async = require("async");
var lastQuestion = "";
var currentQuestion = "";
var policyHolder = "";

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

function findAnnotations(text) {
  var metadata = [];
  var taggedTranscript = text.toLowerCase();
  var currentAnnotation = {};

  let sentences = nlp(text)
    .sentences()
    .data();
  // //each of these sentences are probably related to each other

  // return Promise.mapSeries(sentences,
  return new Promise(function(resolve, reject) {
    currentQuestion = "";
    var currentAnnotations = [];
    async.eachSeries(
      sentences,
      function(aSentence, callback) {
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
              // metadata.push({
              //   key: "question",
              //   value: element.question
              // });
              currentQuestion = element.question;
              if (
                element.subject !== undefined &&
                element.subject.trim().length != 0
              ) {
                // metadata.push({
                //   key: "subject",
                //   value: element.subject
                // });
              }
            });
          } else if (
            normaltext.includes("safe to drive") ||
            normaltext.includes("airbag") ||
            normaltext.includes("equipment failure") ||
            normaltext.includes("vehicle towed") ||
            normaltext.includes("rental car")
          ) {
            currentQuestion = text;
          }
          //check for policy info
          let policyNumber = getPolicyData(normaltext, entities);

          if (policyNumber !== undefined && policyNumber.length > 0) {
            metadata.push({
              key: "policyNumber",
              value: policyNumber
            });
            var re = /(\d)\s+(?=\d)/g;
            taggedTranscript = taggedTranscript.replace(re, "$1");
            taggedTranscript = taggedTranscript.replace(/-/g, "");

            taggedTranscript = taggedTranscript.replace(
              policyNumber,
              "<span>" + policyNumber + "</span>"
            );
          }

          //check for loss types
          let probableLossType = findLossType(normaltext, entities);
          if (probableLossType !== undefined && probableLossType.length > 0) {
            annotations.lossTypes.push(probableLossType);
            metadata.push({
              key: "lossType",
              value: probableLossType
            });
            currentAnnotation.lossTypes = probableLossType;

            taggedTranscript = taggedTranscript.replace(
              probableLossType,
              "<span>" + probableLossType + "</span>"
            );
          }

          //check for vehicle
          let vehicle = getVehicle(normaltext, entities);
          if (vehicle !== undefined) {
            annotations.vehicles.push(vehicle);
            if (vehicle.model !== undefined && vehicle.model.length > 0)
              metadata.push({
                key: "model",
                value: vehicle.model
              });
            if (vehicle.make !== undefined && vehicle.make.length > 0)
              metadata.push({
                key: "make",
                value: vehicle.make
              });
            if (vehicle.year !== undefined && vehicle.year.length > 0)
              metadata.push({
                key: "year",
                value: vehicle.year
              });
            if (
              vehicle.licensePlate !== undefined &&
              vehicle.licensePlate.length > 0
            )
              metadata.push({
                key: "licenseplate",
                value: vehicle.licenseplate
              });
            metadata.push({
              key: "vehicle",
              value: Object.values(vehicle).join(",")
            });
            currentAnnotation.vehicles = vehicle;
            taggedTranscript = taggedTranscript.replace(
              vehicle.make,
              "<span>" + vehicle.make + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              vehicle.model,
              "<span>" + vehicle.model + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              vehicle.year,
              "<span>" + vehicle.year + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              vehicle.licensePlate,
              "<span>" + vehicle.licensePlate + "</span>"
            );
          }

          //check for persons
          let persons = getPerson(normaltext, entities);
          if (persons.length > 0) {
            if (currentQuestion !== undefined && currentQuestion.length > 0) {
              policyHolder = persons[0];
            }

            annotations.persons.push(persons);
            currentAnnotation.persons = persons;
            persons.forEach(element => {
              metadata.push({
                key: "person",
                value: element
              });
              taggedTranscript = taggedTranscript.replace(
                element,
                "<span>" + element + "</span>"
              );
            });
          }
          //check for locations
          let locations = getLocations(entities);
          if (locations !== undefined && locations.length > 0) {
            metadata.push({
              key: "location",
              value:
                locations[0].street_number +
                " \n" +
                locations[0].street_name +
                ", \n" +
                locations[0].locality +
                ", \n" +
                locations[0].broad_region
            });
            if (locations[0].street_name !== undefined) {
              metadata.push({
                key: "street name",
                value: locations[0].street_name
              });
            }
            taggedTranscript = taggedTranscript.replace(
              locations[0].locality.toLowerCase(),
              "<span>" + locations[0].locality + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              locations[0].street_name.toLowerCase(),
              "<span>" + locations[0].street_name + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              locations[0].broad_region.toLowerCase(),
              "<span>" + locations[0].broad_region + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              locations[0].narrow_region.toLowerCase(),
              "<span>" + locations[0].narrow_region + "</span>"
            );
            taggedTranscript = taggedTranscript.replace(
              locations[0].street_number.toLowerCase(),
              "<span>" + locations[0].street_number + "</span>"
            );

            //taggedTranscript.replace(vehicle.locations,'<span>'+vehicle.locations+'</span>');
          }

          //check for dates
          // let parsedDate = getDate(normaltext, entities);
          // if (parsedDate !== undefined && parsedDate.length > 0) {
          //   annotations.dates.push(parsedDate);
          //   currentAnnotation.dates = parsedDate;
          //   metadata.push({
          //     key: "date",
          //     value: parsedDate
          //   });
          //   taggedTranscript = taggedTranscript.replace(
          //     parsedDate,
          //     "<span>" + parsedDate + "</span>"
          //   );
          // }

          //check for numbers
          // let numbers = getNumber(normaltext, entities);
          // if (numbers !== undefined && numbers.length > 0) {
          //   metadata.push({
          //     key: "number",
          //     value: numbers
          //   });
          //   taggedTranscript = taggedTranscript.replace(
          //     numbers,
          //     "<span>" + numbers + "</span>"
          //   );
          // }
          callback(null, currentAnnotation);
        });
      },
      function done(err, results) {
        //now check for damage type

        if (text.includes("front") && text.includes("bumper")) {
          metadata.push({
            key: "damageLocation",
            value: "frontBumper"
          });
        } else if (
          text.includes("front") &&
          text.includes("left") &&
          text.includes("corner")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontLeftCorner"
          });
        } else if (
          text.includes("front") &&
          text.includes("right") &&
          text.includes("corner")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontRightCorner"
          });
        } else if (
          text.includes("front") &&
          text.includes("right") &&
          text.includes("side")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontRightSide"
          });
        } else if (
          text.includes("front") &&
          text.includes("left") &&
          text.includes("side")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontLeftSide"
          });
        } else if (
          text.includes("front") &&
          text.includes("left") &&
          text.includes("door")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontLeftDoor"
          });
        } else if (
          text.includes("front") &&
          text.includes("right") &&
          text.includes("door")
        ) {
          metadata.push({
            key: "damageLocation",
            value: "frontRightDoor"
          });
        } else if (text.includes("windshield")) {
          metadata.push({
            key: "damageLocation",
            value: "windshield"
          });
        } else if (text.includes("hood")) {
          metadata.push({
            key: "damageLocation",
            value: "hood"
          });
        }

        if (
          lastQuestion !== undefined &&
          lastQuestion.length > 0 &&
          (nlp(lastQuestion).match("describe").found ||
            nlp(lastQuestion).match("described").found)
        ) {
          metadata.push({
            key: lastQuestion + "?",
            value: text
          });

          taggedTranscript = "<span>" + text + "</span>";
          lastQuestion = "";
        } else if (
          lastQuestion !== undefined &&
          lastQuestion.length > 0 &&
          nlp(text).match("yes").found
        ) {
          metadata.push({
            key: lastQuestion + "?",
            value: "yes"
          });
          taggedTranscript = taggedTranscript.replace(
            "yes",
            "<span>yes</span>"
          );
          lastQuestion = "";
        } else if (
          lastQuestion !== undefined &&
          lastQuestion.length > 0 &&
          nlp(text).match("no").found
        ) {
          metadata.push({
            key: lastQuestion + "?",
            value: "no"
          });
          lastQuestion = "";
          taggedTranscript = taggedTranscript.replace("no", "<span>no</span>");
        } else if (lastQuestion !== undefined && lastQuestion.length > 0) {
          taggedTranscript = "<span>" + taggedTranscript + "</span>";
          metadata.push({
            key: lastQuestion + "?",
            value: text
          });
          lastQuestion = "";
        }

        console.log(policyHolder);

        lastQuestion = currentQuestion;
        resolve({
          annotations: metadata,
          taggedTranscript: taggedTranscript,
          policyHolder: policyHolder
        });
      }
    );
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

function getNumber(text, entities) {
  text = text.replace(/-/g, "");
  let doc = nlp(text);
  let number = doc.values().out();
  return number;
}

function getQuestionWithSubject(text) {
  text = text.replace("yes", "");
  text = text.replace("okay", "");
  text = text.replace("no", "");
  text = text.replace("sure", "");
  text = text.replace("ok", "");
  text = text.replace("and", "");
  text = text.replace("it", "");

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
  return questions;
}

function getDate(text, entities) {
  let doc = nlp(text);
  let parsedDate = doc.dates().out();

  entities.forEach(element => {
    if (element.type === "DATE") {
      return element.name;
    }
  });
  if (parsedDate.length != 0 && parsedDate !== undefined) return parsedDate;
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
    vehicle.make !== undefined ||
    vehicle.year !== undefined ||
    vehicle.model !== undefined ||
    vehicle.licensePlate !== undefined
  ) {
    return vehicle;
  }
}

function getLossDescription(conversation) {}

function getPolicyNumber(text, entities) {
  let policyNumber = "";
  if (
    nlp(text)
      .values()
      .out().length == 0
  ) {
    entities.forEach(element => {
      if (element.type === "PHONE_NUMBER") {
        policyNumber = element.name.replace(/-/g, "");
      }
    });
    return policyNumber;
  }

  return nlp(text)
    .values()
    .out();
}
function getPolicyData(text, entities) {
  let doc = nlp(text);
  if (doc.match("policy").found) {
    return getNumber(text, entities);
  }
}

module.exports = {
  annotations: findAnnotations
};
