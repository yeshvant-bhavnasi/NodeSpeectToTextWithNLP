// Imports the Google Cloud client library
const language = require('@google-cloud/language');

// Instantiates a client
const client = new language.LanguageServiceClient();


module.exports.analyzeSentiment = function(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects the sentiment of the text
  return client
    .analyzeSentiment({document: document})
};

module.exports.entitiesDetection = function(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  return client
      .analyzeEntities({document});

}


