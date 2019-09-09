# NodeSpeectToTextWithNLP
- Web page audio into text and performing nlp on it

- This is a simple server code to have conversation between two people
- We are using google speach to text javascript client.
- compromise "compromise": "^11.13.2"
- goolge language node.js client to perform sentiment analysis and entity recognition.

##steps to have this running
- Make sure your credentials file is present on your local for me it is present on: ~/dev/bin/Transformers-cred.json
- pull latest image from docker: https://hub.docker.com/r/ybhavnasi/transformer
- run the docker command
`docker run -v ~/dev/bin:/secret -p 3000:3000 -d ybhavnasi/transformer`
