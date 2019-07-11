const express = require("express");
const app = express();
const path = require("path");
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const {analyzeSentiment, entitiesDetection} = require('./gcp/nlp');
const cors = require('cors');

//dictionary saving the conversation
let converstation = []
let conversationList = [];

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + "/node_modules"));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get("/", (req, res) => {
  res.render('index',{converstation});
});

app.get("/transcript", (req, res) => {
	res.json(converstation);
});


app.use(cors());

server = app.listen(3000);
const io = require("socket.io")(server);

io.on("connection", socket => {
  console.log("New User Connected");
  socket.username = "Anonymous";

  //list on change_username
  socket.on("change_username", data => {
		socket.username = data.username;
		console.log("username changed to : "+data.username);
	});

	socket.on("conversation_end", data => {
		console.log("got clear request");
		conversationList.push(converstation);
		converstation = [];
		socket.emit('reset', {});
	});

	socket.on("transcript", data => {
		if (!socket.username) {
			console.error("user is not set up yet");
			console.warn("ananumous transcript: ");
			console.log(data);
			return;
		}
		analyzeSentiment(data.transcript)
		 .then(results => {
			data['annotations'] = results[0].documentSentiment;
			//send for nlp and capture annotations
			data['user'] = socket.username;
			 entitiesDetection(data.transcript)
				 .then(res => {
					 data['entities'] = res[0].entities;
					 converstation.push(data);
					 io.emit('render', converstation);
				 });
    })
    .catch(err => {
      console.error('ERROR:', err);
    });


	});
});
